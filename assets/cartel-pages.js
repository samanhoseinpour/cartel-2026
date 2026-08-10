/* Cartel content pages (lane 7E) — one deferred file for every page template.
   Modules are hook-guarded so each page only runs what it renders:
   FAQ live search + category rail · resource category chips · policy TOC ·
   About before/after compare · About Instagram carousel · contact topic chips.
   No [hidden] on SVG anywhere — state lives in classes / hidden on divs.
   init() re-runs on shopify:section:load (theme editor); every module marks its
   root with data-cl-init so a re-run never double-binds a surviving element. */
(function () {
  'use strict';

  var claim = function (el) {
    if (!el || el.dataset.clInit) return false;
    el.dataset.clInit = '1';
    return true;
  };

  function init() {
    /* ---------- FAQ: live search + category rail ---------- */
    var faqRoot = document.querySelector('[data-faq]');
    if (faqRoot && claim(faqRoot)) {
      var faqSearch = document.querySelector('[data-faq-search]');
      var faqNavBtns = Array.prototype.slice.call(faqRoot.querySelectorAll('[data-faq-nav]'));
      var faqGroups = Array.prototype.slice.call(faqRoot.querySelectorAll('[data-faq-group]'));
      var faqEmpty = faqRoot.querySelector('[data-faq-empty]');
      var faqCat = '__all__';
      var faqQuery = '';

      /* Indexed ONCE. The old applyFaq re-ran querySelectorAll per group and then
         serialized every item's subtree via textContent and allocated a fresh
         lowercased copy — per item, per keystroke. On a 60-item FAQ, typing
         "eyelash extension" meant ~1000 subtree serializations and ~1000 string
         allocations. The text can't change, so it's cached on the node. */
      var faqIndex = faqGroups.map(function (group) {
        return {
          el: group,
          cat: group.getAttribute('data-faq-group'),
          items: Array.prototype.map.call(group.querySelectorAll('[data-faq-item]'), function (item) {
            return { el: item, text: item.textContent.toLowerCase() };
          }),
        };
      });

      var applyFaq = function () {
        var visibleTotal = 0;
        faqIndex.forEach(function (group) {
          var catOk = faqCat === '__all__' || group.cat === faqCat;
          var groupVisible = 0;
          group.items.forEach(function (item) {
            var show = catOk && (!faqQuery || item.text.indexOf(faqQuery) !== -1);
            /* only touch the DOM when the state actually flips — otherwise every
               keystroke invalidated style for every item, visible or not */
            if (item.el.hidden === show) item.el.hidden = !show;
            if (show) groupVisible++;
          });
          if (group.el.hidden !== (groupVisible === 0)) group.el.hidden = groupVisible === 0;
          visibleTotal += groupVisible;
        });
        if (faqEmpty) faqEmpty.hidden = visibleTotal !== 0;
      };

      faqNavBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          faqCat = btn.getAttribute('data-faq-nav');
          faqNavBtns.forEach(function (b) {
            var on = b === btn;
            b.classList.toggle('on', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          applyFaq();
        });
      });

      if (faqSearch) {
        /* Debounced: a filter pass per keystroke is wasted work while someone is
           mid-word, and 120ms is below the threshold where the list feels laggy. */
        var faqTimer = 0;
        faqSearch.addEventListener('input', function () {
          clearTimeout(faqTimer);
          faqTimer = setTimeout(function () {
            faqQuery = faqSearch.value.trim().toLowerCase();
            applyFaq();
          }, 120);
        });
      }
    }

    /* ---------- Resources: category chips + live count ---------- */
    var frFilter = document.querySelector('[data-fr-filter]');
    var frCards = Array.prototype.slice.call(document.querySelectorAll('[data-fr-card]'));
    if (frFilter && frCards.length && claim(frFilter)) {
      var frChips = Array.prototype.slice.call(frFilter.querySelectorAll('[data-fr-chip]'));
      var frCount = document.querySelector('[data-fr-count]');
      frChips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          var cat = chip.getAttribute('data-fr-chip');
          frChips.forEach(function (c) {
            var on = c === chip;
            c.classList.toggle('on', on);
            c.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          var shown = 0;
          frCards.forEach(function (card) {
            var show = cat === '__all__' || card.getAttribute('data-category') === cat;
            card.hidden = !show;
            if (show) shown++;
          });
          if (frCount) frCount.textContent = shown + (shown === 1 ? ' resource' : ' resources');
        });
      });
    }

    /* ---------- Policies: numbered sections + "On this page" TOC ---------- */
    var polBody = document.querySelector('[data-pol-body]');
    if (polBody && claim(polBody)) {
      var isPageContent = polBody.getAttribute('data-pol-body') === 'content';
      var headings = Array.prototype.slice.call(polBody.querySelectorAll('h2'));

      headings.forEach(function (h2, i) {
        if (isPageContent) {
          /* Rebuild the mock's .pol-sec nesting around the client's pasted copy:
             number chip + heading row, then pull the section's own paragraphs in
             (until the next h2) so .pol-body's gap separates sections, not lines.
             Blocks-mode markup already ships decorated. */
          var sec = document.createElement('div');
          sec.className = 'pol-sec';
          sec.id = 'policy-sec-' + (i + 1);
          h2.parentNode.insertBefore(sec, h2);
          var row = document.createElement('div');
          row.className = 'pol-sec-h';
          var num = document.createElement('span');
          num.className = 'pol-sec-n';
          num.textContent = i + 1;
          row.appendChild(num);
          sec.appendChild(row);
          row.appendChild(h2);
          h2.classList.add('pol-sec-t');
          while (sec.nextSibling && !(sec.nextSibling.nodeType === 1 && sec.nextSibling.tagName === 'H2')) {
            sec.appendChild(sec.nextSibling);
          }
        }
        if (!h2.id && !h2.closest('.pol-sec')) h2.id = 'policy-sec-' + (i + 1);
      });

      var tocList = document.querySelector('[data-pol-toc]');
      if (tocList && headings.length) {
        headings.forEach(function (h2, i) {
          var target = h2.closest('.pol-sec') || h2;
          var link = document.createElement('button');
          link.type = 'button';
          link.className = 'pol-toclink';
          var num = document.createElement('span');
          num.className = 'pol-tocnum';
          num.textContent = i + 1;
          link.appendChild(num);
          link.appendChild(document.createTextNode(h2.textContent.trim()));
          link.addEventListener('click', function () {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
          tocList.appendChild(link);
        });
        var tocCard = document.querySelector('[data-pol-toc-card]');
        if (tocCard) tocCard.hidden = false;
      }

      var polCount = document.querySelector('[data-pol-count]');
      if (polCount && polCount.textContent.trim() === '' && headings.length) {
        polCount.textContent = headings.length + (headings.length === 1 ? ' section' : ' sections');
      }
    }

    /* ---------- About: before / after compare ---------- */
    Array.prototype.forEach.call(document.querySelectorAll('[data-cmp]'), function (root) {
      if (!claim(root)) return;
      var range = root.querySelector('[data-cmp-range]');
      var before = root.querySelector('[data-cmp-before]');
      var handle = root.querySelector('[data-cmp-handle]');
      if (!range || !before || !handle) return;
      /* rAF-coalesced for the same reason as cartel-pdp.js: pointermove fires
         far above 60fps, and measuring the container after writing `left` on the
         previous event forced a synchronous relayout on every pointer sample.
         The handler now only records clientX; paint() measures once per frame,
         before it writes. */
      var frame = 0;
      var lastX = null;
      var pendingPos = null;

      var paint = function () {
        frame = 0;
        var v = pendingPos;
        pendingPos = null;
        if (lastX !== null) {
          var rect = root.getBoundingClientRect();
          if (!rect.width) { lastX = null; return; }
          v = ((lastX - rect.left) / rect.width) * 100;
          lastX = null;
        }
        if (v === null) return;
        v = Math.max(0, Math.min(100, v));
        before.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
        handle.style.left = v + '%';
        if (parseFloat(range.value) !== v) range.value = v;
      };
      var schedule = function () {
        if (!frame) frame = requestAnimationFrame(paint);
      };

      range.addEventListener('input', function () {
        pendingPos = parseFloat(range.value);
        lastX = null;
        schedule();
      });
      root.addEventListener('pointermove', function (e) {
        /* Mouse only — on touch, pointermove fires while the page is being
           scrolled over the image (and again while dragging the range itself),
           which scrubbed the reveal underneath the reader. Matches cartel-pdp.js. */
        if (e.pointerType !== 'mouse') return;
        lastX = e.clientX;
        schedule();
      });
    });

    /* ---------- About: Instagram carousel arrows ---------- */
    var igCar = document.querySelector('[data-ig-car]');
    if (igCar && claim(igCar)) {
      var igStep = function () {
        var cell = igCar.querySelector('.ab-ig-cell');
        return cell ? (cell.getBoundingClientRect().width + 14) * 2 : 520;
      };
      var igPrev = document.querySelector('[data-ig-prev]');
      var igNext = document.querySelector('[data-ig-next]');
      if (igPrev) igPrev.addEventListener('click', function () { igCar.scrollBy({ left: -igStep(), behavior: 'smooth' }); });
      if (igNext) igNext.addEventListener('click', function () { igCar.scrollBy({ left: igStep(), behavior: 'smooth' }); });
    }

    /* ---------- Contact: topic chips fill the hidden form field ---------- */
    var topicInput = document.querySelector('[data-ct-topic-input]');
    var topicChips = Array.prototype.slice.call(document.querySelectorAll('[data-ct-topic]'));
    if (topicInput && topicChips.length && claim(topicInput)) {
      topicChips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          var wasOn = chip.classList.contains('on');
          topicChips.forEach(function (c) {
            c.classList.remove('on');
            c.setAttribute('aria-pressed', 'false');
          });
          if (!wasOn) {
            chip.classList.add('on');
            chip.setAttribute('aria-pressed', 'true');
            topicInput.value = chip.textContent.trim();
          } else {
            topicInput.value = '';
          }
        });
      });
    }
  }

  init();
  /* theme editor re-renders a section in place — re-init the new DOM */
  document.addEventListener('shopify:section:load', init);
})();
