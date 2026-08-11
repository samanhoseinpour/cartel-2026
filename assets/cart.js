class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', (event) => {
      event.preventDefault();
      const cartItems = this.closest('cart-items') || this.closest('cart-drawer-items');
      cartItems.updateQuantity(this.dataset.index, 0, event);
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends window.StandardEvents.createViewEventElement(HTMLElement) {
  constructor() {
    super();
    this.lineItemStatusElement =
      document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');

    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);

    this.addEventListener('change', debouncedOnChange.bind(this));

    // 2026-08-11 — keep a negative out of the field, and keep Enter in it.
    //
    // A quantity is never negative, and in this cart 0 now MEANS "remove this
    // line" (see validateQuantity), so a stray "-" stops being merely invalid
    // and becomes destructive. type="number" does not refuse the character:
    // min="0" constrains the spinner and native validation, not what can be
    // typed or pasted. Refuse it at the source instead.
    //
    // Two listeners, because neither covers the other:
    //   keydown — the desktop case; preventDefault stops "-", "+", "e" and "E"
    //             ever reaching the value. Modifier combos are left alone so
    //             Cmd/Ctrl shortcuts keep working.
    //   input   — paste, drag-and-drop, autofill and the Android soft keyboards
    //             that report key === 'Unidentified' never produce a usable
    //             keydown, so strip the sign after the fact as well.
    //
    // Enter is swallowed for the same field. #CartDrawer-Checkout is
    // type="submit" name="checkout" form="CartDrawer-Form" (cart-drawer.liquid),
    // so it is that form's default button and Enter in a drawer quantity field
    // implicitly submitted it — the shopper was sent to checkout instead of the
    // line updating. cartel-cart.js:297 already does this for form#cart on the
    // cart page and verified there that 'change' still fires on Enter, which is
    // what carries the edit. The drawer was never covered; it is now.
    //
    // Both are delegated on the host rather than bound per input: updateQuantity
    // replaces the rows' innerHTML on every cart change, so listeners on an
    // <input> would be dropped on the first update. The host survives on the
    // cart page, and in the drawer .drawer__inner is replaced wholesale so this
    // constructor simply runs again on the rebuilt <cart-drawer-items>.
    this.addEventListener('keydown', this.onQuantityKeydown.bind(this));
    this.addEventListener('input', this.onQuantityInput.bind(this));
  }

  cartUpdateUnsubscriber = undefined;

  static pendingCartDataPromise = null;

  connectedCallback() {
    // The factory base class auto-dispatches cart:view from the
    // `view-event-payload` attribute (Liquid filter output). The drawer
    // sets `view-event-trigger="manual"` to skip auto-dispatch.
    super.connectedCallback();

    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      if (event.source === 'cart-items') return;
      return this.onCartUpdate();
    });
  }

  // Fetches the full cart shape (used to resolve the cart:lines-update event
  // promise after /cart/add.js, which only returns the added line — not the
  // post-mutation cart aggregates). De-duplicated across concurrent callers.
  static fetchCartData() {
    if (!CartItems.pendingCartDataPromise) {
      const pendingCartDataPromise = fetch(`${routes.cart_url}.json`)
        .then((response) => response.json())
        .catch(() => null)
        .finally(() => {
          if (CartItems.pendingCartDataPromise === pendingCartDataPromise) CartItems.pendingCartDataPromise = null;
        });

      CartItems.pendingCartDataPromise = pendingCartDataPromise;
    }
    return CartItems.pendingCartDataPromise;
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  resetQuantityInput(id) {
    // 2026-08-11 — look the drawer up too, and survive a miss.
    // The drawer's inputs are #Drawer-quantity-{n} (cart-drawer.liquid:192), not
    // #Quantity-{n}; updateQuantity has known that since Dawn 15 (:176, :207)
    // but this function never did, so every validation snap-back in the drawer
    // threw TypeError on `input.value` and left the field showing the rejected
    // number. It is reachable today by typing above the stock cap added in
    // 15a8b87. Scoped to `this`, not document: on /cart with the drawer enabled
    // both #Quantity-1 and #Drawer-quantity-1 exist in the page.
    const input = this.querySelector(`#Quantity-${id}`) || this.querySelector(`#Drawer-quantity-${id}`);
    if (!input) return;
    input.value = input.getAttribute('value');
    this.isEnterPressed = false;
  }

  // The only controls inside this host that may drive a cart update.
  // <cart-items> wraps the WHOLE cart page, not just the lines, so this filter
  // is load-bearing — see onChange.
  isQuantityInput(target) {
    return target instanceof HTMLInputElement && target.matches('input[name="updates[]"][data-index]');
  }

  onQuantityKeydown(event) {
    if (!this.isQuantityInput(event.target)) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === '-' || event.key === '+' || event.key === 'e' || event.key === 'E') {
      event.preventDefault();
    }
  }

  onQuantityInput(event) {
    if (!this.isQuantityInput(event.target)) return;
    // A number input reports "" for anything it cannot parse, so only a complete
    // negative ("-5") survives the getter — strip the sign and keep the digits.
    if (event.target.value.startsWith('-')) event.target.value = event.target.value.replace(/^-+/, '');
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;
    let message = '';

    // 2026-08-11 — zero removes the line, in the drawer and on the cart page.
    //
    // The input carries min="0" and keeps the real rule in data-min, so "−"
    // steps 1 → 0 and 0 is a value the shopper can type. Dawn then measured that
    // 0 against data-min, popped the native "This item has a minimum of 1"
    // bubble and snapped the field back — a dead end where the only exit from a
    // line was the Remove control, and in the drawer the snap-back threw
    // (resetQuantityInput). /cart/change already treats quantity 0 as a delete;
    // it is exactly what <cart-remove-button> posts (cart.js:8). So 0 is routed
    // straight there instead.
    //
    // Order matters: this runs BEFORE min/max/step because 0 fails all three by
    // construction — 0 < data-min for every real quantity rule, and 0 % NaN is
    // NaN if a stale render ever leaves step="" behind.
    //
    // NaN (cleared field) and a negative are NOT instructions and must not
    // delete anything. "" is what a number input reports for any value it cannot
    // parse ("-", "1e", "1.2.3"), and clearing the field is how everyone starts
    // retyping a number: on a phone, backspace then a tap outside to dismiss the
    // keyboard fires precisely this change event. A removal has no undo, so an
    // ambiguous state silently restores the last quantity the server confirmed
    // (the `value` attribute). Deleting stays explicit: type 0, step to 0, or
    // press Remove. A negative reverts rather than being read as "0 or less" for
    // the same reason — an impossible value is refused, not reinterpreted.
    if (Number.isNaN(inputValue) || inputValue < 0) {
      event.target.setCustomValidity('');
      this.resetQuantityInput(index);
      return;
    }

    if (inputValue === 0) {
      event.target.setCustomValidity('');
      // `name` is omitted deliberately, matching <cart-remove-button>. After the
      // render updateQuantity refocuses [name="…"] inside #CartItem-{line} /
      // #CartDrawer-Item-{line}, and once this line is gone that index belongs
      // to a DIFFERENT product — passing "minus" would park a keyboard user on
      // another item's − button. Omitting it drops through to the established
      // post-removal focus branches (empty-state link, or .cart-item__name).
      this.updateQuantity(index, 0, event, undefined, event.target.dataset.quantityVariantId);
      return;
    }

    if (inputValue < event.target.dataset.min) {
      message = window.quickOrderListStrings.min_error.replace('[min]', event.target.dataset.min);
    } else if (inputValue > parseInt(event.target.max)) {
      message = window.quickOrderListStrings.max_error.replace('[max]', event.target.max);
    } else if (inputValue % parseInt(event.target.step) !== 0) {
      message = window.quickOrderListStrings.step_error.replace('[step]', event.target.step);
    }

    if (message) {
      this.setValidity(event, index, message);
    } else {
      event.target.setCustomValidity('');
      event.target.reportValidity();
      this.updateQuantity(
        index,
        inputValue,
        event,
        document.activeElement.getAttribute('name'),
        event.target.dataset.quantityVariantId
      );
    }
  }

  onChange(event) {
    // 2026-08-11 — only a line-quantity input may drive a cart update.
    // <cart-items> wraps the WHOLE cart page (main-cart-items.liquid:61-522), so
    // the order note <textarea name="note">, the promo <input data-promo-input>
    // and the saved-for-later controls all bubble their change events in here.
    // Dawn then parseInt()s the note text, gets NaN, falls through to the
    // step_error branch and calls setCustomValidity() on the NOTE — an
    // "increments of undefined" bubble on a textarea, a control left permanently
    // invalid inside form#cart (which is what #checkout submits), and
    // resetQuantityInput(undefined) throwing on #Quantity-undefined. Filtering
    // the target kills the whole class.
    if (!this.isQuantityInput(event.target)) return;
    this.validateQuantity(event);
  }

  onCartUpdate() {
    if (this.tagName === 'CART-DRAWER-ITEMS') {
      return fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const selectors = ['cart-drawer-items', '.cart-drawer__footer'];
          for (const selector of selectors) {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if (targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
          }
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      return fetch(`${routes.cart_url}?section_id=main-cart-items`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const sourceQty = html.querySelector('cart-items');
          this.innerHTML = sourceQty.innerHTML;
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  getSectionsToRender() {
    return [
      {
        id: 'main-cart-items',
        section: document.getElementById('main-cart-items').dataset.id,
        selector: '.js-contents',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
      {
        id: 'cart-live-region-text',
        section: 'cart-live-region-text',
        selector: '.shopify-section',
      },
      {
        id: 'main-cart-footer',
        section: document.getElementById('main-cart-footer').dataset.id,
        selector: '.js-contents',
      },
    ];
  }

  updateQuantity(line, quantity, event, name, variantId) {
    const eventTarget = event.currentTarget instanceof CartRemoveButton ? 'clear' : 'change';
    const cartPerformanceUpdateMarker = CartPerformance.createStartingMarker(`${eventTarget}:user-action`);

    this.enableLoading(line);

    const action = quantity === 0 ? 'remove' : 'update';
    const quantityInput = this.querySelector(`#Quantity-${line}`) || this.querySelector(`#Drawer-quantity-${line}`);
    const lineVariantId = variantId || quantityInput?.dataset.quantityVariantId;
    const lineKey = quantityInput?.dataset.quantityLineKey;
    const linesUpdateDeferred = this.createCartLinesUpdateEvent(action, lineVariantId, quantity, lineKey);

    // Cache sections before the fetch so we read dataset.id while elements still exist in the DOM
    const sectionsToRender = this.getSectionsToRender();

    const body = JSON.stringify({
      line,
      quantity,
      sections: sectionsToRender.map((section) => section.section),
      sections_url: window.location.pathname,
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);

        if (parsedState.errors) {
          this.dispatchCartErrorEvent(parsedState.errors, 'INVALID');
          linesUpdateDeferred?.reject(new Error(parsedState.errors));
        } else {
          this.resolveCartLinesUpdate(linesUpdateDeferred, parsedState);
        }

        CartPerformance.measure(`${eventTarget}:paint-updated-sections`, () => {
          const quantityElement =
            document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
          const items = document.querySelectorAll('.cart-item');

          if (parsedState.errors) {
            // 2026-08-11 — the row can already be gone (a second request for a
            // line index that no longer exists), and quantityElement was
            // resolved before the section swap. Guard the write.
            if (quantityElement) quantityElement.value = quantityElement.getAttribute('value');
            this.updateLiveRegions(line, parsedState.errors);
            return;
          }

          this.classList.toggle('is-empty', parsedState.item_count === 0);
          const cartDrawerWrapper = document.querySelector('cart-drawer');
          const cartFooter = document.getElementById('main-cart-footer');

          if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
          if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);

          sectionsToRender.forEach((section) => {
            const elementToReplace =
              document.getElementById(section.id).querySelector(section.selector) ||
              document.getElementById(section.id);
            elementToReplace.innerHTML = this.getSectionInnerHTML(
              parsedState.sections[section.section],
              section.selector
            );
          });
          const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
          let message = '';
          if (quantityElement && items.length === parsedState.items.length && updatedValue !== parseInt(quantityElement.value)) {
            if (typeof updatedValue === 'undefined') {
              message = window.cartStrings.error;
            } else {
              message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
            }
          }
          this.updateLiveRegions(line, message);

          const lineItem =
            document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
          if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
            cartDrawerWrapper
              ? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`))
              : lineItem.querySelector(`[name="${name}"]`).focus();
          } else if (parsedState.item_count === 0 && cartDrawerWrapper?.querySelector('.drawer__inner-empty')) {
            trapFocus(cartDrawerWrapper.querySelector('.drawer__inner-empty'), cartDrawerWrapper.querySelector('a'));
          } else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
            trapFocus(cartDrawerWrapper, document.querySelector('.cart-item__name'));
          }
        });

        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: parsedState, variantId: variantId });
      })
      .catch((e) => {
        this.querySelectorAll('.loading__spinner').forEach((overlay) => overlay.classList.add('hidden'));
        const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
        if (errors) errors.textContent = window.cartStrings.error;
        this.dispatchCartErrorEvent(window.cartStrings.error, 'SERVICE_UNAVAILABLE');
        linesUpdateDeferred?.reject(e);
      })
      .finally(() => {
        this.disableLoading(line);
        CartPerformance.measureFromMarker(`${eventTarget}:user-action`, cartPerformanceUpdateMarker);
      });
  }

  createCartLinesUpdateEvent(action, variantId, quantity, lineKey) {
    const { CartLinesUpdateEvent } = window.StandardEvents || {};
    if (!CartLinesUpdateEvent || !variantId) return null;
    // No AJAX line key on the row — likely cached HTML rendered before this
    // attribute landed. Skip dispatch rather than emit an event with id: ''.
    if (!lineKey) return null;

    const deferred = CartLinesUpdateEvent.createPromise();
    this.dispatchEvent(
      new CartLinesUpdateEvent({
        action,
        context: 'cart',
        lines: [{ id: lineKey, quantity }],
        promise: deferred.promise,
      })
    );
    return deferred;
  }

  resolveCartLinesUpdate(deferred, parsedState) {
    if (!deferred) return;
    const { CartLinesUpdateEvent } = window.StandardEvents || {};
    if (!CartLinesUpdateEvent) return;

    deferred.resolve({ cart: CartLinesUpdateEvent.createCartFromAjaxResponse(parsedState) });
  }

  dispatchCartErrorEvent(message, code) {
    const { CartErrorEvent } = window.StandardEvents || {};
    if (!CartErrorEvent) return;
    this.dispatchEvent(new CartErrorEvent({ error: message, code }));
  }

  updateLiveRegions(line, message) {
    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
    if (lineItemError) lineItemError.querySelector('.cart-item__error-text').textContent = message;

    this.lineItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus =
      document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
    cartStatus.setAttribute('aria-hidden', false);

    setTimeout(() => {
      cartStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.add('cart__items--disabled');

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove('hidden'));

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute('aria-hidden', false);
  }

  disableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.remove('cart__items--disabled');

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    cartItemElements.forEach((overlay) => overlay.classList.add('hidden'));
    cartDrawerItemElements.forEach((overlay) => overlay.classList.add('hidden'));
  }
}

customElements.define('cart-items', CartItems);

if (!customElements.get('cart-note')) {
  customElements.define(
    'cart-note',
    class CartNote extends HTMLElement {
      constructor() {
        super();

        this.addEventListener(
          'input',
          debounce((event) => {
            const newNote = event.target.value;
            const noteDeferred = this.dispatchNoteUpdateEvent(newNote);

            const body = JSON.stringify({ note: newNote });
            fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } })
              .then((r) => r.json())
              .then((cart) => {
                if (!cart || cart.errors) {
                  throw Object.assign(new Error(cart?.errors), { code: 'INVALID' });
                }

                if (noteDeferred) {
                  const { CartNoteUpdateEvent } = window.StandardEvents || {};
                  if (CartNoteUpdateEvent) {
                    noteDeferred.resolve({ cart: CartNoteUpdateEvent.createCartFromAjaxResponse(cart) });
                  }
                }
                CartPerformance.measureFromEvent('note-update:user-action', event);
              })
              .catch((e) => {
                noteDeferred?.reject(e);
                const { CartErrorEvent } = window.StandardEvents || {};
                if (CartErrorEvent) {
                  this.dispatchEvent(
                    new CartErrorEvent({
                      error: e.message || 'Note update failed',
                      code: e.code || 'SERVICE_UNAVAILABLE',
                    })
                  );
                }
              });
          }, ON_CHANGE_DEBOUNCE_TIMER)
        );
      }

      dispatchNoteUpdateEvent(newNote) {
        const { CartNoteUpdateEvent } = window.StandardEvents || {};
        if (!CartNoteUpdateEvent) return null;

        const context = this.closest('dialog') || this.closest('cart-drawer') ? 'dialog' : 'cart';
        const deferred = CartNoteUpdateEvent.createPromise();

        this.dispatchEvent(
          new CartNoteUpdateEvent({
            context,
            note: newNote,
            promise: deferred.promise,
          })
        );

        return deferred;
      }
    }
  );
}
