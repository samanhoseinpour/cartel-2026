if (!customElements.get('cart-disclosure-modal')) {
  class CartDisclosureModal extends HTMLElement {
    constructor() {
      super();

      this.onOpenerClick = this.onOpenerClick.bind(this);
      this.onCloseClick = this.onCloseClick.bind(this);
      this.onModalClick = this.onModalClick.bind(this);
      this.onKeyUp = this.onKeyUp.bind(this);
      this.removeIfOpenerDisconnected = this.removeIfOpenerDisconnected.bind(this);
    }

    connectedCallback() {
      if (this.initialized) return;

      this.initialized = true;
      this.dialog = this.querySelector('[role="dialog"]');
      const controlsId = this.dialog?.id;
      this.opener = this.previousElementSibling?.classList.contains('cart-item__disclosure')
        ? this.previousElementSibling
        : controlsId
          ? document.querySelector(`[aria-controls="${controlsId}"]`)
          : null;
      this.closeButton = this.querySelector('[data-cart-disclosure-close]');

      let shouldRestoreOpen = false;
      document.querySelectorAll('cart-disclosure-modal').forEach((modal) => {
        if (modal === this || modal.id !== this.id) return;

        shouldRestoreOpen = shouldRestoreOpen || modal.hasAttribute('open');
        modal.remove();
      });

      this.opener?.addEventListener('click', this.onOpenerClick);
      this.closeButton?.addEventListener('click', this.onCloseClick);
      this.addEventListener('click', this.onModalClick);
      this.addEventListener('keyup', this.onKeyUp);

      if (this.parentElement !== document.body) {
        this.isMoving = true;
        document.body.appendChild(this);
        this.isMoving = false;
      }

      this.observeOpener();

      if (shouldRestoreOpen) this.show();
    }

    disconnectedCallback() {
      if (this.isMoving) return;

      this.openerObserver?.disconnect();
      this.opener?.removeEventListener('click', this.onOpenerClick);
      this.closeButton?.removeEventListener('click', this.onCloseClick);
      this.removeEventListener('click', this.onModalClick);
      this.removeEventListener('keyup', this.onKeyUp);

      if (this.hasAttribute('open')) this.hide(false);
    }

    observeOpener() {
      this.openerObserver?.disconnect();

      if (!this.opener) return;

      this.openerObserver = new MutationObserver(this.removeIfOpenerDisconnected);
      this.openerObserver.observe(document.body, { childList: true, subtree: true });
      this.removeIfOpenerDisconnected();
    }

    removeIfOpenerDisconnected() {
      if (this.isMoving || !this.isConnected || this.opener?.isConnected) return;

      this.remove();
    }

    onOpenerClick(event) {
      event.preventDefault();
      event.stopPropagation();
      this.show();
    }

    onCloseClick(event) {
      event.preventDefault();
      event.stopPropagation();
      this.hide();
    }

    onModalClick(event) {
      event.stopPropagation();

      if (event.target === this) this.hide();
    }

    onKeyUp(event) {
      if (event.code.toUpperCase() !== 'ESCAPE') return;

      event.preventDefault();
      event.stopPropagation();
      this.hide();
    }

    show() {
      if (this.hasAttribute('open')) return;

      document.querySelectorAll('cart-disclosure-modal[open]').forEach((modal) => {
        if (modal !== this) modal.hide(false);
      });

      this.lockScroll();
      this.setAttribute('open', '');
      this.opener?.setAttribute('aria-expanded', 'true');

      if (typeof trapFocus === 'function') {
        trapFocus(this, this.dialog);
      } else {
        this.dialog?.focus();
      }

      window.pauseAllMedia();
    }

    hide(restoreFocus = true) {
      if (!this.hasAttribute('open')) return;

      this.removeAttribute('open');
      this.opener?.setAttribute('aria-expanded', 'false');
      this.unlockScroll();

      if (restoreFocus) {
        this.restoreFocusTrap();
      } else if (typeof removeTrapFocus === 'function') {
        removeTrapFocus();
      }

      window.pauseAllMedia();
    }

    /* 2026-08-30: this pair used to hand-roll the only owner guard in the theme
       — a bodyOverflowWasHidden flag plus its own scrollbar-width padding
       compensation — because it opens on top of the cart drawer, which is
       already holding the lock. assets/cartel-scroll-lock.js now does exactly
       that for every overlay, with a real owner set instead of one boolean, so
       the local copy is gone. Method names kept so the call sites in show()/
       hide() are untouched. The fallback is the same unconditional class every
       other overlay falls back to: if the helper is missing entirely, this
       close can release the drawer's class, which is precisely the shared
       behaviour the helper exists to fix — no worse than the other four. */
    lockScroll() {
      if (window.clScrollLock) window.clScrollLock.lock(this);
      else document.body.classList.add('overflow-hidden');
    }

    unlockScroll() {
      if (window.clScrollLock) window.clScrollLock.unlock(this);
      else document.body.classList.remove('overflow-hidden');
    }

    restoreFocusTrap() {
      const cartDrawer = this.opener?.closest('cart-drawer.active');
      const cartNotification = this.opener?.closest('cart-notification')?.querySelector('#cart-notification.active');

      if (cartDrawer && typeof trapFocus === 'function') {
        const containerToTrapFocusOn = cartDrawer.classList.contains('is-empty')
          ? cartDrawer.querySelector('.drawer__inner-empty')
          : document.getElementById('CartDrawer');

        if (containerToTrapFocusOn) {
          trapFocus(containerToTrapFocusOn, this.opener);
          return;
        }
      }

      if (cartNotification && typeof trapFocus === 'function') {
        trapFocus(cartNotification, this.opener);
        return;
      }

      if (typeof removeTrapFocus === 'function') {
        removeTrapFocus(this.opener);
      } else {
        this.opener?.focus();
      }
    }
  }

  customElements.define('cart-disclosure-modal', CartDisclosureModal);
}
