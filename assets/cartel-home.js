/* ============================================================
   Cartel Lash Supply — homepage behaviours (batch 4 + batch 6 fixes)
   Ports the prototype's interactions: hero slideshow (video-aware),
   carousel arrows, category spotlight, reels (exclusive audio + lightbox),
   before/after slider, scroll reveal.
   ============================================================ */
(function () {
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- hero ---------------- */
  class CLHero extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.slides = Array.prototype.slice.call(this.querySelectorAll('.hero-slide'));
      this.dots = Array.prototype.slice.call(this.querySelectorAll('.hero-dot'));
      this.playBtn = this.querySelector('[data-hero-play]');
      this.i = 0;
      this.paused = !!RM;
      var self = this;
      this.dots.forEach(function (d, n) {
        d.addEventListener('click', function () { self.activate(n); });
      });
      if (this.playBtn) {
        this.playBtn.addEventListener('click', function () {
          self.paused = !self.paused;
          self.syncPlay();
          self.activate(self.i);
        });
      }
      this.slides.forEach(function (s) {
        var v = s.querySelector('video');
        if (!v) return;
        v.muted = true; v.defaultMuted = true; v.loop = false; v.playsInline = true;
        v.setAttribute('playsinline', '');
        v.removeAttribute('controls');
        v.addEventListener('loadedmetadata', function () { if (self.slides[self.i] === s) self.retime(); });
        v.addEventListener('ended', function () { if (!self.paused) self.next(); });
      });
      this.syncPlay();
      this.activate(0);
    }
    disconnectedCallback() { clearTimeout(this.t); }
    syncPlay() {
      /* batch 6 — the [hidden] attribute does NOT hide an <svg>. The HTML UA
         stylesheet that implements [hidden]{display:none} is namespaced to
         XHTML, so it never matches an element in the SVG namespace: the
         attribute is set, computed display stays "block", and both icons
         rendered side by side forever. State now lives in a class on the
         BUTTON and the swap is plain CSS. */
      if (!this.playBtn) return;
      this.playBtn.classList.toggle('is-paused', this.paused);
      this.playBtn.setAttribute('aria-label', this.paused ? 'Play slideshow' : 'Pause slideshow');
    }
    dur(i) {
      var s = this.slides[i];
      var v = s && s.querySelector('video');
      if (!v) return 6000;
      return v.duration && isFinite(v.duration) ? v.duration * 1000 : 12000;
    }
    retime() {
      var d = this.dur(this.i);
      var dot = this.dots[this.i];
      var f = dot && dot.querySelector('.hero-fill');
      if (f && !RM) { f.style.animationDuration = d / 1000 + 's'; }
      clearTimeout(this.t);
      if (!this.paused) {
        var self = this;
        this.t = setTimeout(function () { self.next(); }, d + 6000);
      }
    }
    activate(i) {
      var self = this;
      this.i = i;
      this.slides.forEach(function (s, n) {
        s.classList.toggle('on', n === i);
        var v = s.querySelector('video');
        if (!v) return;
        if (n === i) {
          try { v.currentTime = 0; } catch (e) {}
          if (self.paused) { v.pause(); }
          else { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        } else { v.pause(); }
      });
      var d = this.dur(i);
      var hasVid = !!(this.slides[i] && this.slides[i].querySelector('video'));
      this.dots.forEach(function (dot, n) {
        dot.classList.toggle('on', n === i);
        var f = dot.querySelector('.hero-fill');
        if (!f) return;
        f.classList.remove('go', 'pz');
        void f.offsetWidth;
        if (n === i && !RM) {
          f.style.animationDuration = d / 1000 + 's';
          f.classList.add('go');
          if (self.paused) f.classList.add('pz');
        }
      });
      clearTimeout(this.t);
      if (!this.paused) {
        this.t = setTimeout(function () { self.next(); }, hasVid ? d + 6000 : d);
      }
    }
    next() { if (this.slides.length) this.activate((this.i + 1) % this.slides.length); }
  }

  /* ---------------- carousel arrows ---------------- */
  class CLCarousel extends HTMLElement {
    connectedCallback() {
      if (this._initC) return;
      this._initC = true;
      var self = this;
      this.row = this.querySelector('.carousel, .reelrow');
      var p = this.querySelector('[data-caro-prev]');
      var n = this.querySelector('[data-caro-next]');
      if (p) p.addEventListener('click', function () { self.nudge(-1); });
      if (n) n.addEventListener('click', function () { self.nudge(1); });
    }
    nudge(dir) {
      var row = this.row;
      if (!row) return;
      var first = row.firstElementChild;
      var step = first ? first.getBoundingClientRect().width + 20 : 300;
      var max = row.scrollWidth - row.clientWidth;
      row.scrollLeft = Math.max(0, Math.min(max, row.scrollLeft + dir * step * 2));
    }
  }

  /* ---------------- reels ---------------- */
  class CLReels extends CLCarousel {
    connectedCallback() {
      super.connectedCallback();
      if (this._initR) return;
      this._initR = true;
      var self = this;
      this.reels = Array.prototype.slice.call(this.querySelectorAll('[data-reel]'));
      this.reels.forEach(function (reel) {
        var v = reel.querySelector('video');
        var play = reel.querySelector('[data-reel-play]');
        var mute = reel.querySelector('[data-reel-mute]');
        var open = reel.querySelector('[data-reel-open]');
        if (v) {
          v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
          v.setAttribute('playsinline', '');
          v.removeAttribute('controls');
          if (!RM) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
          ['play', 'pause', 'volumechange'].forEach(function (ev) {
            v.addEventListener(ev, function () { self.icons(reel); });
          });
        }
        if (play && v) {
          play.addEventListener('click', function (e) {
            e.stopPropagation(); e.preventDefault();
            if (v.paused) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else { v.pause(); }
          });
        }
        if (mute && v) {
          mute.addEventListener('click', function (e) {
            e.stopPropagation(); e.preventDefault();
            if (v.muted) {
              /* exclusive audio — only one reel is ever audible */
              self.reels.forEach(function (r) {
                var o = r.querySelector('video');
                if (o && o !== v) o.muted = true;
              });
              v.muted = false;
              var pr = v.play(); if (pr && pr.catch) pr.catch(function () { v.muted = true; });
            } else { v.muted = true; }
            self.reels.forEach(function (r) { self.icons(r); });
          });
        }
        if (open) open.addEventListener('click', function () { self.openBox(reel); });
        self.icons(reel);
      });
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (en) {
            var v = en.target;
            if (!en.isIntersecting && !v.muted) {
              v.muted = true;
              self.reels.forEach(function (r) { self.icons(r); });
            }
          });
        }, { threshold: 0.25 });
        this.querySelectorAll('.reel video').forEach(function (v) { io.observe(v); });
      }
    }
    icons(reel) {
      /* batch 6 — same [hidden]-on-<svg> bug as the hero; class-driven now. */
      var v = reel.querySelector('video');
      if (!v) return;
      var play = reel.querySelector('[data-reel-play]');
      var mute = reel.querySelector('[data-reel-mute]');
      if (play) {
        play.classList.toggle('is-paused', v.paused);
        play.setAttribute('aria-label', v.paused ? 'Play video' : 'Pause video');
      }
      if (mute) {
        mute.classList.toggle('is-unmuted', !v.muted);
        mute.setAttribute('aria-label', v.muted ? 'Unmute video' : 'Mute video');
      }
    }
    openBox(reel) {
      var v = reel.querySelector('video');
      var wrap = document.createElement('div');
      wrap.className = 'cl';
      wrap.innerHTML =
        '<div class="ov ov-c"><div class="reelbox">' +
        '<button class="reelbox-close" type="button" aria-label="Close">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>' +
        '</button><div class="reelbox-grad"></div><div class="reelbox-cap"></div></div></div>';
      var box = wrap.querySelector('.reelbox');
      if (v) {
        var clone = v.cloneNode(true);
        clone.className = 'reelbox-media';
        clone.controls = false;
        clone.loop = true;
        clone.autoplay = true;
        clone.muted = false;
        clone.playsInline = true;
        box.insertBefore(clone, box.firstChild);
        var pr = clone.play();
        if (pr && pr.catch) pr.catch(function () { clone.muted = true; clone.play(); });
        v.pause();
      }
      wrap.querySelector('.reelbox-cap').textContent = reel.getAttribute('data-caption') || '';
      var close = function () {
        wrap.remove();
        document.body.classList.remove('cartel-noscroll');
        document.removeEventListener('keydown', esc);
        if (v && !RM) { var pr2 = v.play(); if (pr2 && pr2.catch) pr2.catch(function () {}); }
      };
      var esc = function (e) { if (e.key === 'Escape') close(); };
      wrap.querySelector('.reelbox-close').addEventListener('click', close);
      wrap.querySelector('.ov').addEventListener('click', function (e) {
        if (e.target.classList.contains('ov')) close();
      });
      document.addEventListener('keydown', esc);
      document.body.appendChild(wrap);
      document.body.classList.add('cartel-noscroll');
    }
  }

  /* ---------------- category spotlight ---------------- */
  class CLSpotlight extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      var self = this;
      this.rows = Array.prototype.slice.call(this.querySelectorAll('[data-row]'));
      this.panels = Array.prototype.slice.call(this.querySelectorAll('[data-panel]'));
      this.rows.forEach(function (r, n) {
        var go = function () { self.show(n); };
        r.addEventListener('mouseenter', go);
        r.addEventListener('focus', go);
        r.addEventListener('click', go);
      });
    }
    show(n) {
      this.rows.forEach(function (r, i) { r.classList.toggle('on', i === n); });
      this.panels.forEach(function (p, i) { p.hidden = i !== n; });
    }
  }

  /* ---------------- before / after ---------------- */
  class CLBa extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      var self = this;
      this.range = this.querySelector('.ba-range');
      this.handle = this.querySelector('.ba-handle');
      this.pairs = Array.prototype.slice.call(this.querySelectorAll('[data-ba-pair]'));
      this.chips = Array.prototype.slice.call(this.querySelectorAll('[data-ba-chip]'));
      if (this.range) {
        var on = function () { self.set(parseInt(self.range.value, 10)); };
        this.range.addEventListener('input', on);
        this.range.addEventListener('change', on);
      }
      this.chips.forEach(function (c, n) {
        c.addEventListener('click', function () {
          self.chips.forEach(function (x, i) { x.classList.toggle('on', i === n); });
          self.pairs.forEach(function (p, i) { p.classList.toggle('on', i === n); });
        });
      });
      this.set(50);
    }
    set(pos) {
      pos = Math.max(0, Math.min(100, isNaN(pos) ? 50 : pos));
      if (this.handle) this.handle.style.left = pos + '%';
      this.querySelectorAll('.ba-before').forEach(function (b) {
        b.style.clipPath = 'inset(0 ' + (100 - pos) + '% 0 0)';
      });
    }
  }

  /* ---------------- scroll reveal ---------------- */
  var REVEAL_SEL = '.cl .sec-head, .cl .vprops, .cl .carousel, .cl .reelrow, .cl .resgrid, .cl .reviewmarq, .cl .brandspot, .cl .abhome, .cl .news, .cl .ba-chips, .cl .ba-cmp';
  function reveal(root) {
    if (RM || !('IntersectionObserver' in window)) return;
    if (window.Shopify && window.Shopify.designMode) return;
    var els = Array.prototype.slice.call((root || document).querySelectorAll(REVEAL_SEL));
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target;
        el.style.opacity = '';
        if (el.animate) {
          el.animate(
            [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }],
            { duration: 620, easing: 'cubic-bezier(.2,.7,.2,1)' }
          );
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(function (el) {
      if (el.__clReveal) return;
      el.__clReveal = 1;
      if (el.getBoundingClientRect().top > window.innerHeight * 1.15) el.style.opacity = '0';
      io.observe(el);
    });
    window.addEventListener('beforeprint', function () {
      els.forEach(function (el) { el.style.opacity = ''; });
    });
  }

  var def = function (n, C) { if (!customElements.get(n)) customElements.define(n, C); };
  def('cl-hero', CLHero);
  def('cl-carousel', CLCarousel);
  def('cl-reels', CLReels);
  def('cl-spotlight', CLSpotlight);
  def('cl-ba', CLBa);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { reveal(); });
  } else { reveal(); }
  document.addEventListener('shopify:section:load', function (e) { reveal(e.target); });
})();
