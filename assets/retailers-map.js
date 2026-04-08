/**
 * Retailers Map - Mapbox Integration
 * Displays retailer locations with custom markers
 */

class RetailersMap {
  constructor() {
    this.mapContainer = document.getElementById('retailers-map');
    if (!this.mapContainer) return;

    this.token = this.mapContainer.dataset.mapboxToken;
    this.style = this.mapContainer.dataset.mapStyle || 'mapbox://styles/mapbox/light-v11';
    this.zoom = parseInt(this.mapContainer.dataset.initialZoom) || 6;
    this.markerColor = this.mapContainer.dataset.markerColor || '#000000';
    this.markerSvg = this.mapContainer.dataset.markerSvg || '';
    this.retailers = window.retailersData || [];
    this.markers = [];
    this.map = null;
    this.activePopup = null;
    window._retailersMapInstance = this;

    if (!this.token) {
      console.warn('Mapbox token not provided');
      this.showTokenWarning();
      return;
    }

    if (this.retailers.length === 0) {
      console.warn('No retailer data found');
      return;
    }

    // Debug: log first few retailers to verify data
    console.log('Retailers loaded:', this.retailers.length);
    console.log('Sample retailer:', this.retailers[0]);

    this.init();
  }

  showTokenWarning() {
    this.mapContainer.innerHTML = `
      <div class="retailers-map__warning">
        <p>Mapbox token required. Add it in Theme Customizer > Retailers Map section.</p>
      </div>
    `;
  }

  init() {
    mapboxgl.accessToken = this.token;

    // Calculate center from retailers
    const center = this.calculateCenter();

    // Debug: log container dimensions at init time
    const rect = this.mapContainer.getBoundingClientRect();
    console.log('Map container rect at init:', rect);

    this.map = new mapboxgl.Map({
      container: 'retailers-map',
      style: this.style,
      center: center,
      zoom: this.zoom,
      projection: 'mercator', // Force mercator - Mapbox v3 defaults to globe which misplaces markers
      attributionControl: true
    });

    // Add navigation controls
    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    // Wait for map to load before adding markers
    this.map.on('load', () => {
      // Force resize to ensure Mapbox correctly measures the container
      this.map.resize();

      // Debug: verify a known coordinate projects to a sensible pixel position
      const testPoint = this.map.project([4.4028, 51.2175]);
      const containerRect = this.map.getContainer().getBoundingClientRect();
      console.log('Container size:', containerRect.width, 'x', containerRect.height);
      console.log('Antwerpen projects to pixel:', testPoint);
      console.log('First retailer coords:', this.retailers[0]?.long, this.retailers[0]?.lat);

      this.addMarkers();
      this.fitMapToBounds();
      this.renderRetailerList();
    });

    // Also resize after fonts/images load in case layout shifts
    window.addEventListener('load', () => {
      this.map.resize();
    });

    // Extra resize after a short delay in case of CSS transitions on the container
    setTimeout(() => this.map.resize(), 300);
  }

  calculateCenter() {
    if (this.retailers.length === 0) return [4.5, 50.5]; // Default: Belgium

    const validRetailers = this.retailers.filter(r => r.lat && r.long);
    if (validRetailers.length === 0) return [4.5, 50.5];

    const sumLat = validRetailers.reduce((sum, r) => sum + parseFloat(r.lat), 0);
    const sumLng = validRetailers.reduce((sum, r) => sum + parseFloat(r.long), 0);

    return [sumLng / validRetailers.length, sumLat / validRetailers.length];
  }

