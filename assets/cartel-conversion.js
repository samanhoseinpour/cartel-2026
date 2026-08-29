/* cartel-conversion.js — lane 7C conversion chrome (offer tab + email popup)
   plus the shared newsletter-form state guard. Loads on every template.
   Auto-opens the popup once per visitor after ~12s or on exit intent
   (localStorage "cl_popup" remembers dismissal), never on /cart and never in
   the theme editor. The offer tab reopens it any time. Esc / backdrop close,
   focus trapped while open. Checkout pages are Shopify-hosted, so no theme JS
   runs there. */

/* ---------- shared newsletter-form state guard ----------
   form.posted_successfully? and form.errors are scoped to the request's
   form_type, NOT to a form id, so after ANY {% form 'customer' %} on the page
   posts, every other one renders its posted state too: submitting the 10%-off
   popup on /blogs/journal flipped the untouched in-page band to "You're on the
   list", and an invalid email painted its error next to an empty field.

   Shopify points a {% form %} action at #<form-id>, and the browser carries
   that fragment through the redirect — so the hash is the only reliable signal
   of WHICH form posted. Each band renders its posted state next to its own
   fields (hidden); this reveals whichever half belongs to this request. With
   JS off the markup degrades to exactly the previous behaviour. */
(() => {
  'use strict';

  const states = document.querySelectorAll('[data-cl-form-ok], [data-cl-form-msg], [data-cl-form-email]');
  Array.prototype.forEach.call(states, (el) => {
    const id =
      el.getAttribute('data-cl-form-ok') ||
      el.getAttribute('data-cl-form-msg') ||
      el.getAttribute('data-cl-form-email');
    if (!id || '#' + id === window.location.hash) return; // this one really did post
    /* {{ form.email }} echoes the rejected address into EVERY customer form on
       the page, not just the one that posted — so a typo in the footer showed up
       prefilled in the popup and both journal bands. Same signal, same fix:
       blank the field unless this form is the one the fragment points at. */
    if (el.hasAttribute('data-cl-form-email')) {
      el.value = '';
      return;
    }
    el.remove();
    if (!el.hasAttribute('data-cl-form-ok')) return; // a message, not a replaced form
    const fields = document.querySelectorAll('[data-cl-form-fields="' + id + '"]');
    Array.prototype.forEach.call(fields, (field) => field.classList.remove('hidden'));
  });
})();

