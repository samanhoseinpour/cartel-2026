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
  var resizeHandler = null;
  var resizeTimer = null;

  function canHover() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches && window.innerWidth >= 990;
  }

  /* TOP-LEVEL menus only. querySelectorAll('details') returned a FLAT list, so
     closeAll() also shut the clicked item's own level-1 ancestor: in dropdown
     mode a level-2 disclosure opened inside a menu that had just been closed,
     and its level-3 links were unreachable by click OR hover (hover is bound to
     top-level <li> only, and the summary handler preventDefault()s the native
     toggle). Nested <details> now keep Dawn's own behaviour untouched.

     Both header snippets wrap that top-level <details> in Dawn's <header-menu>
     custom element, so the child combinator has to step through it. Without the
     second branch this list came back EMPTY: closeAll() was a silent no-op, the
     hovered panel stayed open until it was clicked shut, and two menus could be
     open at once. */
  var TOP_MENUS = ':scope > ul > li > details, :scope > ul > li > header-menu > details';

  function menus(nav) {
    return Array.prototype.slice.call(nav.querySelectorAll(TOP_MENUS));
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

  /* centre a single-level dropdown (About) under its own pill.

     The old version wrote --cl-pop-x to 0px and then immediately read
     list.offsetLeft — a write followed by a read of the same subtree, which
     forces a synchronous relayout of the header every time. It ran on every
     hover-open, not just on resize.

     `base` (the list's un-offset position) only changes when the header is laid
     out again, so it is measured once per element and cached, and the cache is
     dropped on resize. Steady-state hovering now does reads only. */
  var BASE = new WeakMap();

  function positionCondensed(details) {
    var list = details.querySelector('.mega-menu__list--condensed');
    var summary = details.querySelector('summary');
    if (!list || !summary || !list.offsetParent) return;

    var base = BASE.get(list);
    if (base === undefined) {
      list.style.setProperty('--cl-pop-x', '0px');
      base = list.offsetLeft;
      BASE.set(list, base);
    }
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

    /* On a hover device the panel is already open by the time the pill is
       clicked, so a click has one job left: go where the menu item points.
       The header snippets put link.url on the <summary> as data-href (a
       <summary> has no href of its own). Only a real pointer click navigates:
       Enter/Space on a <summary> also dispatches a click, but with detail 0,
       and keyboard users still need the pill to TOGGLE the panel (they have no
       hover). Touch keeps Dawn's native toggle because canHover() is false.
       Cmd/Ctrl-click and middle-click open a new tab, as they would on an <a>.
       A blank or "#" menu link (nothing to go to) falls back to the toggle.

       Toggle path: clicking the pill must not slam the panel shut when the
       pointer merely passed over it — but it must still toggle. Unconditionally
       reopening meant the panel could never be closed from the pill, which also
       trapped keyboard users. Setting details.open fires the native toggle
       event, so Dawn's own DetailsDisclosure close logic still runs. */
    function navTarget(summary) {
      var href = (summary.getAttribute('data-href') || '').trim();
      if (!href || href === '#' || href.charAt(0) === '#') return '';
      return href;
    }

    menus(nav).forEach(function (details) {
      var summary = details.querySelector(':scope > summary');
      if (!summary) return;
      summary.addEventListener('click', function (event) {
        if (!canHover()) return;
        event.preventDefault();
        var href = navTarget(summary);
        if (href && event.detail > 0) {
          if (event.metaKey || event.ctrlKey) {
            window.open(href, '_blank', 'noopener');
          } else {
            window.location.assign(href);
          }
          return;
        }
        if (details.open) {
          setOpen(details, false);
        } else {
          open(nav, details);
        }
      });
      summary.addEventListener('auxclick', function (event) {
        if (!canHover() || event.button !== 1) return;
        var href = navTarget(summary);
        if (!href) return;
        event.preventDefault();
        window.open(href, '_blank', 'noopener');
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

    /* init() runs again on every shopify:section:load. The nav.dataset.clHover
       guard above protects the NEW nav, but the window listener added by the
       previous run was never removed and its closure pinned the whole detached
       header tree — one leaked listener and one leaked DOM tree per header edit
       in the theme editor. Track it at module scope and drop the old one first.

       Also debounced: resize fires continuously during a window drag, and the
       old handler ran nav.querySelectorAll on every single event even when no
       menu was open. */
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    resizeHandler = function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        BASE = new WeakMap(); // layout changed — cached offsets are stale
        menus(nav).forEach(function (d) {
          if (d.open) positionCondensed(d);
        });
      }, 150);
    };
    window.addEventListener('resize', resizeHandler);
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