  fitMapToBounds() {
    const validRetailers = this.retailers.filter(r => r.lat && r.long);
    if (validRetailers.length < 2) return;

    const bounds = new mapboxgl.LngLatBounds();
    validRetailers.forEach(retailer => {
      bounds.extend([parseFloat(retailer.long), parseFloat(retailer.lat)]);
    });

    this.map.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      maxZoom: 12
    });
  }

  createMarkerElement(retailer) {
    const el = document.createElement('div');
    el.className = 'retailers-map__marker';
    el.style.width = '24px';
    el.style.height = '32px';

    const img = document.createElement('img');
    img.src = this.markerSvg;
    img.alt = retailer.shop || 'Store location';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.display = 'block';
    img.style.cursor = 'pointer';
    img.style.pointerEvents = 'none'; // Let click pass through to parent div
    img.style.transition = 'transform 0.2s ease';

    el.appendChild(img);

    return el;
  }

  createPopupContent(retailer) {
    const name = retailer.shop ? `<span class="retailers-map__popup-title">${this.escapeHtml(retailer.shop)}</span>` : '';

    const addressParts = [];
    if (retailer.address) addressParts.push(this.escapeHtml(retailer.address));
    if (retailer.zip || retailer.city) {
      addressParts.push(`${this.escapeHtml(retailer.zip || '')} ${this.escapeHtml(retailer.city || '')}`.trim());
    }
    const address = addressParts.length > 0 ? `<span class="retailers-map__popup-address">${addressParts.join(', ')}</span>` : '';

    const inner = `${name}${address}`;

    if (retailer.url) {
      const href = this.escapeHtml(retailer.url.startsWith('http') ? retailer.url : 'https://' + retailer.url);
      return `<a href="${href}" target="_blank" rel="noopener" class="retailers-map__popup">${inner}</a>`;
    }
    return `<div class="retailers-map__popup">${inner}</div>`;
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  addMarkers() {
    this.retailers.forEach((retailer, index) => {
      const lng = parseFloat(retailer.long);
      const lat = parseFloat(retailer.lat);
      if (isNaN(lng) || isNaN(lat)) return;

      const el = this.createMarkerElement(retailer);
      el.style.opacity = '0.55';
      el.style.transition = 'opacity 0.2s ease';
      el.style.cursor = 'pointer';

      el.addEventListener('click', () => {
        this.closeActivePopup();
        const popup = new mapboxgl.Popup({
          offset: [0, -32],
          closeButton: true,
          closeOnClick: true,
          className: 'retailers-map__popup-container'
        })
          .setLngLat([lng, lat])
          .setHTML(this.createPopupContent(retailer))
          .addTo(this.map);
        this.activePopup = popup;
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(this.map);

      this.markers.push({ marker, el, index });
    });
  }

  highlightMarker(index) {
    this.markers.forEach(({ el, index: i }) => {
      const active = i === index;
      el.style.opacity = active ? '1' : '0.55';
      el.style.zIndex  = active ? '10' : '';
      const img = el.querySelector('img');
      if (img) img.style.transform = active ? 'scale(1.35)' : 'scale(1)';
    });
  }

  resetMarkerHighlight() {
    this.markers.forEach(({ el }) => {
      el.style.opacity = '0.55';
      el.style.zIndex  = '';
      const img = el.querySelector('img');
      if (img) img.style.transform = 'scale(1)';
    });
  }

  _bindMarkerEvents() {}


  closeActivePopup() {
    if (this.activePopup) {
      this.activePopup.remove();
      this.activePopup = null;
    }
  }

  highlightListItem(index) {
    const listItems = document.querySelectorAll('.retailers-map__list-item');
    listItems.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
  }

  renderRetailerList() {
    const listContainer = document.getElementById('retailers-list');
    if (!listContainer) return;

    const html = this.retailers.map((retailer, index) => {
      const addressParts = [];
      if (retailer.address) addressParts.push(this.escapeHtml(retailer.address));
      if (retailer.zip || retailer.city) {
        addressParts.push(`${this.escapeHtml(retailer.zip || '')} ${this.escapeHtml(retailer.city || '')}`.trim());
      }
      if (retailer.country) addressParts.push(this.escapeHtml(retailer.country));

      return `
        <div class="retailers-map__list-item" data-index="${index}">
          <div class="retailers-map__list-item-content">
            ${retailer.shop ? `<h4 class="retailers-map__list-name">${this.escapeHtml(retailer.shop)}</h4>` : ''}
            <p class="retailers-map__list-address">${addressParts.join(', ')}</p>
            ${retailer.url ? `<a href="${this.escapeHtml(retailer.url)}" target="_blank" rel="noopener" class="retailers-map__list-link">Visit Website</a>` : ''}
          </div>
          <button class="retailers-map__list-locate" aria-label="Show on map">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');

    listContainer.innerHTML = html;

    // Add click handlers for list items
    listContainer.querySelectorAll('.retailers-map__list-item').forEach((item, index) => {
      item.addEventListener('click', () => this.focusOnRetailer(index));
    });
  }

  focusOnRetailer(index) {
    const retailer = this.retailers[index];
    if (!retailer) return;

    const lng = parseFloat(retailer.long);
    const lat = parseFloat(retailer.lat);

    this.map.flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 1000
    });

    this.closeActivePopup();

    const popup = new mapboxgl.Popup({
      offset: [0, -30],
      closeButton: true,
      closeOnClick: true,
      className: 'retailers-map__popup-container'
    })
      .setLngLat([lng, lat])
      .setHTML(this.createPopupContent(retailer))
      .addTo(this.map);

    this.activePopup = popup;
    this.highlightListItem(index);
  }
}

function buildCountryAccordion() {
  const retailers = window.retailersData || [];
  const container = document.getElementById('retailers-country-list');
  if (!retailers.length || !container) return;

  const grouped = retailers.reduce((acc, r) => {
    const country = (r.country || 'Other').toLowerCase();
    if (!acc[country]) acc[country] = [];
    acc[country].push(r);
    return acc;
  }, {});

  let html = '';
  Object.keys(grouped).sort().forEach(country => {
    const shops = grouped[country].sort((a, b) => a.shop.localeCompare(b.shop));
    html += `<div class="retailers-country">
      <div class="retailers-country__title">${country}</div>
      <ul class="retailers-country__list" style="overflow:hidden;height:0;">${
        shops.map(s => {
          const idx = retailers.indexOf(s);
          return `<li class="retailers-country__shop" data-index="${idx}">
          <a href="${s.url || '#'}" target="_blank" rel="noopener" class="retailers-shop__link">
            <span class="retailers-shop__name">${s.shop}</span>
          </a>
          <span class="retailers-shop__address">${s.address}, ${s.zip} ${s.city}</span>
        </li>`;
        }).join('')
      }</ul>
    </div>`;
  });
  container.innerHTML = html;

  function animateItem(item, list, opening) {
    if (list._raf) cancelAnimationFrame(list._raf);
    list.style.height = 'auto';
    list.style.maxHeight = 'none';
    const fullH = list.offsetHeight;
    const startH = opening ? 0 : fullH;
    const endH   = opening ? fullH : 0;
    list.style.height = startH + 'px';
    const duration = 350;
    let t0 = null;
    function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
    function tick(ts) {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      list.style.height = (startH + (endH - startH) * ease(p)) + 'px';
      if (p < 1) { list._raf = requestAnimationFrame(tick); }
      else { list.style.height = opening ? 'auto' : '0'; }
    }
    list._raf = requestAnimationFrame(tick);
  }

  const allItems = Array.from(container.querySelectorAll('.retailers-country'));

  allItems.forEach(item => {
    const header = item.querySelector('.retailers-country__title');
    const list   = item.querySelector('.retailers-country__list');

    header.addEventListener('click', () => {
      const opening = !item.classList.contains('is-open');

      // Close all other open items
      allItems.forEach(other => {
        if (other !== item && other.classList.contains('is-open')) {
          other.classList.remove('is-open');
          animateItem(other, other.querySelector('.retailers-country__list'), false);
        }
      });

      item.classList.toggle('is-open', opening);
      animateItem(item, list, opening);
    });
  });

  // Pin opacity: highlight pin when hovering a shop in the list
  container.querySelectorAll('.retailers-country__shop').forEach(shopEl => {
    const idx = parseInt(shopEl.dataset.index, 10);
    shopEl.addEventListener('mouseenter', () => {
      const inst = window._retailersMapInstance;
      if (!inst || isNaN(idx)) return;
      inst.highlightMarker(idx);
    });
    shopEl.addEventListener('mouseleave', () => {
      const inst = window._retailersMapInstance;
      if (!inst) return;
      inst.resetMarkerHighlight();
    });
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Inject spacer after .retailers-page-layout if not already in DOM
  const layout = document.querySelector('.retailers-page-layout');
  if (layout && !document.querySelector('.retailer-spacer')) {
    const spacer = document.createElement('div');
    spacer.className = 'retailer-spacer';
    spacer.innerHTML = '&nbsp;';
    layout.insertAdjacentElement('afterend', spacer);
  }

  // Detach fixed map panel when layout bottom passes viewport bottom
  const layoutEl = document.querySelector('.retailers-page-layout');
  const mapLeftEl = document.querySelector('.retailers-map-left');
  if (layoutEl && mapLeftEl) {
    function updateMapPosition() {
      const atBottom = layoutEl.getBoundingClientRect().bottom <= window.innerHeight;
      mapLeftEl.classList.toggle('is-at-bottom', atBottom);
    }
    window.addEventListener('scroll', updateMapPosition, { passive: true });
    updateMapPosition();
  }

  new RetailersMap();
  buildCountryAccordion();
});
