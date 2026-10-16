/**
 * FAG EVENTOS - LÓGICA DE INTERACCIÓN Y EXPERIENCIA DE USUARIO
 */

document.addEventListener('DOMContentLoaded', () => {
  // 0. Cargar y Aplicar Datos Dinámicos Centrales
  if (window.fagStore) {
    window.fagStore.applyToDOM();
    // Intento de sincronización en segundo plano si la nube está configurada
    if (window.fagStore.isCloudConfigured()) {
      window.fagStore.fetchFromCloud().then(cloudData => {
        if (cloudData) {
          window.fagStore.applyToDOM();
          bindGalleryLightbox();
        }
      });
    }
  }

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
      document.body.style.overflow = 'hidden';
    }
  };

  const closeDrawer = () => {
    if (mobileDrawer && drawerBackdrop) {
      mobileDrawer.classList.remove('active');
      drawerBackdrop.classList.remove('active');
      if (mobileDrawerOpen) mobileDrawerOpen.classList.remove('active');
      document.body.style.overflow = '';
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
  const statNumbers = document.querySelectorAll('.stat-number');
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
        statNumbers.forEach(stat => {
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
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
      // Limpiar cualquier timeout pendiente para este elemento
      if (galleryFilterTimeouts.has(item)) {
        clearTimeout(galleryFilterTimeouts.get(item));
        galleryFilterTimeouts.delete(item);
      }

      const itemCategory = item.getAttribute('data-category') || '';
      const categories = itemCategory.toLowerCase().split(/\s+/);
      const isMatch = filterValue === 'all' || categories.includes(filterValue.toLowerCase());

      if (isMatch) {
        item.style.display = 'block';
        const t = setTimeout(() => {
          item.style.opacity = '1';
          item.style.transform = 'translateY(0) scale(1)';
        }, 20);
        galleryFilterTimeouts.set(item, t);
      } else {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px) scale(0.95)';
        const t = setTimeout(() => {
          item.style.display = 'none';
        }, 220);
        galleryFilterTimeouts.set(item, t);
      }
    });
  };

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
  const getVisibleGalleryItems = () => Array.from(document.querySelectorAll('.gallery-item')).filter(i => i.style.display !== 'none');

  const updateLightboxContent = (index) => {
    const items = getVisibleGalleryItems();
    if (!items.length) return;
    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;
    currentGalleryIndex = index;

    const item = items[currentGalleryIndex];
    if (!item) return;

    const imgSrc = item.getAttribute('data-img') || item.querySelector('.gallery-img')?.src;
    const title = item.querySelector('.gallery-title')?.textContent || 'FAG Eventos';
    const category = item.getAttribute('data-category-name') || 'Evento';
    const link = item.getAttribute('data-link') || 'https://www.instagram.com/fag.eventos/';

    if (lightboxImg) {
      lightboxImg.src = imgSrc;
      lightboxImg.alt = title;
    }
    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxCategory) lightboxCategory.textContent = category;

    if (lightboxIgLink) {
      lightboxIgLink.href = link;
      if (lightboxIgText) {
        if (link.includes('/reel/') || link.includes('/p/')) {
          lightboxIgText.textContent = item.querySelector('.video-play-indicator') ? 'Ver Reel en Instagram' : 'Ver Publicación';
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
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  };

  const bindGalleryLightbox = () => {
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item) => {
      // Evitar listeners duplicados
      item.onclick = () => {
        const items = getVisibleGalleryItems();
        const index = items.indexOf(item);
        openLightbox(index !== -1 ? index : 0);
      };
    });
  };

  bindGalleryLightbox();

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

  // 7. Dynamic WhatsApp Buttons
  const initWhatsAppListeners = () => {
    const whatsappBtns = document.querySelectorAll('.dynamic-whatsapp-btn');
    whatsappBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const contact = window.fagStore ? window.fagStore.getData().contact : null;
        const phone = contact?.whatsapp || "5493517580045";
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
      if (profileFernando) profileFernando.style.display = directorId === 'fernando-gigena' ? 'block' : 'none';
      if (profileFederico) profileFederico.style.display = directorId === 'federico-pellizzon' ? 'block' : 'none';
      directorModal.classList.add('active');
      directorModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeDirectorModal = () => {
      directorModal.classList.remove('active');
      directorModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
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
});
