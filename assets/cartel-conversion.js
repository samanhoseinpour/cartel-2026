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