(() => {
  'use strict';

  const KEY = 'cl_popup';
  const ov = document.getElementById('cl-popup-ov');
  const tab = document.getElementById('cl-offtab');
  if (!ov && !tab) return;

  const dismissed = () => {
    try {
      return !!window.localStorage.getItem(KEY);
    } catch (e) {
      return true; // storage unavailable → never auto-nag
    }
  };
  const mark = () => {
    try {
      window.localStorage.setItem(KEY, '1');
    } catch (e) {
      /* noop */
    }
  };

  let lastFocus = null;
  let autoTimer = null;
  const designMode = !!(window.Shopify && window.Shopify.designMode);
  const onCartPage = !!document.querySelector('main[data-template="cart"]');

  const isOpen = () => !!ov && !ov.hidden;

  function cancelAuto() {
    if (autoTimer) {
      window.clearTimeout(autoTimer);
      autoTimer = null;
    }
    document.removeEventListener('mouseout', onExitIntent);
  }

  function open() {
    if (!ov || isOpen()) return;
    cancelAuto();
    lastFocus = document.activeElement;
    ov.hidden = false;
    document.body.classList.add('overflow-hidden');
    const first = ov.querySelector('.pop-input') || ov.querySelector('[data-popup-close]');
    if (first) first.focus();
  }

  function close() {
    if (!ov || !isOpen()) return;
    ov.hidden = true;
    document.body.classList.remove('overflow-hidden');
    mark();
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function onExitIntent(e) {
    if (e.clientY <= 0 && !e.relatedTarget) open();
  }

  function trapTab(e) {
    const focusables = ov.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    } else if (!ov.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    }
  }

  if (tab) tab.addEventListener('click', open);

  if (ov) {
    ov.addEventListener('click', (e) => {
      if (e.target === ov) {
        close();
        return;
      }
      const target = e.target instanceof Element ? e.target : null;
      if (target && target.closest('[data-popup-close]')) close();
    });

    document.addEventListener('keydown', (e) => {
      if (!isOpen()) return;
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key === 'Tab') trapTab(e);
    });

    // A just-submitted signup (success or validation error) reopens once so
    // the visitor sees the outcome, then stays quiet.
    //
    // form.posted_successfully? is scoped to the request's form_type, not to a
    // form id, so EVERY {% form 'customer' %} on the page renders its success
    // state after any one of them posts — the inline homepage band, the
    // resources band and the footer all flipped this popup open. Shopify points
    // the form action at #<form-id>, so the surviving fragment tells us whether
    // this popup was actually the form that posted.
    const submitted = ov.querySelector('[data-popup-posted]') || ov.querySelector('[data-popup-error]');
    if (submitted) {
      if (window.location.hash === '#cl-popup-form') {
        if (ov.querySelector('[data-popup-posted]')) mark();
        if (!designMode) window.setTimeout(open, 400);
      }
      return;
    }

    if (!designMode && !onCartPage && !dismissed()) {
      autoTimer = window.setTimeout(open, 12000);
      document.addEventListener('mouseout', onExitIntent);
    }
  }
})();

/* ---------- cart-drawer "You may also like" quick add (2026-08-11) ----------
   Markup: snippets/cartel-drawer-upsell*.liquid, inside <cart-drawer-items>.
   The handler lives here because this is the file theme.liquid already loads on
   every template, and the drawer is rendered on every template.

   Why not Dawn's <product-form>:
   1. assets/product-form.js is loaded per SECTION (main-product:43,
      featured-product:510, the three grids, cartel-product-row:25,
      main-cart-items:15) and never by layout/theme.liquid. A <product-form> in
      the always-rendered drawer would be inert on /blogs, /pages, /404 and the
      account templates. Loading it from the drawer snippet would add a request
      to EVERY page for a control most sessions never see.
   2. It double-renders. product-form.js publishes cartUpdate with source
      'product-form', which cart.js:38-41 turns into a SECOND
      `?section_id=cart-drawer` fetch plus a replaceWith of cart-drawer-items and
      .cart-drawer__footer; then it calls cart-drawer.js renderContents, which
      rewrites all of #CartDrawer. Two round trips and two full rebuilds a click.
   3. It leaves focus on <body>: renderContents destroys the clicked button and
      its open() early-returns, so trapFocus never re-runs.
   4. It needs a <form>, which cannot be nested inside #CartDrawer-Form.

   One POST, three surgical swaps, focus and the focus trap both restored.
   Modelled on assets/cartel-cart.js:219 moveToBag(). */
