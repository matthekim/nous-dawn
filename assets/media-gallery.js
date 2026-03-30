if (!customElements.get('media-gallery')) {
  customElements.define(
    'media-gallery',
    class MediaGallery extends HTMLElement {
      constructor() {
        super();
        this.elements = {
          liveRegion: this.querySelector('[id^="GalleryStatus"]'),
          viewer: this.querySelector('[id^="GalleryViewer"]'),
          thumbnails: this.querySelector('[id^="GalleryThumbnails"]'),
          pagination: this.querySelector('[id^="MediaPagination"]'),
        };
        this.mql = window.matchMedia('(min-width: 750px)');
        
        // Autoplay carousel settings
        this.autoplaySpeed = 4000; // 4 seconds between slides
        this.autoplayInterval = null;
        this.currentMediaIndex = 0;
        
        // Setup pagination bullet click handlers
        if (this.elements.pagination) {
          this.elements.pagination.querySelectorAll('.product__media-pagination-bullet').forEach((bullet, index) => {
            bullet.addEventListener('click', () => this.onPaginationClick(index));
          });
        }
        
        // Setup autoplay carousel
        this.setupAutoplay();
        
        if (!this.elements.thumbnails) return;

        this.elements.viewer.addEventListener('slideChanged', debounce(this.onSlideChanged.bind(this), 500));
        this.elements.thumbnails.querySelectorAll('[data-target]').forEach((mediaToSwitch) => {
          mediaToSwitch
            .querySelector('button')
            .addEventListener('click', this.setActiveMedia.bind(this, mediaToSwitch.dataset.target, false));
        });
        if (this.dataset.desktopLayout.includes('thumbnail') && this.mql.matches) this.removeListSemantic();
      }
      
      setupAutoplay() {
        // Get all media items
        this.mediaItems = this.elements.viewer ? 
          Array.from(this.elements.viewer.querySelectorAll('[data-media-id]')) : [];
        
        // Only setup autoplay if there are multiple images
        if (this.mediaItems.length <= 1) return;
        
        // Pause on hover/focus
        this.addEventListener('mouseenter', this.pauseAutoplay.bind(this));
        this.addEventListener('mouseleave', this.playAutoplay.bind(this));
        this.addEventListener('focusin', this.pauseAutoplay.bind(this));
        this.addEventListener('focusout', this.playAutoplay.bind(this));
        
        // Start autoplay
        this.playAutoplay();
      }
      
      playAutoplay() {
        if (this.mediaItems.length <= 1) return;
        this.pauseAutoplay(); // Clear any existing interval
        this.autoplayInterval = setInterval(this.autoRotateMedia.bind(this), this.autoplaySpeed);
      }
      
      pauseAutoplay() {
        if (this.autoplayInterval) {
          clearInterval(this.autoplayInterval);
          this.autoplayInterval = null;
        }
      }
      
      autoRotateMedia() {
        if (this.mediaItems.length <= 1) return;
        
        // Find the current active media index
        const activeMedia = this.elements.viewer.querySelector('[data-media-id].is-active');
        if (activeMedia) {
          this.currentMediaIndex = this.mediaItems.indexOf(activeMedia);
        }
        
        // Move to next media (loop back to start if at end)
        this.currentMediaIndex = (this.currentMediaIndex + 1) % this.mediaItems.length;
        
        const nextMedia = this.mediaItems[this.currentMediaIndex];
        if (nextMedia) {
          const mediaId = nextMedia.dataset.mediaId;
          this.setActiveMedia(mediaId, false);
        }
      }

      onPaginationClick(index) {
        const thumbnailItems = this.elements.thumbnails.querySelectorAll('[data-target]');
        if (thumbnailItems[index]) {
          const mediaId = thumbnailItems[index].dataset.target;
          this.setActiveMedia(mediaId, false);
        }
      }

      onSlideChanged(event) {
        const thumbnail = this.elements.thumbnails.querySelector(
          `[data-target="${event.detail.currentElement.dataset.mediaId}"]`
        );
        this.setActiveThumbnail(thumbnail);
      }

      setActiveMedia(mediaId, prepend) {
        const activeMedia =
          this.elements.viewer.querySelector(`[data-media-id="${mediaId}"]`) ||
          this.elements.viewer.querySelector('[data-media-id]');
        if (!activeMedia) {
          return;
        }
        this.elements.viewer.querySelectorAll('[data-media-id]').forEach((element) => {
          element.classList.remove('is-active');
        });
        activeMedia?.classList?.add('is-active');

        if (prepend) {
          activeMedia.parentElement.firstChild !== activeMedia && activeMedia.parentElement.prepend(activeMedia);

          if (this.elements.thumbnails) {
            const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
            activeThumbnail.parentElement.firstChild !== activeThumbnail && activeThumbnail.parentElement.prepend(activeThumbnail);
          }

          if (this.elements.viewer.slider) this.elements.viewer.resetPages();
        }

        this.preventStickyHeader();
        window.setTimeout(() => {
          if (!this.mql.matches || this.elements.thumbnails) {
            activeMedia.parentElement.scrollTo({ left: activeMedia.offsetLeft });
          }
          const activeMediaRect = activeMedia.getBoundingClientRect();
          // Don't scroll if the image is already in view
          if (activeMediaRect.top > -0.5) return;
          const top = activeMediaRect.top + window.scrollY;
          window.scrollTo({ top: top, behavior: 'smooth' });
        });
        this.playActiveMedia(activeMedia);

        if (!this.elements.thumbnails) return;
        const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
        this.setActiveThumbnail(activeThumbnail);
        this.announceLiveRegion(activeMedia, activeThumbnail.dataset.mediaPosition);
      }

      setActiveThumbnail(thumbnail) {
        if (!this.elements.thumbnails || !thumbnail) return;

        this.elements.thumbnails
          .querySelectorAll('button')
          .forEach((element) => element.removeAttribute('aria-current'));
        thumbnail.querySelector('button').setAttribute('aria-current', true);
        
        // Update pagination bullets
        if (this.elements.pagination) {
          const thumbnailItems = Array.from(this.elements.thumbnails.querySelectorAll('[data-target]'));
          const activeIndex = thumbnailItems.indexOf(thumbnail);
          this.elements.pagination.querySelectorAll('.product__media-pagination-bullet').forEach((bullet, index) => {
            bullet.classList.toggle('is-active', index === activeIndex);
          });
        }
        
        if (this.elements.thumbnails.isSlideVisible(thumbnail, 10)) return;

        this.elements.thumbnails.slider.scrollTo({ left: thumbnail.offsetLeft });
      }

      announceLiveRegion(activeItem, position) {
        const image = activeItem.querySelector('.product__modal-opener--image img');
        if (!image) return;
        image.onload = () => {
          this.elements.liveRegion.setAttribute('aria-hidden', false);
          this.elements.liveRegion.innerHTML = window.accessibilityStrings.imageAvailable.replace('[index]', position);
          setTimeout(() => {
            this.elements.liveRegion.setAttribute('aria-hidden', true);
          }, 2000);
        };
        image.src = image.src;
      }

      playActiveMedia(activeItem) {
        window.pauseAllMedia();
        const deferredMedia = activeItem.querySelector('.deferred-media');
        if (deferredMedia) deferredMedia.loadContent(false);
      }

      preventStickyHeader() {
        this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');
        if (!this.stickyHeader) return;
        this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
      }

      removeListSemantic() {
        if (!this.elements.viewer.slider) return;
        this.elements.viewer.slider.setAttribute('role', 'presentation');
        this.elements.viewer.sliderItems.forEach((slide) => slide.setAttribute('role', 'presentation'));
      }
    }
  );
}
