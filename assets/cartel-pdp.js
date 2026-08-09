/* cartel-pdp.js — lane 7B (product page)
   1. Before/after comparison slider (.cmp): native range drives the reveal,
      mouse hover scrubs it like the prototype.
   2. Sticky mobile add-to-bag (<750px): appears once the .p-buy row scrolls
      above the viewport, hides while the footer is visible, and mirrors the
      real submit button's disabled state + label (the gated login CTA and the
      price-on-request state are server-rendered as links instead). */
(function () {
  'use strict';

  /* featured-product.liquid loads this file itself (it can sit on any template),
     so on the product page the tag can appear twice. Run once. */
  if (window.cartelPdpLoaded) return;
  window.cartelPdpLoaded = true;

  /* window.variantStrings.addToCart is now set to "Add to bag" globally in
     theme.liquid — patching it here only covered the product template, so a
     featured-product section elsewhere reverted to the locale string. */

  /* ---- before / after compare ---- */
  function initCompare(cmp) {
    var before = cmp.querySelector('.cmp-before');
    var handle = cmp.querySelector('.cmp-handle');
    var range = cmp.querySelector('.cmp-range');
    if (!before || !handle || !range) return;

    function setPos(pos) {
      pos = Math.max(0, Math.min(100, pos));
      before.style.clipPath = 'inset(0 ' + (100 - pos) + '% 0 0)';
      handle.style.left = pos + '%';
      if (parseFloat(range.value) !== pos) range.value = pos;
    }

    range.addEventListener('input', function () {
      setPos(parseFloat(range.value) || 0);
    });
    cmp.addEventListener('pointermove', function (event) {
      if (event.pointerType !== 'mouse') return; // touch drags the range itself
      var rect = cmp.getBoundingClientRect();
      if (rect.width) setPos(((event.clientX - rect.left) / rect.width) * 100);
    });
  }
  document.querySelectorAll('.cl .cmp').forEach(initCompare);

  /* ---- sticky mobile add-to-bag ----
     Re-bindable: initSticky() installs the real mirror, and the variant-change
     handler below calls it again after it replaces the bar's contents. Stays a
     no-op when there is no sticky bar (featured-product, gated PDP). */
  var bindMirror = function () {};

  function initSticky() {
    var bar = document.querySelector('.pdp-sticky');
    var watch = document.querySelector('[data-cl-sticky-watch]');
    if (!bar || !watch || !('IntersectionObserver' in window)) return;

    var mq = window.matchMedia('(max-width: 749px)');
    var footer = document.querySelector('.footer');
    var pastBuyRow = false;
    var footerInView = false;

    function render() {
      var on = mq.matches && pastBuyRow && !footerInView;
      bar.classList.toggle('on', on);
      bar.setAttribute('aria-hidden', on ? 'false' : 'true');
      if ('inert' in bar) bar.inert = !on;
    }

    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        pastBuyRow = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
      });
      render();
    }).observe(watch);

    if (footer) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          footerInView = entry.isIntersecting;
        });
        render();
      }).observe(footer);
    }

    if (mq.addEventListener) mq.addEventListener('change', render);
    render();

    /* mirror the real submit button (sold out on variant change, etc.).
       Both nodes are replaced when the buy area is re-rendered below, so the
       binding is re-runnable and drops the previous observer first. */
    var mirrorObserver = null;
    bindMirror = function () {
      if (mirrorObserver) {
        mirrorObserver.disconnect();
        mirrorObserver = null;
      }
      var proxy = bar.querySelector('.pdp-sticky__add');
      if (!proxy) return;
      var main = document.getElementById(proxy.dataset.mainButton || '');
      if (!main) return;

      function sync() {
        proxy.disabled = main.hasAttribute('disabled');
        var mainLabel = main.querySelector('span');
        var proxyLabel = proxy.querySelector('span');
        if (mainLabel && proxyLabel) proxyLabel.textContent = mainLabel.textContent.trim();
      }
      sync();
      mirrorObserver = new MutationObserver(sync);
      mirrorObserver.observe(main, {
        attributes: true,
        attributeFilter: ['disabled'],
        childList: true,
        subtree: true,
        characterData: true,
      });
    };
    bindMirror();
  }
  initSticky();

  /* ---- re-render the buy area on variant change ----
     product-info.js swaps only #price-, #Sku-, #Inventory-, #Volume- and
     #Price-Per-Item-, then calls `this.productForm?.toggleSubmitButton(...)`.
     The login gate and the "price on request" arms of buy-buttons.liquid emit
     NO <product-form>, so that optional chain is a no-op and the arm rendered
     for the FIRST variant survives every switch: a $0 first variant left the
     enquiry link in place (the paid variant could never be added to the bag),
     and switching TO a $0 variant left the real button disabled and relabelled
     "Sold out" for an available variant. The mobile sticky bar mirrors the same
     server-side condition and was equally stuck.

     Only swap when the ARM actually changed (product-form present vs absent).
     A same-arm variant change is already handled by Dawn, and re-rendering it
     would wipe in-progress state such as a typed gift-card recipient. */
  function armOf(el) {
    return el ? !!el.querySelector('product-form') : null;
  }

  function infoForSection(sectionId) {
    var infos = document.querySelectorAll('product-info');
    for (var i = 0; i < infos.length; i++) {
      var el = infos[i];
      if ((el.dataset.originalSection || el.dataset.section) === sectionId) return el;
    }
    return null;
  }

  if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
    subscribe(PUB_SUB_EVENTS.variantChange, function (event) {
      var data = event && event.data;
      if (!data || !data.html || !data.sectionId) return;
      var info = infoForSection(data.sectionId);
      if (!info) return;

      /* source ids carry the ORIGINAL section id, destination ids the rendered
         one — the same split product-info.js uses in updateSourceFromDestination. */
      var buySrc = data.html.getElementById('CartelBuy-' + data.sectionId);
      var buyDst = document.getElementById('CartelBuy-' + info.dataset.section);
      var swapped = false;
      if (buySrc && buyDst && armOf(buySrc) !== armOf(buyDst)) {
        buyDst.innerHTML = buySrc.innerHTML;
        swapped = true;
      }

      var stickySrc = data.html.getElementById('CartelSticky-' + data.sectionId);
      var stickyDst = document.getElementById('CartelSticky-' + info.dataset.section);
      if (stickySrc && stickyDst && stickySrc.innerHTML !== stickyDst.innerHTML) {
        stickyDst.innerHTML = stickySrc.innerHTML;
        swapped = true;
      }

      if (!swapped) return;
      bindMirror();
      if (window.Shopify && window.Shopify.PaymentButton) window.Shopify.PaymentButton.init();
    });
  }
})();
