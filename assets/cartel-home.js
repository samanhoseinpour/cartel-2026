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
          self.toggle();
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
      this.schedule(d + 6000);
    }
    /* Single owner of the advance timer. Remembers how long is left so toggle()
       can stop and restart the countdown instead of starting a fresh one. */
    schedule(ms) {
      clearTimeout(this.t);
      this.remaining = ms;
      this.startedAt = Date.now();
      if (this.paused) return;
      var self = this;
      this.t = setTimeout(function () { self.next(); }, ms);
    }
    /* Fix 2026-08-10. The play/pause button used to call activate(this.i), which
       is the CHANGE SLIDE path: it resets video.currentTime to 0 and restarts
       the .hero-fill progress animation from scaleX(0). Pausing six seconds into
       a clip therefore rewound it to frame 0 and emptied the progress bar, and
       Play replayed from the start. Pause has to be its own path. */
    toggle() {
      var self = this;
      this.paused = !this.paused;
      this.syncPlay();

      var slide = this.slides[this.i];
      var v = slide && slide.querySelector('video');
      if (v) {
        if (this.paused) {
          v.pause();
        } else {
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        }
      }

      var dot = this.dots[this.i];
      var f = dot && dot.querySelector('.hero-fill');
      if (f && !RM) f.classList.toggle('pz', this.paused); // freeze, don't rewind

      if (this.paused) {
        clearTimeout(this.t);
        var spent = Date.now() - (this.startedAt || Date.now());
        this.remaining = Math.max(0, (this.remaining || 0) - spent);
      } else {
        this.startedAt = Date.now();
        this.t = setTimeout(function () { self.next(); }, Math.max(250, this.remaining || 0));
      }
    }
    activate(i) {
      var self = this;
      this.i = i;
      this.slides.forEach(function (s, n) {
        s.classList.toggle('on', n === i);
        /* opacity:0 + pointer-events:none hides an inactive slide from the mouse
           only — its heading and CTAs stayed focusable and were still announced.
           Keep inert/aria-hidden in step with the visible state. */
        if ('inert' in s) s.inert = n !== i;
        s.setAttribute('aria-hidden', n === i ? 'false' : 'true');
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
      this.schedule(hasVid ? d + 6000 : d);
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
      /* CLReels inherits this method, and the two rows this class drives do not
         share a gap — .carousel is 20px, .reelrow 16px (cartel-home.css:103 and
         :171). The hardcoded 20 over-scrolled the reels row by 8px a click and
         the drift accumulated, so read the real value. */
      var cs = getComputedStyle(row);
      var gap = parseFloat(cs.columnGap || cs.gap);
      if (!isFinite(gap)) gap = 20;
      var step = first ? first.getBoundingClientRect().width + gap : 300;
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
          /* No init play() — the observer below starts whatever is on screen.
             Playing all of them here is what kept N decoders alive at once. */
          ['play', 'pause', 'volumechange'].forEach(function (ev) {
            v.addEventListener(ev, function () { self.icons(reel); });
          });
        }
        if (play && v) {
          play.addEventListener('click', function (e) {
            e.stopPropagation(); e.preventDefault();
            if (v.paused) {
              /* an explicit play clears the manual-pause flag, so scrolling
                 away and back resumes the reel the shopper actually wanted */
              delete v.dataset.clPaused;
              var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
            } else {
              v.dataset.clPaused = '1';
              v.pause();
            }
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
      /* This observer owns reel playback. It used to only MUTE on exit, which
         left every video decoding for the life of the page — 8 blocks ship in
         templates/index.json, and a horizontal carousel means most are off
         screen at any moment. Pausing is the part that actually frees the
         decoder. */
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (en) {
            var v = en.target;
            if (en.isIntersecting) {
              /* don't fight the shopper's own pause, reduced motion, or the
                 lightbox — openBox() pauses the tile and resumes it on close */
              if (RM || v.dataset.clPaused || self.boxOpen) return;
              var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
            } else {
              if (!v.muted) {
                v.muted = true;
                self.reels.forEach(function (r) { self.icons(r); });
              }
              v.pause();
            }
          });
        }, { threshold: 0.25 });
        this.querySelectorAll('.reel video').forEach(function (v) { io.observe(v); });
      } else if (!RM) {
        /* no IO support — fall back to the old behaviour so the row isn't dead */
        this.querySelectorAll('.reel video').forEach(function (v) {
          var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
        });
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
      var self = this;
      var v = reel.querySelector('video');
      /* the observer checks this so it can't restart the tile underneath
         the lightbox when the row happens to scroll into view */
      this.boxOpen = true;
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
        self.boxOpen = false;
        document.body.classList.remove('cartel-noscroll');
        document.removeEventListener('keydown', esc);
        if (v && !RM && !v.dataset.clPaused) {
          var pr2 = v.play(); if (pr2 && pr2.catch) pr2.catch(function () {});
        }
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
          self.chips.forEach(function (x, i) {
            x.classList.toggle('on', i === n);
            x.setAttribute('aria-pressed', i === n ? 'true' : 'false');
          });
          self.pairs.forEach(function (p, i) {
            p.classList.toggle('on', i === n);
            /* the hidden pairs are opacity-only, so keep them out of the
               accessibility tree and the tab order — same as CLHero.activate */
            if ('inert' in p) p.inert = i !== n;
            p.setAttribute('aria-hidden', i === n ? 'false' : 'true');
          });
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

  /* ---------------- marquee pause ----------------
     Both homepage marquees (and the About page's) animate `infinite`. That
     holds a composited layer and keeps the compositor working for as long as
     the page is open, including while the row is scrolled far out of view —
     and each track sits inside a mask-image container, which forces its own
     rasterized layer to be recomposited every frame. Pause them off-screen. */
  var MQ_SEL = '.cl .marquee-track, .cl .reviewtrack, .cl .ab-mq-track';
  function marquees(root) {
    if (!('IntersectionObserver' in window)) return;
    var tracks = Array.prototype.slice.call((root || document).querySelectorAll(MQ_SEL));
    if (!tracks.length) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        en.target.classList.toggle('cl-mq-off', !en.isIntersecting);
      });
    }, { rootMargin: '120px 0px' });
    tracks.forEach(function (t) {
      if (t.__clMq) return;
      t.__clMq = 1;
      io.observe(t);
    });
  }

  /* The scroll reveal that used to live here is gone (2026-08-29).

     It set style.opacity='0' on every below-the-fold .sec-head / .carousel /
     .reelrow / .resgrid / .brandspot / .abhome / .news / .ba-* — 23 elements on
     the homepage, 11 on the blog — and faded each one up over 620ms when it
     crossed an IntersectionObserver tuned to rootMargin '0px 0px -8% 0px' with
     threshold 0.05. Because the trigger only fired once an element was already
     5% on screen and still 8% clear of the bottom margin, sections visibly
     arrived late and one at a time; the reported symptom was the site "loading
     piece by piece". Nothing else depended on it: no stylesheet sets an initial
     opacity on those selectors, so with the JS removed they simply render.

     Removed with it: REVEAL_SEL, the module-scope `revealed` array, and the
     `beforeprint` listener whose only job was to undo the inline opacity before
     printing. */

  var def = function (n, C) { if (!customElements.get(n)) customElements.define(n, C); };
  def('cl-hero', CLHero);
  def('cl-carousel', CLCarousel);
  def('cl-reels', CLReels);
  def('cl-spotlight', CLSpotlight);
  def('cl-ba', CLBa);

  function start(root) {
    marquees(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { start(); });
  } else { start(); }
  document.addEventListener('shopify:section:load', function (e) { start(e.target); });
})();
