/* cartel-cart.js — lane 7C (cart page only).
   Order-note toggle, promo code ("applied at checkout" via
   /checkout?discount=CODE — Shopify can't validate a discount in the cart),
   save-for-later backed by localStorage "cl_saved", and re-hydration after
   cart.js swaps the section HTML. Dawn's cart.js keeps owning quantity
   changes, removals and section rendering. */
(() => {
  'use strict';

  if (!document.getElementById('main-cart-items')) return;

  const SAVED_KEY = 'cl_saved';
  const PROMO_KEY = 'cl_promo';

  /* ---------- storage (private-mode safe) ---------- */
  const lsGet = (k) => {
    try {
      return window.localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  };
  const lsSet = (k, v) => {
    try {
      window.localStorage.setItem(k, v);
    } catch (e) {
      /* noop */
    }
  };
  const ssGet = (k) => {
    try {
      return window.sessionStorage.getItem(k);
    } catch (e) {
      return null;
    }
  };
  const ssSet = (k, v) => {
    try {
      window.sessionStorage.setItem(k, v);
    } catch (e) {
      /* noop */
    }
  };
  const ssDel = (k) => {
    try {
      window.sessionStorage.removeItem(k);
    } catch (e) {
      /* noop */
    }
  };

  const readSaved = () => {
    try {
      const list = JSON.parse(lsGet(SAVED_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  };
  const writeSaved = (list) => lsSet(SAVED_KEY, JSON.stringify(list));

  const esc = (s) =>
    String(s == null ? '' : s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  /* Shopify stores money in the shop currency's minor unit; format with the
     active currency rather than assuming USD. */
  const money = (() => {
    try {
      const code = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'USD';
      const nf = new Intl.NumberFormat(document.documentElement.lang || undefined, {
        style: 'currency',
        currency: code,
      });
      return (cents) => nf.format((parseInt(cents, 10) || 0) / 100);
    } catch (e) {
      return (cents) => '$' + ((parseInt(cents, 10) || 0) / 100).toFixed(2);
    }
  })();

  /* ---------- order note ---------- */
  let notePref = null; // null = follow the server-rendered state
  function syncNote() {
    const toggle = document.querySelector('[data-note-toggle]');
    const box = document.getElementById('Cart-note');
    if (!toggle || !box) return;
    const open = notePref === null ? !box.hidden : notePref;
    box.hidden = !open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    const label = toggle.querySelector('[data-note-label]');
    if (label) {
      label.textContent = open ? 'Hide order note' : box.value.trim() ? 'Edit order note' : 'Add a note to your order';
    }
  }

  /* ---------- promo code ---------- */
  function syncPromo() {
    const zone = document.querySelector('[data-promo-zone]');
    if (!zone) return;
    const code = ssGet(PROMO_KEY) || '';
    const applied = zone.querySelector('[data-promo-applied]');
    const form = zone.querySelector('[data-promo-form]');
    const msg = zone.querySelector('[data-promo-msg]');
    const err = zone.querySelector('[data-promo-err]');
    const codeEl = zone.querySelector('[data-promo-code]');
    if (applied) applied.hidden = !code;
    if (form) form.hidden = !!code;
    if (msg) msg.hidden = !code;
    if (err) err.hidden = true;
    if (codeEl) codeEl.textContent = code;
  }
  function applyPromo() {
    const input = document.querySelector('[data-promo-input]');
    const err = document.querySelector('[data-promo-err]');
    if (!input) return;
    const code = (input.value || '').trim().toUpperCase();
    if (!code) {
      if (err) {
        err.hidden = false;
        const text = err.querySelector('[data-promo-err-text]');
        if (text) text.textContent = 'Enter a discount code';
      }
      input.focus();
      return;
    }
    ssSet(PROMO_KEY, code);
    syncPromo();
  }

  /* ---------- save for later ---------- */
  /* JS cannot call placeholder_svg_tag, so main-cart-items.liquid stashes one in
     #cl-saved-placeholder and we clone its markup. That keeps the saved grid on
     the SAME placeholder as the cart lines and the cards instead of a second,
     slightly different one. Read at call time, not at load: the template is
     outside .js-contents, but the lookup is cheap and cannot go stale. */
  function savedPh() {
    const t = document.getElementById('cl-saved-placeholder');
    return t ? t.innerHTML : '';
  }

  function savedCardHTML(it) {
    const img = it.image
      ? '<img class="card-photo" src="' + esc(it.image) + '" alt="' + esc(it.title) + '" loading="lazy">'
      : savedPh();
    /* Empty data-price = login-gated. "0" is a truthy string, so zero-priced
       (enquire-only) products must be tested numerically, not for truthiness. */
    const cents = it.price === '' || it.price == null ? null : parseInt(it.price, 10);
    let price;
    if (cents === null || isNaN(cents)) {
      price =
        '<span class="line-lock"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>Log in for price</span>';
    } else if (cents === 0) {
      price = '<span class="pprice">Price on request</span>';
    } else {
      price = '<span class="pprice">' + esc(money(cents)) + '</span>';
    }
    return (
      '<div class="saved-card" data-saved-id="' + esc(it.id) + '">' +
      '<div class="saved-img">' +
      (it.url ? '<a class="imglink" href="' + esc(it.url) + '" aria-label="' + esc(it.title) + '">' + img + '</a>' : img) +
      '<button type="button" class="saved-rm" data-saved-rm="' + esc(it.id) + '" aria-label="Remove ' + esc(it.title) + ' from saved">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>' +
      '</button></div>' +
      (it.brand ? '<span class="pbrand">' + esc(it.brand) + '</span>' : '') +
      '<a class="pname" href="' + esc(it.url || '#') + '">' + esc(it.title) + '</a>' +
      (it.variant ? '<span class="pvar">' + esc(it.variant) + '</span>' : '') +
      '<div class="prow">' + price + '</div>' +
      '<button type="button" class="btn btn-out btn-sm w100" data-saved-move="' + esc(it.id) + '">Move to bag</button>' +
      '</div>'
    );
  }

  function renderSaved() {
    const zone = document.querySelector('[data-saved-zone]');
    const grid = document.querySelector('[data-saved-grid]');
    const count = document.querySelector('[data-saved-count]');
    if (!zone || !grid) return;
    const list = readSaved();
    zone.hidden = list.length === 0;
    if (count) count.textContent = list.length + (list.length === 1 ? ' item' : ' items');
    grid.innerHTML = list.map(savedCardHTML).join('');
  }

  function saveForLater(btn) {
    const row = btn.closest('.cart-item');
    const item = {
      id: btn.dataset.variantId,
      title: btn.dataset.productTitle || '',
      brand: btn.dataset.brand || '',
      variant: btn.dataset.variantTitle || '',
      price: btn.dataset.price || '',
      image: btn.dataset.image || '',
      url: btn.dataset.url || '',
    };
    if (!item.id) return;
    const list = readSaved().filter((x) => x.id !== item.id);
    list.push(item);
    writeSaved(list);
    renderSaved();
    const remove = row && row.querySelector('cart-remove-button button');
    if (remove) remove.click();
  }

  function applySections(sections) {
    if (!sections) return;
    const itemsEl = document.getElementById('main-cart-items');
    const sectionId = itemsEl && itemsEl.dataset.id;
    if (sectionId && sections[sectionId]) {
      const doc = new DOMParser().parseFromString(sections[sectionId], 'text/html');
      const src = doc.querySelector('.js-contents');
      const dst = itemsEl.querySelector('.js-contents');
      if (src && dst) dst.innerHTML = src.innerHTML;
      /* Moving a saved item into an EMPTY cart re-renders the lines but left
         `is-empty` on <cart-items> — which Dawn's own CSS keys off. Mirror the
         freshly rendered state instead of assuming it. */
      const liveWrap = document.querySelector('cart-items');
      const freshWrap = doc.querySelector('cart-items');
      if (liveWrap && freshWrap) liveWrap.classList.toggle('is-empty', freshWrap.classList.contains('is-empty'));
    }
    if (sections['cart-icon-bubble']) {
      const doc = new DOMParser().parseFromString(sections['cart-icon-bubble'], 'text/html');
      const src = doc.querySelector('.shopify-section');
      const dst = document.getElementById('cart-icon-bubble');
      if (src && dst) dst.innerHTML = src.innerHTML;
    }
  }

  function moveToBag(btn) {
    const id = parseInt(btn.dataset.savedMove, 10);
    if (!id) return;
    btn.disabled = true;
    const itemsEl = document.getElementById('main-cart-items');
    const sectionId = (itemsEl && itemsEl.dataset.id) || '';
    const addUrl = ((window.routes && window.routes.cart_add_url) || '/cart/add') + '.js';
    fetch(addUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/javascript' },
      body: JSON.stringify({
        items: [{ id: id, quantity: 1 }],
        sections: [sectionId, 'cart-icon-bubble'].filter(Boolean).join(','),
        sections_url: window.location.pathname,
      }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data: data })))
      .then(({ ok, data }) => {
        if (!ok || data.status) {
          const errs = document.getElementById('cart-errors');
          if (errs) errs.textContent = data.description || data.message || 'Sorry, that item could not be added.';
          btn.disabled = false;
          return;
        }
        writeSaved(readSaved().filter((x) => String(x.id) !== String(id)));
        applySections(data.sections);
        renderSaved();
        syncPromo();
        syncNote();
      })
      .catch(() => {
        btn.disabled = false;
        const errs = document.getElementById('cart-errors');
        if (errs) errs.textContent = 'Sorry, that item could not be added. Try again.';
      });
  }

  /* ---------- events (delegated so section re-renders can't detach them) ---------- */
  document.addEventListener('click', (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;

    const noteToggle = target.closest('[data-note-toggle]');
    if (noteToggle) {
      const box = document.getElementById('Cart-note');
      notePref = box ? box.hidden : true;
      syncNote();
      if (notePref && box) box.focus();
      return;
    }
    if (target.closest('[data-promo-apply]')) {
      applyPromo();
      return;
    }
    if (target.closest('[data-promo-clear]')) {
      ssDel(PROMO_KEY);
      syncPromo();
      const input = document.querySelector('[data-promo-input]');
      if (input) input.value = '';
      return;
    }
    const save = target.closest('[data-line-save]');
    if (save) {
      saveForLater(save);
      return;
    }
    const move = target.closest('[data-saved-move]');
    if (move) {
      moveToBag(move);
      return;
    }
    const savedRemove = target.closest('[data-saved-rm]');
    if (savedRemove) {
      writeSaved(readSaved().filter((x) => String(x.id) !== String(savedRemove.dataset.savedRm)));
      renderSaved();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;
    if (target.matches('[data-promo-input]')) {
      e.preventDefault();
      applyPromo();
      return;
    }
    /* Dawn keeps #checkout in its own <form>; this theme renders the whole cart
       page from main-cart-items, so #checkout (main-cart-items.liquid:414) is
       the ONLY type="submit" inside form#cart and is therefore that form's
       default button. Pressing Enter after editing a quantity performed an
       implicit submission — the shopper was sent to checkout instead of the line
       updating (and, with a promo code stored, straight through the interceptor
       below). Swallow the implicit submit; <cart-items> listens on 'change'
       (assets/cart.js:25), which Enter still fires, so the edit is applied. */
    if (!target.closest('form#cart')) return;
    if (target.closest('button, a, textarea')) return; // let real activations through
    e.preventDefault();
  });

  /* promo → checkout URL (Shopify validates the code at checkout) */
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (!form || form.id !== 'cart') return;
    const code = ssGet(PROMO_KEY);
    if (!code) return;
    /* Only a real activation of #checkout reaches here now — the keydown handler
       above stops implicit submission from ever naming it as the submitter. */
    const submitter = e.submitter;
    if (submitter && submitter.name === 'checkout') {
      e.preventDefault();
      /* Derive /checkout from routes.cart_url so locale/market prefixes
         (e.g. /en-ca/cart) survive. */
      const cartUrl = (window.routes && window.routes.cart_url) || '/cart';
      const checkoutUrl = cartUrl.replace(/\/cart\/?$/, '') + '/checkout';
      window.location.href = checkoutUrl + '?discount=' + encodeURIComponent(code);
    }
  });

  /* ---------- re-hydrate after cart.js replaces section HTML ----------
     There are TWO different swaps to survive:
       • updateQuantity() replaces #main-cart-items .js-contents only;
       • onCartUpdate() replaces the innerHTML of the WHOLE <cart-items>
         (cart.js:130-138) for any cart update whose source isn't 'cart-items' —
         including "Add to bag" on this page's own "Complete your kit" cards.
     The second swap discards [data-saved-zone] and [data-promo-zone] (they sit
     inside <cart-items> but outside .js-contents) and restores their server
     state. Watching .js-contents missed it entirely: that node is removed as
     part of an ancestor subtree, so the records fire on <cart-items> and the
     observer detached silently — re-hydration stopped for the rest of the
     page's life, and the shopper's saved-for-later grid simply vanished.

     Observing <cart-items> does mean renderSaved()'s own innerHTML write is a
     mutation, which is what caused the earlier ~25Hz loop. Disconnect around our
     own writes instead of narrowing the target; a boolean flag cannot work here
     because the callback is a microtask and would run after the flag cleared. */
  const cartItemsEl = document.querySelector('cart-items');
  if (cartItemsEl && 'MutationObserver' in window) {
    const watch = { childList: true, subtree: true };
    let pending = null;
    const observer = new MutationObserver(() => {
      if (pending) return;
      pending = window.setTimeout(() => {
        pending = null;
        observer.disconnect(); // also empties the pending record queue
        syncNote();
        syncPromo();
        renderSaved();
        observer.observe(cartItemsEl, watch);
      }, 40);
    });
    observer.observe(cartItemsEl, watch);
  }

  syncNote();
  syncPromo();
  renderSaved();
})();
