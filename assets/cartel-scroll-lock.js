/* cartel-scroll-lock.js — one owner-counted body scroll lock for every overlay
   (2026-08-30). Loaded from layout/theme.liquid immediately before global.js, so
   `defer` guarantees it is defined before any overlay script can call it.

   It replaces the bare `document.body.classList.add('overflow-hidden')` that
   five separate overlays each did on their own. Two measured failures:

   (a) iOS/WebKit ignores it. `overflow:hidden` on <body> does not stop
       touch-driven document scroll there. Verified both ways: real wheel input
       in desktop Chrome held the page at scrollY 1200 with the popup open (so
       the class DOES work in Blink), while the client's iPhone recording shows
       the page scrolling freely behind that same popup. The only technique that
       holds on iOS is pinning <body> with position:fixed at a negative top,
       which is what pin() below does.

   (b) No owner, no refcount. Reproduced end to end in desktop Chrome: open the
       cart drawer (lock on) -> the 10%-off popup's 12s timer fires and opens it
       at z-150 BEHIND the z-1000 drawer, invisible but focus-trapped ->
       dismissing the popup runs its close(), which removed the class
       unconditionally -> the page then scrolled 0 -> 1320 behind the drawer,
       which was still open. Whoever released last won, regardless of who was
       still holding.

   So: each caller passes an owner token (`this` from a custom element, a string
   for a singleton). The body stays pinned until the LAST owner unlocks, and the
   class is only removed when no remaining owner still wants that same class.

   The class is still added and removed, because CSS keys off it — notably
   assets/cartel-conversion.css:30-34, which hides the .offtab tab on all five
   body-lock classes, and base.css:230 / 2916-2934.

   SAFE FOR THIS THEME, measured: with the menu drawer open at scrollY 2000 the
   drawer (position:absolute, anchored to .header-wrapper) stayed at top:62
   bottom:843, identical to before pinning. A position:fixed ancestor does not
   become the containing block for fixed descendants, so <cart-drawer> and
   .cl .ov still resolve against the viewport.

   STILL OUTSTANDING — these manage a body lock class directly and are NOT
   routed through here yet, so they get the class but not the iOS pin. When one
   of them REMOVES a class this helper is holding, reconcile() below releases
   the matching owner so the page can never be left pinned:
     * assets/localization-form.js:49,119-120  ('overflow-hidden-mobile')
     * assets/cartel-plp.js:105                ('overflow-hidden-mobile')
     * assets/theme-editor.js:42               (removes 'overflow-hidden' on
       shopify:section:unload — theme editor only, never on the storefront) */
