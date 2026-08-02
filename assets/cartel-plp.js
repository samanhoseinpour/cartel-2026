/* Cartel PLP behaviour — batch 7A.
   <cartel-sort>   : the design's sort popover driving Dawn's hidden sort_by
                     <select> (FacetSortForm). Dispatches a bubbling `input`
                     event so facets.js re-renders via AJAX. Click handling is
                     delegated from the element root because facets.js swaps
                     .sorting's innerHTML after every render.
   <cartel-facets-drawer> : plumbing over Dawn's <menu-drawer> mobile filter
                     sheet — backdrop click, document-level Esc, and a body
                     scroll lock that also survives MenuDrawer.closeSubmenu
                     (which never lifts Dawn's own overflow-hidden class). */

class CartelSort extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', (event) => {
      const option = event.target.closest('.sortopt');
      if (option) {
        this.pick(option);
        return;
      }
      if (event.target.closest('.sortbtn')) this.setOpen(!this.classList.contains('open'));
    });
    this.onDocClick = (event) => {
      if (!this.contains(event.target)) this.setOpen(false);
    };
    this.onDocKey = (event) => {
      if (event.key === 'Escape') this.setOpen(false);
    };
  }

  connectedCallback() {
    document.addEventListener('click', this.onDocClick);
    document.addEventListener('keyup', this.onDocKey);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.onDocClick);
    document.removeEventListener('keyup', this.onDocKey);
  }

  setOpen(open) {
    if (open === this.classList.contains('open')) return;
    this.classList.toggle('open', open);
    const toggle = this.querySelector('.sortbtn');
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  pick(option) {
    this.setOpen(false);
    const select = this.querySelector('select[name="sort_by"]');
    const value = option.dataset.value;
    if (!select || select.value === value) return;
    select.value = value;
    // Optimistic UI; the fetched .sorting innerHTML corrects it after render.
    const label = this.querySelector('.cl-sortlabel');
    if (label) label.textContent = option.textContent.trim();
    this.querySelectorAll('.sortopt').forEach((button) => {
      button.classList.toggle('on', button === option);
      button.setAttribute('aria-selected', button === option ? 'true' : 'false');
    });
    select.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
customElements.define('cartel-sort', CartelSort);

class CartelFacetsDrawer extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', (event) => {
      // The scrim is the .mobile-facets flex wrapper itself; clicks on the
      // sheet land on descendants and don't match.
      if (event.target.classList && event.target.classList.contains('mobile-facets')) this.close();
    });
    this.onDocKey = (event) => {
      if (event.key === 'Escape') this.close();
    };
    this.observer = new MutationObserver(() => this.syncLock());
  }

  get details() {
    return this.querySelector('details');
  }

  get isOpen() {
    const details = this.details;
    return Boolean(details && details.hasAttribute('open'));
  }

  connectedCallback() {
    document.addEventListener('keyup', this.onDocKey);
    if (this.details) this.observer.observe(this.details, { attributes: true, attributeFilter: ['open'] });
    this.syncLock();
  }

  disconnectedCallback() {
    document.removeEventListener('keyup', this.onDocKey);
    this.observer.disconnect();
    document.body.classList.remove('cl-noscroll');
  }

  syncLock() {
    document.body.classList.toggle('cl-noscroll', this.isOpen);
    // MenuDrawer.closeSubmenu (any button inside the sheet) never removes
    // Dawn's own lock class — clear it whenever the drawer is shut.
    if (!this.isOpen) document.body.classList.remove('overflow-hidden-mobile');
  }

  close() {
    if (!this.isOpen) return;
    const summary = this.querySelector('summary');
    if (summary) summary.click();
  }
}
customElements.define('cartel-facets-drawer', CartelFacetsDrawer);
