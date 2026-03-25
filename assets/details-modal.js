class DetailsModal extends HTMLElement {
  constructor() {
    super();
    this.detailsContainer = this.querySelector('details');
    this.summaryToggle = this.querySelector('summary');

    this.detailsContainer.addEventListener('keyup', (event) => event.code.toUpperCase() === 'ESCAPE' && this.close());
    this.summaryToggle.addEventListener('click', this.onSummaryClick.bind(this));
    this.querySelector('button[type="button"]').addEventListener('click', this.close.bind(this));

    this.summaryToggle.setAttribute('role', 'button');
  }

  isOpen() {
    return this.detailsContainer.hasAttribute('open');
  }

  onSummaryClick(event) {
    event.preventDefault();
    event.target.closest('details').hasAttribute('open') ? this.close() : this.open(event);
  }

  onBodyClick(event) {
    if (!this.contains(event.target) || event.target.classList.contains('modal-overlay')) this.close(false);
  }

  open(event) {
    this.onBodyClickEvent = this.onBodyClickEvent || this.onBodyClick.bind(this);
    event.target.closest('details').setAttribute('open', true);
    document.body.addEventListener('click', this.onBodyClickEvent);
    document.body.classList.add('overflow-hidden');

    // Close the menu drawer if open using its proper close method
    const menuDrawer = document.querySelector('header-drawer');
    if (menuDrawer && menuDrawer.closeMenuDrawer) {
      // Create a synthetic event to pass to closeMenuDrawer
      const syntheticEvent = new Event('click');
      menuDrawer.closeMenuDrawer(syntheticEvent);
    }

    // Activate the menu blend overlay for the search modal
    const blendOverlay = document.getElementById('menu-blend-overlay');
    if (blendOverlay) {
      blendOverlay.classList.add('active');
    }

    trapFocus(
      this.detailsContainer.querySelector('[tabindex="-1"]'),
      this.detailsContainer.querySelector('input:not([type="hidden"])')
    );
  }

  close(focusToggle = true) {
    removeTrapFocus(focusToggle ? this.summaryToggle : null);
    this.detailsContainer.removeAttribute('open');
    document.body.removeEventListener('click', this.onBodyClickEvent);
    document.body.classList.remove('overflow-hidden');

    // Deactivate the menu blend overlay
    const blendOverlay = document.getElementById('menu-blend-overlay');
    if (blendOverlay) {
      blendOverlay.classList.remove('active');
    }
  }
}

customElements.define('details-modal', DetailsModal);
