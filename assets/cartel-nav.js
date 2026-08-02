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

  function menus(nav) {
    return Array.prototype.slice.call(nav.querySelectorAll('details'));
  }

  function closeAll(nav, except) {
    menus(nav).forEach(function (d) {
      if (d !== except && d.open) d.open = false;
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
    if (!details.open) details.open = true;
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

    /* clicking the pill on a hover device must not slam the panel shut */
    Array.prototype.forEach.call(nav.querySelectorAll('summary'), function (summary) {
      summary.addEventListener('click', function (event) {
        if (!canHover()) return;
        event.preventDefault();
        open(nav, summary.parentElement);
      });
    });

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
