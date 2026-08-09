/* cartel-pdp.js — lane 7B (product page)
   1. Before/after comparison slider (.cmp): native range drives the reveal,
      mouse hover scrubs it like the prototype.
   2. Sticky mobile add-to-bag (<750px): appears once the .p-buy row scrolls
      above the viewport, hides while the footer is visible, and mirrors the
      real submit button's disabled state + label (the gated login CTA and the
      price-on-request state are server-rendered as links instead). */
(function () {
  'use strict';

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

  /* ---- sticky mobile add-to-bag ---- */
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

    /* mirror the real submit button (sold out on variant change, etc.) */
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
    new MutationObserver(sync).observe(main, {
      attributes: true,
      attributeFilter: ['disabled'],
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
  initSticky();
})();