(() => {
  'use strict';

  /* Mirrors base.css:2916-2934 exactly: -mobile is released at 750px and
     -tablet at 990px, while -desktop has no release query at all, so a desktop
     drawer lock is active at every width. */
  const MQ = {
    mobile: '(max-width: 749px)',
    tablet: '(max-width: 989px)',
    desktop: '(min-width: 0px)',
  };

  const owners = new Map(); // owner token -> { cls, scope, active }
  let savedY = 0;
  let pinned = false;

  function pin(sbw) {
    if (pinned) return;
    pinned = true;
    savedY = window.scrollY || window.pageYOffset || 0;
    /* Taking the document out of flow removes the scrollbar on desktop, which
       would otherwise reflow the whole page a few px wider behind the overlay.
       Pad the gap back. (This is the compensation cart-disclosure-modal.js used
       to hand-roll for itself; it is central now.)
       The width MUST be measured by the caller BEFORE it adds the lock class:
       `.overflow-hidden{overflow:hidden}` on <body> propagates to the viewport
       (html declares no overflow, layout/theme.liquid:341-355), so by the time
       we get here the scrollbar is already gone and
       innerWidth - documentElement.clientWidth reads 0 — the compensation
       silently never fired. */
    if (sbw > 0) {
      const cur = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
      document.body.dataset.clPadR = document.body.style.paddingRight;
      document.body.style.paddingRight = cur + sbw + 'px';
    }
    document.body.style.position = 'fixed';
    document.body.style.top = -savedY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }

  function unpin() {
    if (!pinned) return;
    pinned = false;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    if ('clPadR' in document.body.dataset) {
      document.body.style.paddingRight = document.body.dataset.clPadR;
      delete document.body.dataset.clPadR;
    }
    /* The pin threw the document back to scrollY 0; put the visitor exactly
       where they were before the overlay opened. */
    window.scrollTo(0, savedY);
  }

  function anyActive() {
    let a = false;
    owners.forEach((r) => {
      if (r.active) a = true;
    });
    return a;
  }

  /* The pin is an INLINE style, so no media query can ever release it — which
     made a once-at-lock-time reading of the scope a page-freeze bug. Reproduced
     at 800px: open the header drawer (class overflow-hidden-tablet, pinned),
     widen past 990px, and sections/header.liquid:33-39 sets
     `header-drawer{display:none}` while base.css:2927-2933 releases the class —
     so the drawer and its close button vanish, body's overflow goes back to
     auto, and `position:fixed; top:-600px` stays behind with nothing left that
     can clear it. Measured: the page could not be scrolled at all.
     Re-reading every owner's scope on each boundary crossing keeps the inline
     pin in step with the class that justifies it. */
  function reassess() {
    owners.forEach((rec) => {
      rec.active = !rec.scope || !MQ[rec.scope] || window.matchMedia(MQ[rec.scope]).matches;
    });
    if (anyActive()) pin(0); // the class is already applied, so no scrollbar to compensate
    else unpin();
  }

  Object.keys(MQ).forEach((key) => {
    const mql = window.matchMedia(MQ[key]);
    /* addEventListener on MediaQueryList is Safari 14+; addListener is the
       deprecated fallback for anything older. */
    if (mql.addEventListener) mql.addEventListener('change', reassess);
    else if (mql.addListener) mql.addListener(reassess);
  });

  /* Self-heal. The three files listed in the header still add/remove a body
     lock class directly, and one of them does it on a path this helper is now
     on the other side of: assets/cartel-plp.js:105 strips
     'overflow-hidden-mobile' whenever the mobile filter sheet shuts, because
     MenuDrawer.closeSubmenu (any button inside the sheet) never lifts Dawn's
     own class. Without this, that close would drop the class and leave <body>
     pinned with no visible overlay — a frozen page on every PLP. So watch the
     class list: an owner whose class is no longer on <body> is not holding
     anything, and its pin has to go with it.

     Only `class` is observed, so pin()/unpin()'s inline-style and data-attribute
     writes cannot re-enter this. Our own lock()/unlock() are already consistent
     by the time the callback runs (it is async), so they no-op here. */
  function reconcile() {
    let changed = false;
    owners.forEach((rec, owner) => {
      if (document.body.classList.contains(rec.cls)) return;
      owners.delete(owner);
      changed = true;
    });
    if (changed && !anyActive()) unpin();
  }

  if (document.body && window.MutationObserver) {
    new window.MutationObserver(reconcile).observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  window.clScrollLock = {
    /* owner: any unique token — pass `this` from a custom element, a string for
       a singleton. Locking twice with the same owner is a no-op, so an overlay
       that re-opens without closing cannot double-count.
       scope: undefined (lock at every width) | 'mobile' | 'tablet' | 'desktop'
       (Dawn's breakpoint-scoped variants, from a drawer's data-breakpoint). */
    lock(owner, scope) {
      if (!owner || owners.has(owner)) return;
      const cls = scope ? 'overflow-hidden-' + scope : 'overflow-hidden';
      /* Measure the scrollbar BEFORE the class lands — see pin(). */
      const sbw = window.innerWidth - document.documentElement.clientWidth;
      document.body.classList.add(cls);
      /* A scoped lock only pins where its class actually hides overflow; above
         that breakpoint the drawer is an inline menu and the page must still
         scroll. An unknown scope pins rather than silently doing nothing.
         reassess() re-runs this whenever the viewport crosses a boundary. */
      const active = !scope || !MQ[scope] || window.matchMedia(MQ[scope]).matches;
      owners.set(owner, { cls: cls, scope: scope, active: active });
      if (active) pin(sbw);
    },

    unlock(owner) {
      const rec = owners.get(owner);
      if (!rec) return; // never locked, or already released — both are fine
      owners.delete(owner);
      let stillWanted = false;
      owners.forEach((r) => {
        if (r.cls === rec.cls) stillWanted = true;
      });
      if (!stillWanted) document.body.classList.remove(rec.cls);
      if (!anyActive()) unpin();
    },

    isLocked() {
      return anyActive();
    },
  };
})();