(() => {
  'use strict';

  /* .dw-head carries the "Your bag (n)" count and is a direct child of
     .drawer__inner, so it is NOT one of the two nodes cart.js:118 refreshes —
     it has to be swapped explicitly or the count goes stale. */
  const SWAP = ['.dw-head', 'cart-drawer-items', '.cart-drawer__footer'];
  let busy = false;

  const drawer = () => document.getElementById('CartDrawer');

  function announce(msg) {
    const live = document.getElementById('CartDrawer-UpsellStatus');
    if (!live) return;
    /* Clear first, then set on a tick, so two adds worded identically still
       register as a change for assistive tech. */
    live.textContent = '';
    window.setTimeout(() => {
      live.textContent = msg;
    }, 60);
  }

  function applyDrawer(html) {
    const root = drawer();
    if (!root) return;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    SWAP.forEach((sel) => {
      const src = doc.querySelector(sel);
      const dst = root.querySelector(sel);
      /* replaceWith adopts the parsed node, which upgrades <cart-drawer-items>
         and runs its connectedCallback (re-subscribing to cartUpdate) while the
         old one's disconnectedCallback unsubscribes — the same mechanism
         cart.js:118 relies on. */
      if (src && dst) dst.replaceWith(src);
    });
  }

  function applyBubble(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const src = doc.querySelector('.shopify-section');
    const dst = document.getElementById('cart-icon-bubble');
    if (src && dst) dst.innerHTML = src.innerHTML;
  }

  function restoreFocus() {
    const root = drawer();
    if (!root) return;
    const next =
      root.querySelector('[data-uc-add]') ||
      document.getElementById('CartDrawer-Checkout') ||
      root.querySelector('.drawer__close');
    if (!next) return;
    /* trapFocus snapshots first/last at call time (global.js:90-92) and ours are
       detached now. This one call re-arms the trap AND moves focus. */
    if (typeof trapFocus === 'function') trapFocus(root, next);
    else next.focus();
  }

  function reset(btn, spinner) {
    busy = false;
    btn.disabled = false;
    btn.removeAttribute('aria-disabled');
    if (spinner) spinner.classList.add('hidden');
  }

  function fail(btn, spinner, msg) {
    reset(btn, spinner);
    /* Nothing is swapped on failure, so #CartDrawer-CartErrors (role="alert")
       is still the same node and its text change fires. */
    const errs = document.getElementById('CartDrawer-CartErrors');
    if (errs) errs.textContent = msg;
    else announce(msg);
  }

  function quickAdd(btn) {
    const id = btn.getAttribute('data-uc-add');
    if (!id || busy) return;
    const title = btn.getAttribute('data-uc-title') || 'Item';
    const spinner = btn.querySelector('.loading__spinner');

    busy = true;
    btn.disabled = true;
    btn.setAttribute('aria-disabled', 'true');
    if (spinner) spinner.classList.remove('hidden');
    const errs = document.getElementById('CartDrawer-CartErrors');
    if (errs) errs.textContent = '';

    const url = ((window.routes && window.routes.cart_add_url) || '/cart/add') + '.js';
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/javascript' },
      body: JSON.stringify({
        items: [{ id: Number(id), quantity: 1 }],
        sections: ['cart-drawer', 'cart-icon-bubble'].join(','),
        sections_url: window.location.pathname,
      }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data: data })))
      .then(({ ok, data }) => {
        if (!ok || data.status) {
          fail(btn, spinner, data.description || data.message || 'Sorry, that could not be added.');
          return;
        }
        const sections = data.sections || {};
        if (sections['cart-drawer']) applyDrawer(sections['cart-drawer']);
        if (sections['cart-icon-bubble']) applyBubble(sections['cart-icon-bubble']);
        busy = false;

        /* Announce as the DRAWER, because the drawer is what already rendered itself
           from the sections in THIS response — cart.js now skips only the host whose
           tagName matches `source`, so 'cart-drawer-items' spares <cart-drawer-items>
           a redundant `?section_id=cart-drawer` fetch while letting <cart-items> on
           /cart refresh (it previously said 'cart-items', which silenced the cart page
           and left its name="updates[]" inputs stale). Every other cartUpdate
           subscriber still hears the event. PUB_SUB_EVENTS is a top-level const in
           constants.js, so it is a global BINDING, not a window property. */
        if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
          publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-drawer-items', cartData: data, productVariantId: id });
        }

        restoreFocus();
        announce(title + ' added to your bag.');
      })
      .catch(() => {
        fail(btn, spinner, 'Sorry, that could not be added. Try again.');
      });
  }

  /* Delegated so the drawer's re-render paths cannot detach it. */
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const btn = target && target.closest('[data-uc-add]');
    if (!btn) return;
    event.preventDefault();
    quickAdd(btn);
  });
})();
