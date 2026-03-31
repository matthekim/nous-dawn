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

    this.map = new mapboxgl.Map({
      container: 'retailers-map',
      style: this.style,
      center: center,
      zoom: this.zoom,
      attributionControl: true
    });

    // Add navigation controls
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Wait for map to load before adding markers
    this.map.on('load', () => {
      // Force resize to ensure Mapbox correctly measures the container
      // (important when container uses position:fixed or is inside a transformed element)
      this.map.resize();
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

    el.appendChild(img);

    return el;
  }

  createPopupContent(retailer) {
    const parts = [];
    
    if (retailer.shop) {
      parts.push(`<h3 class="retailers-map__popup-title">${this.escapeHtml(retailer.shop)}</h3>`);
    }
    
    const addressParts = [];
    if (retailer.address) addressParts.push(this.escapeHtml(retailer.address));
    if (retailer.zip || retailer.city) {
      addressParts.push(`${this.escapeHtml(retailer.zip || '')} ${this.escapeHtml(retailer.city || '')}`.trim());
    }
    if (retailer.country) addressParts.push(this.escapeHtml(retailer.country));
    
    if (addressParts.length > 0) {
      parts.push(`<p class="retailers-map__popup-address">${addressParts.join('<br>')}</p>`);
    }
    
    if (retailer.url) {
      parts.push(`<a href="${this.escapeHtml(retailer.url)}" target="_blank" rel="noopener" class="retailers-map__popup-link">Visit Website →</a>`);
    }

    return `<div class="retailers-map__popup">${parts.join('')}</div>`;
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  addMarkers() {
    this.retailers.forEach((retailer, index) => {
      if (!retailer.lat || !retailer.long) return;

      const lng = parseFloat(retailer.long);
      const lat = parseFloat(retailer.lat);
      
      // Validate coordinates
      if (isNaN(lng) || isNaN(lat)) {
        console.warn('Invalid coordinates for retailer:', retailer.shop, retailer.lat, retailer.long);
        return;
      }

      const el = this.createMarkerElement(retailer);
      
      const popup = new mapboxgl.Popup({
        offset: [0, -32], // Offset to account for marker height
        closeButton: true,
        closeOnClick: true,
        className: 'retailers-map__popup-container'
      })
        .setLngLat([lng, lat])
        .setHTML(this.createPopupContent(retailer));

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
      })
        .setLngLat([lng, lat])
        .addTo(this.map);

      // Store reference for list interaction
      marker.retailerIndex = index;
      marker._popup = popup;
      this.markers.push(marker);

      // Add click handler to marker element
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeActivePopup();
        popup.addTo(this.map);
        this.activePopup = popup;
        this.highlightListItem(index);
      });
    });
  }

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
    const marker = this.markers[index];
    
    if (!retailer || !marker) return;

    // Fly to location
    this.map.flyTo({
      center: [parseFloat(retailer.long), parseFloat(retailer.lat)],
      zoom: 14,
      duration: 1000
    });

    // Open popup
    this.closeActivePopup();
    const popup = marker._popup;
    if (popup) {
      popup.addTo(this.map);
      this.activePopup = popup;
    }

    // Highlight list item
    this.highlightListItem(index);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new RetailersMap();
});
