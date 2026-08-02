/* cartel-blog.js — lane 7F. Article-page behaviour:
   1. builds the "In this article" TOC from the h2s rendered inside .bl-body
      (the client's raw article HTML), injecting ids where missing;
   2. smooth-scrolls TOC links under the sticky header (CSS scroll-margin-top
      does the offset) and highlights the heading currently in view;
   3. copy-link / native-share buttons with a .toast confirmation.
   Loads on blog + article templates; everything no-ops when its hooks are absent. */
(function () {
  'use strict';

  var OFFSET = 96; // matches scroll-margin-top / rail top in cartel-blog.css

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  /* ---------- toast ---------- */
  var toastEl = null;
  var toastTimer = null;
  function toast(msg) {
    var host = document.querySelector('.cl') || document.body;
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
    }
    toastEl.textContent = msg;
    if (!toastEl.parentNode) host.appendChild(toastEl);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      if (toastEl && toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
    }, 2200);
  }

  /* ---------- clipboard ---------- */
  function copyText(text, done) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () {
        legacyCopy(text);
        done();
      });
    } else {
      legacyCopy(text);
      done();
    }
  }
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      /* nothing left to try */
    }
    document.body.removeChild(ta);
  }

  /* ---------- toc ---------- */
  function slugify(text, index) {
    var s = (text || '')
      .toLowerCase()
      .trim()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60)
      .replace(/^-|-$/g, '');
    return s || 'section-' + (index + 1);
  }

  function buildToc() {
    var body = document.querySelector('[data-cl-body]');
    var card = document.querySelector('[data-cl-toc]');
    var list = document.querySelector('[data-cl-toc-list]');
    if (!body || !card || !list) return;

    var headings = Array.prototype.slice.call(body.querySelectorAll('h2'));
    if (!headings.length) return; // card stays hidden

    var used = {};
    var links = [];
    headings.forEach(function (h, i) {
      var id = h.id;
      if (!id) {
        id = slugify(h.textContent, i);
        while (used[id] || document.getElementById(id)) id += '-' + (i + 1);
        h.id = id;
      }
      used[id] = true;

      var a = document.createElement('a');
      a.className = 'bl-toc-link';
      a.href = '#' + id;
      var num = document.createElement('span');
      num.className = 'bl-toc-n';
      num.textContent = String(i + 1).padStart(2, '0');
      a.appendChild(num);
      a.appendChild(document.createTextNode(h.textContent.trim()));
      a.addEventListener('click', function (e) {
        e.preventDefault();
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (window.history && history.replaceState) history.replaceState(null, '', '#' + id);
      });
      list.appendChild(a);
      links.push(a);
    });
    card.removeAttribute('hidden');

    /* active-heading highlight: last h2 above the header line wins */
    var active = -1;
    function update() {
      var current = -1;
      for (var i = 0; i < headings.length; i++) {
        if (headings[i].getBoundingClientRect().top <= OFFSET + 8) current = i;
        else break;
      }
      if (current !== active) {
        if (active >= 0) links[active].classList.remove('on');
        if (current >= 0) links[current].classList.add('on');
        active = current;
      }
    }
    var ticking = false;
    window.addEventListener(
      'scroll',
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          update();
        });
      },
      { passive: true }
    );
    update();
  }

  /* ---------- share buttons ---------- */
  function bindShare() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-cl-copy]'), function (btn) {
      btn.addEventListener('click', function () {
        copyText(window.location.href, function () {
          toast('Article link copied to clipboard');
        });
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-cl-share]'), function (btn) {
      btn.addEventListener('click', function () {
        if (navigator.share) {
          navigator.share({ title: document.title, url: window.location.href }).catch(function () {});
        } else {
          copyText(window.location.href, function () {
            toast('Article link copied to clipboard');
          });
        }
      });
    });
  }

  ready(function () {
    buildToc();
    bindShare();
  });
})();
