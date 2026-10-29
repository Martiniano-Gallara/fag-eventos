/**
 * FAG EVENTOS - LÓGICA DE INTERACCIÓN Y EXPERIENCIA DE USUARIO
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Navigation Scroll Effect (Passive Listener)
  const navbar = document.querySelector('.navbar');
  const handleScroll = () => {
    if (!navbar) return;
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // 2. Lateral Mobile Drawer Logic
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const mobileDrawerOpen = document.getElementById('mobileDrawerOpen') || document.querySelector('.mobile-toggle');
  const mobileDrawerClose = document.getElementById('mobileDrawerClose');
  const drawerLinks = document.querySelectorAll('.drawer-link, .drawer-footer a');

  const openDrawer = () => {
    if (mobileDrawer && drawerBackdrop) {
      mobileDrawer.classList.add('active');
      drawerBackdrop.classList.add('active');
      if (mobileDrawerOpen) mobileDrawerOpen.classList.add('active');
      document.body.classList.add('overflow-hidden');
    }
  };

  const closeDrawer = () => {
    if (mobileDrawer && drawerBackdrop) {
      mobileDrawer.classList.remove('active');
      drawerBackdrop.classList.remove('active');
      if (mobileDrawerOpen) mobileDrawerOpen.classList.remove('active');
      document.body.classList.remove('overflow-hidden');
    }
  };

  if (mobileDrawerOpen) {
    mobileDrawerOpen.addEventListener('click', () => {
      if (mobileDrawer && mobileDrawer.classList.contains('active')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  if (mobileDrawerClose) {
    mobileDrawerClose.addEventListener('click', closeDrawer);
  }

  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', closeDrawer);
  }

  drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeDrawer();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileDrawer && mobileDrawer.classList.contains('active')) {
      closeDrawer();
    }
  });

  // 3. Active Nav Link on Scroll
  const sections = document.querySelectorAll('section[id]');
  if (sections.length > 0) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY || window.pageYOffset;
          sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 120;
            const sectionId = current.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href*="${sectionId}"]`);
            
            if (navLink) {
              if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLink.classList.add('active');
              } else {
                navLink.classList.remove('active');
              }
            }
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // 4. Stats Counter Animation
  let statsCounted = false;

  const animateValue = (element, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easedProgress * (end - start) + start);
      element.textContent = current.toLocaleString('es-AR');
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = end.toLocaleString('es-AR');
      }
    };
    window.requestAnimationFrame(step);
  };

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !statsCounted) {
        statsCounted = true;
        // Volver a consultar los nodos actuales dentro del observer
        const currentStatNumbers = document.querySelectorAll('.stat-number');
        currentStatNumbers.forEach(stat => {
          const target = parseInt(stat.getAttribute('data-target'), 10);
          if (!isNaN(target)) {
            animateValue(stat, 0, target, 2000);
          }
        });
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.querySelector('.stats-section');
  if (statsSection) {
    statsObserver.observe(statsSection);
  }

  // Si los datos de la nube llegan después de que corrió la animación, mostrar directamente el valor final
  window.addEventListener('fagStoreUpdated', () => {
    if (statsCounted) {
      document.querySelectorAll('.stat-number').forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'), 10);
        if (!isNaN(target)) {
          stat.textContent = target.toLocaleString('es-AR');
        }
      });
    }
  });

  // 4.1 Accordion Logic (Servicios & Quiénes Somos)
  const setupAccordionGroup = (itemSelector, headerSelector) => {
    const items = document.querySelectorAll(itemSelector);
    items.forEach((item) => {
      const header = item.querySelector(headerSelector);
      if (!header) return;

      header.addEventListener('click', () => {
        const isAlreadyActive = item.classList.contains('active');
        const parentGroup = item.parentElement;
        const siblingItems = parentGroup ? parentGroup.querySelectorAll(itemSelector) : items;

        // Cerrar todos los items del mismo contenedor
        siblingItems.forEach(otherItem => {
          otherItem.classList.remove('active');
          const otherHeader = otherItem.querySelector(headerSelector);
          if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
        });

        // Abrir si estaba cerrado
        if (!isAlreadyActive) {
          item.classList.add('active');
          header.setAttribute('aria-expanded', 'true');
        }
      });
    });
  };

  setupAccordionGroup('.service-accordion-item', '.service-accordion-header');
  setupAccordionGroup('.about-accordion-item', '.about-accordion-header');

  // 5. Gallery Filtering con Cancelación de Timeouts (Fix Race Condition)
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryFilterTimeouts = new Map();

  const handleGalleryFilter = (filterValue) => {
    const galleryGrid = document.getElementById('galleryGrid');
    const galleryItems = document.querySelectorAll('.gallery-item');
    let visibleCount = 0;

    galleryItems.forEach(item => {
      if (galleryFilterTimeouts.has(item)) {
        clearTimeout(galleryFilterTimeouts.get(item));
        galleryFilterTimeouts.delete(item);
      }

      const itemCategory = item.getAttribute('data-category') || '';
      const categories = itemCategory.toLowerCase().split(/\s+/);
      const isMatch = filterValue === 'all' || categories.includes(filterValue.toLowerCase());

      if (isMatch) {
        visibleCount++;
        item.classList.remove('filtered-hidden');
        const t = setTimeout(() => {
          item.classList.remove('filtering-out');
        }, 20);
        galleryFilterTimeouts.set(item, t);
      } else {
        item.classList.add('filtering-out');
        const t = setTimeout(() => {
          item.classList.add('filtered-hidden');
        }, 220);
        galleryFilterTimeouts.set(item, t);
      }
    });

    if (galleryGrid) {
      galleryGrid.dataset.visibleCount = String(visibleCount);
    }
  };

  // Inicializar contador visible
  const initGalleryGrid = document.getElementById('galleryGrid');
  if (initGalleryGrid) {
    const totalVisible = initGalleryGrid.querySelectorAll('.gallery-item:not(.filtered-hidden)').length;
    initGalleryGrid.dataset.visibleCount = String(totalVisible);
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filterValue = btn.getAttribute('data-filter') || 'all';
      handleGalleryFilter(filterValue);
    });
  });

  // 6. Lightbox Modal Functionality
  const lightbox = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxMedia');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxCategory = document.getElementById('lightboxCategory');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxIgLink = document.getElementById('lightboxIgLink') || document.querySelector('.lightbox-caption .btn-ig-pill');
  const lightboxIgText = document.getElementById('lightboxIgText');

  let currentGalleryIndex = 0;
  const getVisibleGalleryItems = () => Array.from(document.querySelectorAll('.gallery-item')).filter(i => !i.classList.contains('filtered-hidden'));

  const updateLightboxContent = (index) => {
    const items = getVisibleGalleryItems();
    if (!items.length) return;
    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;
    currentGalleryIndex = index;

    const item = items[currentGalleryIndex];
    if (!item) return;

    const rawImg = item.getAttribute('data-img') || item.querySelector('.gallery-img')?.src;
    const imgSrc = window.fagStore ? window.fagStore.safeUrl(rawImg, { allowRelativeAssets: true }) : rawImg;
    const title = item.querySelector('.gallery-title')?.textContent || 'FAG Eventos';
    const category = item.getAttribute('data-category-name') || 'Evento';
    const rawLink = item.getAttribute('data-link') || 'https://www.instagram.com/fag.eventos/';
    const link = (window.fagStore ? window.fagStore.safeUrl(rawLink) : null) || 'https://www.instagram.com/fag.eventos/';

    if (lightboxImg && imgSrc) {
      lightboxImg.src = imgSrc;
      lightboxImg.alt = title;
    }
    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxCategory) lightboxCategory.textContent = category;

    if (lightboxIgLink) {
      lightboxIgLink.href = link;
      if (lightboxIgText) {
        if (link.includes('/reel/') || link.includes('/p/')) {
          const isVideo = link.includes('/reel/') || item.getAttribute('data-category')?.includes('videos') || !!item.querySelector('.video-play-indicator');
          lightboxIgText.textContent = isVideo ? 'Ver Reel en Instagram' : 'Ver Publicación';
        } else if (link.includes('highlights')) {
          lightboxIgText.textContent = 'Ver Historia Destacada';
        } else {
          lightboxIgText.textContent = 'Ver en Instagram';
        }
      }
    }
  };

  const openLightbox = (index) => {
    if (!lightbox) return;
    updateLightboxContent(index);
    lightbox.classList.add('active');
    document.body.classList.add('overflow-hidden');
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.classList.remove('overflow-hidden');
  };

  function bindGalleryLightbox() {
    const galleryGridEl = document.getElementById('galleryGrid');
    if (galleryGridEl && !galleryGridEl.dataset.lightboxBound) {
      galleryGridEl.dataset.lightboxBound = "true";
      galleryGridEl.addEventListener('click', (e) => {
        const item = e.target.closest('.gallery-item');
        if (!item) return;
        const items = getVisibleGalleryItems();
        const index = items.indexOf(item);
        openLightbox(index !== -1 ? index : 0);
      });
    }
  }

  // 7. Dynamic WhatsApp Buttons
  const initWhatsAppListeners = () => {
    const whatsappBtns = document.querySelectorAll('.dynamic-whatsapp-btn');
    whatsappBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const contact = window.fagStore ? window.fagStore.getData().contact : null;
        const rawPhone = contact?.whatsapp || "5493517580045";
        const phone = window.fagStore ? window.fagStore.onlyDigits(rawPhone) : rawPhone.replace(/\D/g, '');
        const msg = encodeURIComponent(contact?.whatsappMessage || "¡Hola FAG Eventos! Me comunico desde la web oficial para consultar por la organización y producción de un evento.");
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
      });
    });
  };

  initWhatsAppListeners();

  // 8. Director Profile Modal (quienes-somos.html)
  const directorChips = document.querySelectorAll('.summary-director-chip');
  const directorModal = document.getElementById('directorModal');
  const directorModalClose = document.getElementById('directorModalClose');
  const profileFernando = document.getElementById('profileFernando');
  const profileFederico = document.getElementById('profileFederico');

  if (directorChips.length && directorModal) {
    const openDirectorModal = (directorId) => {
      if (profileFernando) profileFernando.classList.toggle('is-hidden', directorId !== 'fernando-gigena');
      if (profileFederico) profileFederico.classList.toggle('is-hidden', directorId !== 'federico-pellizzon');
      directorModal.classList.add('active');
      directorModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('overflow-hidden');
    };

    const closeDirectorModal = () => {
      directorModal.classList.remove('active');
      directorModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('overflow-hidden');
    };

    directorChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const directorId = chip.getAttribute('data-director');
        if (directorId) openDirectorModal(directorId);
      });
    });

    if (directorModalClose) {
      directorModalClose.addEventListener('click', closeDirectorModal);
    }

    directorModal.addEventListener('click', (e) => {
      if (e.target === directorModal) closeDirectorModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && directorModal.classList.contains('active')) {
        closeDirectorModal();
      }
    });
  }

  // 9. Cargar y Aplicar Datos Dinámicos Centrales
  if (window.fagStore) {
    // 1) Renderizar de inmediato caché local o datos por defecto sin parpadeo
    window.fagStore.applyToDOM();
    bindGalleryLightbox();

    // 2) Siempre consultar al servidor en segundo plano
    window.fagStore.fetchFromCloud().then(() => {
      window.fagStore.applyToDOM();
      bindGalleryLightbox();
    });
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      updateLightboxContent(currentGalleryIndex - 1);
    });
  }
  if (lightboxNext) {
    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      updateLightboxContent(currentGalleryIndex + 1);
    });
  }

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') updateLightboxContent(currentGalleryIndex - 1);
    if (e.key === 'ArrowRight') updateLightboxContent(currentGalleryIndex + 1);
  });
});
