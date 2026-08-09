/* ============================================================
   Cartel Lash Supply — batch 5: hover-open header menus
   Dawn opens <details> on click only. The approved design opens the
   mega menu on hover and closes it when the pointer leaves the header.
   Setting details.open fires the native `toggle` event, so Dawn's own
   HeaderMenu/DetailsDisclosure logic still runs untouched.
   Touch / keyboard behaviour is left exactly as Dawn ships it.
   ============================================================ */
(function () {
  var CLOSE_DELAY = 140;
  var closeTimer = null;

  function canHover() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches && window.innerWidth >= 990;
  }

  /* TOP-LEVEL menus only. querySelectorAll('details') returned a FLAT list, so
     closeAll() also shut the clicked item's own level-1 ancestor: in dropdown
     mode a level-2 disclosure opened inside a menu that had just been closed,
     and its level-3 links were unreachable by click OR hover (hover is bound to
     top-level <li> only, and the summary handler preventDefault()s the native
     toggle). Nested <details> now keep Dawn's own behaviour untouched. */
  function menus(nav) {
    return Array.prototype.slice.call(nav.querySelectorAll(':scope > ul > li > details'));
  }

  /* global.js gives these summaries role="button" + aria-expanded and only
     re-syncs the attribute inside its own click listener. role="button" hides
     <details>'s implicit expanded state from the accessibility tree, so every
     programmatic open/close here must write the attribute too — otherwise a
     hover-opened panel reads "collapsed" and a hover-closed one reads
     "expanded", with aria-controls pointing at an unrendered node. */
  function setOpen(details, open) {
    if (!details || details.open === open) return;
    details.open = open;
    var summary = details.querySelector(':scope > summary');
    if (summary) summary.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function closeAll(nav, except) {
    menus(nav).forEach(function (d) {
      if (d !== except) setOpen(d, false);
    });
  }

  /* centre a single-level dropdown (About) under its own pill */
  function positionCondensed(details) {
    var list = details.querySelector('.mega-menu__list--condensed');
    var summary = details.querySelector('summary');
    if (!list || !summary || !list.offsetParent) return;
    list.style.setProperty('--cl-pop-x', '0px');
    var base = list.offsetLeft;
    var parent = list.offsetParent.getBoundingClientRect();
    var rect = summary.getBoundingClientRect();
    var center = rect.left + rect.width / 2 - parent.left;
    list.style.setProperty('--cl-pop-x', center - base + 'px');
  }

  function open(nav, details) {
    closeAll(nav, details);
    setOpen(details, true);
    positionCondensed(details);
  }

  function init(root) {
    var nav = (root || document).querySelector('.header__inline-menu');
    if (!nav || nav.dataset.clHover === 'on') return;
    nav.dataset.clHover = 'on';

    Array.prototype.forEach.call(nav.querySelectorAll(':scope > ul > li'), function (li) {
      var details = li.querySelector('details');
      li.addEventListener('mouseenter', function () {
        if (!canHover()) return;
        clearTimeout(closeTimer);
        if (details) open(nav, details);
        else closeAll(nav, null);
      });
    });

    /* Clicking the pill on a hover device must not slam the panel shut when the
       pointer merely passed over it — but it must still TOGGLE. Unconditionally
       reopening meant the panel could never be closed from the pill, which also
       trapped keyboard users (Enter on a <summary> dispatches a click).
       Setting details.open fires the native toggle event, so Dawn's own
       DetailsDisclosure close logic still runs. */
    Array.prototype.forEach.call(
      nav.querySelectorAll(':scope > ul > li > details > summary'),
      function (summary) {
        summary.addEventListener('click', function (event) {
          if (!canHover()) return;
          event.preventDefault();
          var details = summary.parentElement;
          if (details && details.open) {
            setOpen(details, false);
          } else {
            open(nav, details);
          }
        });
      }
    );

    var bar = nav.closest('.header-wrapper') || nav;
    /* mouseleave ignores descendants, and the panel IS a descendant,
       so this only fires once the pointer is truly out of the header */
    bar.addEventListener('mouseleave', function () {
      if (!canHover()) return;
      closeTimer = setTimeout(function () {
        closeAll(nav, null);
      }, CLOSE_DELAY);
    });
    bar.addEventListener('mouseenter', function () {
      clearTimeout(closeTimer);
    });

    window.addEventListener('resize', function () {
      menus(nav).forEach(function (d) {
        if (d.open) positionCondensed(d);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init(document);
    });
  } else {
    init(document);
  }
  /* theme editor re-renders the header section */
  document.addEventListener('shopify:section:load', function (event) {
    init(event.target);
  });
})();
