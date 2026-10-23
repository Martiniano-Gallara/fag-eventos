/**
 * FAG EVENTOS - LÓGICA DEL PANEL DE ADMINISTRACIÓN (ADMIN JS)
 */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.fagStore;
  if (!store) {
    alert("Error crítico: No se encontró el Data Store.");
    return;
  }

  // --- ELEMENTOS DEL DOM ---
  const loginScreen = document.getElementById('loginScreen');
  const adminDashboard = document.getElementById('adminDashboard');
  const loginForm = document.getElementById('loginForm');
  const pinInput = document.getElementById('pinInput');
  const btnLogout = document.getElementById('btnLogout');
  const btnHeaderSave = document.getElementById('btnHeaderSave');
  const adminToast = document.getElementById('adminToast');
  const adminToastMsg = document.getElementById('adminToastMsg');

  // Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  // Contact Inputs
  const inputWhatsapp = document.getElementById('inputWhatsapp');
  const inputWhatsappDisplay = document.getElementById('inputWhatsappDisplay');
  const inputWhatsappMsg = document.getElementById('inputWhatsappMsg');
  const inputEmail = document.getElementById('inputEmail');
  const inputInstagram = document.getElementById('inputInstagram');
  const inputInstagramFer = document.getElementById('inputInstagramFer');
  const inputInstagramFede = document.getElementById('inputInstagramFede');
  const btnTestWa = document.getElementById('btnTestWa');

  // Stats Inputs
  const stat1Target = document.getElementById('stat1Target');
  const stat1Prefix = document.getElementById('stat1Prefix');
  const stat1Label1 = document.getElementById('stat1Label1');
  const stat1Label2 = document.getElementById('stat1Label2');

  const stat2Target = document.getElementById('stat2Target');
  const stat2Prefix = document.getElementById('stat2Prefix');
  const stat2Label1 = document.getElementById('stat2Label1');
  const stat2Label2 = document.getElementById('stat2Label2');

  const stat3Target = document.getElementById('stat3Target');
  const stat3Suffix = document.getElementById('stat3Suffix');
  const stat3Label1 = document.getElementById('stat3Label1');
  const stat3Label2 = document.getElementById('stat3Label2');

  const inputHero1 = document.getElementById('inputHero1');
  const inputHero2 = document.getElementById('inputHero2');

  // Cloud Inputs
  const cloudStatusBox = document.getElementById('cloudStatusBox');
  const cloudStatusTitle = document.getElementById('cloudStatusTitle');
  const cloudStatusDesc = document.getElementById('cloudStatusDesc');
  const inputSupabaseUrl = document.getElementById('inputSupabaseUrl');
  const inputSupabaseKey = document.getElementById('inputSupabaseKey');
  const btnTestCloud = document.getElementById('btnTestCloud');
  const btnPushCloud = document.getElementById('btnPushCloud');
  const btnPullCloud = document.getElementById('btnPullCloud');
  const btnSaveCloudConfig = document.getElementById('btnSaveCloudConfig');
  const btnSyncNow = document.getElementById('btnSyncNow');
  const btnCopySql = document.getElementById('btnCopySql');
  const btnExportJson = document.getElementById('btnExportJson');
  const fileImportJson = document.getElementById('fileImportJson');
  const btnResetDefaults = document.getElementById('btnResetDefaults');

  // Security Form
  const formChangePin = document.getElementById('formChangePin');
  const inputCurrentPin = document.getElementById('inputCurrentPin');
  const inputNewPin = document.getElementById('inputNewPin');
  const inputConfirmPin = document.getElementById('inputConfirmPin');

  // Gallery Elements
  const galleryAdminList = document.getElementById('galleryAdminList');
  const btnNewGalleryItem = document.getElementById('btnNewGalleryItem');
  const itemModal = document.getElementById('itemModal');
  const itemModalTitle = document.getElementById('itemModalTitle');
  const btnItemModalClose = document.getElementById('btnItemModalClose');
  const btnItemCancel = document.getElementById('btnItemCancel');
  const itemForm = document.getElementById('itemForm');
  const itemEditId = document.getElementById('itemEditId');
  const itemTitle = document.getElementById('itemTitle');
  const itemSubtitle = document.getElementById('itemSubtitle');
  const itemCategory = document.getElementById('itemCategory');
  const itemCategoryName = document.getElementById('itemCategoryName');
  const itemImg = document.getElementById('itemImg');
  const itemLink = document.getElementById('itemLink');
  const itemBadgeText = document.getElementById('itemBadgeText');
  const itemBadgeIcon = document.getElementById('itemBadgeIcon');
  const itemIsReel = document.getElementById('itemIsReel');
  const itemSpan = document.getElementById('itemSpan');

  // --- NOTIFICACIONES TOAST ---
  const showToast = (message, isError = false) => {
    if (adminToastMsg) adminToastMsg.textContent = message;
    if (adminToast) {
      adminToast.style.background = isError ? 'var(--admin-danger)' : 'var(--admin-dark)';
      adminToast.classList.add('show');
      setTimeout(() => {
        adminToast.classList.remove('show');
      }, 4000);
    }
  };

  // --- AUTENTICACIÓN / SESIÓN ---
  // --- BLINDAJE DE SEGURIDAD: RATE LIMITING & ANTI-FUERZA BRUTA ---
  const LOCKOUT_STORAGE_KEY = 'fag_sec_lockout_v1';
  const loginLockoutBanner = document.getElementById('loginLockoutBanner');
  const lockoutTimerMsg = document.getElementById('lockoutTimerMsg');
  const loginAttemptsWarn = document.getElementById('loginAttemptsWarn');
  const btnLoginSubmit = document.getElementById('btnLoginSubmit');
  let lockoutInterval = null;

  const getLockoutState = () => {
    try {
      const stored = localStorage.getItem(LOCKOUT_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { attempts: 0, lockedUntil: 0 };
  };

  const saveLockoutState = (state) => {
    try {
      localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("FagAdmin: Error al guardar estado de seguridad", e);
    }
  };

  const resetLockout = () => {
    if (lockoutInterval) {
      clearInterval(lockoutInterval);
      lockoutInterval = null;
    }
    localStorage.removeItem(LOCKOUT_STORAGE_KEY);
    if (loginLockoutBanner) loginLockoutBanner.style.display = 'none';
    if (loginAttemptsWarn) {
      loginAttemptsWarn.style.display = 'none';
      loginAttemptsWarn.textContent = '';
    }
    if (pinInput) pinInput.disabled = false;
    if (btnLoginSubmit) btnLoginSubmit.disabled = false;
  };

  const checkLockoutStatus = () => {
    const state = getLockoutState();
    const now = Date.now();

    if (state.lockedUntil && state.lockedUntil > now) {
      // Usuario temporalmente bloqueado
      if (pinInput) pinInput.disabled = true;
      if (btnLoginSubmit) btnLoginSubmit.disabled = true;
      if (loginLockoutBanner) loginLockoutBanner.style.display = 'flex';
      if (loginAttemptsWarn) loginAttemptsWarn.style.display = 'none';

      const updateTimer = () => {
        const remainingMs = state.lockedUntil - Date.now();
        if (remainingMs <= 0) {
          resetLockout();
          showToast("Bloqueo de seguridad finalizado. Podés volver a intentar.");
          if (pinInput) pinInput.focus();
        } else {
          const totalSec = Math.ceil(remainingMs / 1000);
          const mins = Math.floor(totalSec / 60);
          const secs = totalSec % 60;
          const fmt = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}s`;
          if (lockoutTimerMsg) {
            lockoutTimerMsg.textContent = `Demasiados intentos fallidos. Reintentá en ${fmt}`;
          }
        }
      };

      updateTimer();
      if (!lockoutInterval) {
        lockoutInterval = setInterval(updateTimer, 1000);
      }
      return true;
    } else {
      // No está bloqueado
      if (lockoutInterval) {
        clearInterval(lockoutInterval);
        lockoutInterval = null;
      }
      if (loginLockoutBanner) loginLockoutBanner.style.display = 'none';
      if (pinInput) pinInput.disabled = false;
      if (btnLoginSubmit) btnLoginSubmit.disabled = false;

      // Advertencia preventiva si tiene al menos 2 intentos fallidos
      if (state.attempts >= 2) {
        if (loginAttemptsWarn) {
          loginAttemptsWarn.style.display = 'block';
          loginAttemptsWarn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>Atención:</strong> ${state.attempts} intentos fallidos detectados. Al 3er intento se bloqueará temporalmente el acceso.`;
        }
      } else {
        if (loginAttemptsWarn) loginAttemptsWarn.style.display = 'none';
      }
      return false;
    }
  };

  const recordFailedAttempt = () => {
    const state = getLockoutState();
    state.attempts = (state.attempts || 0) + 1;

    // Escalonamiento de bloqueo anti fuerza bruta:
    // 3 intentos -> 30s
    // 5 intentos -> 2 minutos
    // 8+ intentos -> 15 minutos
    let lockSeconds = 0;
    if (state.attempts >= 8) {
      lockSeconds = 15 * 60;
    } else if (state.attempts >= 5) {
      lockSeconds = 2 * 60;
    } else if (state.attempts >= 3) {
      lockSeconds = 30;
    }

    if (lockSeconds > 0) {
      state.lockedUntil = Date.now() + (lockSeconds * 1000);
    }

    saveLockoutState(state);
    checkLockoutStatus();
  };

  // --- CIERRE DE SESIÓN AUTOMÁTICO POR INACTIVIDAD (20 MINUTOS) ---
  const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000;
  let inactivityTimer = null;

  const resetInactivityTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (store.isAuthenticated()) {
      inactivityTimer = setTimeout(() => {
        store.logout();
        checkAuth();
        showToast("Sesión cerrada automáticamente por inactividad de 20 min.", true);
      }, INACTIVITY_TIMEOUT_MS);
    }
  };

  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });

  // --- AUTENTICACIÓN / SESIÓN ---
  const checkAuth = () => {
    if (store.isAuthenticated()) {
      loginScreen.style.display = 'none';
      adminDashboard.style.display = 'flex';
      populateAllFields();
      renderGalleryAdmin();
      updateCloudStatus();
      resetInactivityTimer();
    } else {
      loginScreen.style.display = 'flex';
      adminDashboard.style.display = 'none';
      checkLockoutStatus();
    }
  };

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (checkLockoutStatus()) {
        showToast("Acceso bloqueado por reiterados intentos fallidos.", true);
        return;
      }

      const pin = pinInput.value;
      if (!pin) return;

      if (btnLoginSubmit) btnLoginSubmit.disabled = true;

      try {
        const success = await store.login(pin);
        if (success) {
          resetLockout();
          pinInput.value = '';
          checkAuth();
          showToast("¡Bienvenido al Panel de Control de FAG Eventos!");
        } else {
          recordFailedAttempt();
          const loginCard = document.querySelector('.login-card');
          if (loginCard) {
            loginCard.classList.remove('shake');
            void loginCard.offsetWidth; // trigger reflow
            loginCard.classList.add('shake');
          }
          showToast("PIN incorrecto. Acceso denegado.", true);
          pinInput.focus();
          pinInput.select();
        }
      } catch (err) {
        showToast("Error de autenticación: " + err.message, true);
      } finally {
        if (!checkLockoutStatus() && btnLoginSubmit) {
          btnLoginSubmit.disabled = false;
        }
      }
    });
  }

  // Toggle visibilidad del PIN
  const btnTogglePin = document.getElementById('btnTogglePin');
  const togglePinIcon = document.getElementById('togglePinIcon');
  if (btnTogglePin && pinInput) {
    btnTogglePin.addEventListener('click', () => {
      const isPassword = pinInput.type === 'password';
      pinInput.type = isPassword ? 'text' : 'password';
      if (togglePinIcon) {
        togglePinIcon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
      }
      btnTogglePin.setAttribute('title', isPassword ? 'Ocultar contraseña' : 'Ver contraseña');
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      store.logout();
      checkAuth();
      showToast("Sesión cerrada.");
    });
  }

  // --- CAMBIO DE PESTAÑAS (TABS) ---
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(targetTab);
      if (panel) panel.classList.add('active');
    });
  });

  // --- POBLAR FORMULARIOS CON DATOS ACTUALES ---
  const populateAllFields = () => {
    const d = store.getData();

    // Contacto
    if (d.contact) {
      if (inputWhatsapp) inputWhatsapp.value = d.contact.whatsapp || '';
      if (inputWhatsappDisplay) inputWhatsappDisplay.value = d.contact.whatsappDisplay || '';
      if (inputWhatsappMsg) inputWhatsappMsg.value = d.contact.whatsappMessage || '';
      if (inputEmail) inputEmail.value = d.contact.email || '';
      if (inputInstagram) inputInstagram.value = d.contact.instagram || '';
      if (inputInstagramFer) inputInstagramFer.value = d.contact.instagramFer || '';
      if (inputInstagramFede) inputInstagramFede.value = d.contact.instagramFede || '';
    }

    // Hero
    if (d.hero) {
      if (inputHero1) inputHero1.value = d.hero.titleLine1 || '';
      if (inputHero2) inputHero2.value = d.hero.titleLine2 || '';
      updateHeroPreview();
    }

    // Estadísticas
    if (d.stats) {
      const s1 = d.stats.stat1;
      const s2 = d.stats.stat2;
      const s3 = d.stats.stat3;

      if (s1) {
        if (stat1Target) stat1Target.value = s1.target;
        if (stat1Prefix) stat1Prefix.value = s1.prefix || '';
        if (stat1Label1) stat1Label1.value = s1.label1 || '';
        if (stat1Label2) stat1Label2.value = s1.label2 || '';
      }
      if (s2) {
        if (stat2Target) stat2Target.value = s2.target;
        if (stat2Prefix) stat2Prefix.value = s2.prefix || '';
        if (stat2Label1) stat2Label1.value = s2.label1 || '';
        if (stat2Label2) stat2Label2.value = s2.label2 || '';
      }
      if (s3) {
        if (stat3Target) stat3Target.value = s3.target;
        if (stat3Suffix) stat3Suffix.value = s3.suffix || '';
        if (stat3Label1) stat3Label1.value = s3.label1 || '';
        if (stat3Label2) stat3Label2.value = s3.label2 || '';
      }
    }

    // Cloud
    if (d.cloudConfig) {
      if (inputSupabaseUrl) inputSupabaseUrl.value = d.cloudConfig.supabaseUrl || '';
      if (inputSupabaseKey) inputSupabaseKey.value = d.cloudConfig.supabaseKey || '';
    }
  };

  // --- VISTA PREVIA EN VIVO DEL HERO ---
  const updateHeroPreview = () => {
    const prevLine1 = document.getElementById('prevLine1');
    const prevLine2 = document.getElementById('prevLine2');
    if (prevLine1 && inputHero1) prevLine1.textContent = inputHero1.value.trim() || 'Grandes Convocatorias.';
    if (prevLine2 && inputHero2) prevLine2.textContent = inputHero2.value.trim() || 'Espectáculos de Nivel Mundial.';
  };

  if (inputHero1) inputHero1.addEventListener('input', updateHeroPreview);
  if (inputHero2) inputHero2.addEventListener('input', updateHeroPreview);

  // --- GUARDAR CONTACTO ---
  const saveContactData = () => {
    const current = store.getData();
    current.contact = {
      whatsapp: inputWhatsapp.value.trim().replace(/[^0-9]/g, ''),
      whatsappDisplay: inputWhatsappDisplay.value.trim(),
      whatsappMessage: inputWhatsappMsg.value.trim(),
      email: inputEmail.value.trim(),
      instagram: inputInstagram.value.trim(),
      instagramDisplay: "@fag.eventos",
      instagramFer: inputInstagramFer.value.trim(),
      instagramFede: inputInstagramFede.value.trim()
    };
    store.saveData(current);
    showToast("¡Contacto guardado! Sincronizado en vivo con el Sitio Web.");
  };

  // --- GUARDAR ESTADÍSTICAS & TITULARES ---
  const saveStatsData = () => {
    const current = store.getData();
    current.hero = {
      ...current.hero,
      titleLine1: inputHero1.value.trim(),
      titleLine2: inputHero2.value.trim()
    };
    current.stats = {
      stat1: {
        target: parseInt(stat1Target.value, 10) || 30,
        prefix: stat1Prefix.value.trim(),
        suffix: "",
        label1: stat1Label1.value.trim(),
        label2: stat1Label2.value.trim()
      },
      stat2: {
        target: parseInt(stat2Target.value, 10) || 10,
        prefix: stat2Prefix.value.trim(),
        suffix: "",
        label1: stat2Label1.value.trim(),
        label2: stat2Label2.value.trim()
      },
      stat3: {
        target: parseInt(stat3Target.value, 10) || 100,
        prefix: "",
        suffix: stat3Suffix.value.trim(),
        label1: stat3Label1.value.trim(),
        label2: stat3Label2.value.trim()
      }
    };
    store.saveData(current);
    showToast("¡Cifras y Portada guardadas! Vinculadas con el Inicio.");
  };

  // Listeners de botones de guardado
  document.querySelectorAll('.btn-save-section').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.getAttribute('data-section');
      if (section === 'contact') saveContactData();
      if (section === 'stats') saveStatsData();
    });
  });

  if (btnHeaderSave) {
    btnHeaderSave.addEventListener('click', () => {
      saveContactData();
      saveStatsData();
      showToast("¡Todos los cambios guardados y vinculados con el Inicio!");
    });
  }

  // Probar WhatsApp
  if (btnTestWa) {
    btnTestWa.addEventListener('click', () => {
      const phone = inputWhatsapp.value.trim().replace(/[^0-9]/g, '');
      const msg = encodeURIComponent(inputWhatsappMsg.value.trim());
      if (!phone) {
        showToast("Por favor ingresá un número primero.", true);
        return;
      }
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    });
  }

  // --- GESTIÓN DE GALERÍA & REELS ---
  const renderGalleryAdmin = () => {
    if (!galleryAdminList) return;
    const d = store.getData();
    const items = d.gallery || [];

    if (items.length === 0) {
      galleryAdminList.innerHTML = `<p style="color: var(--admin-muted); padding: 24px; text-align: center; grid-column: 1 / -1;">No hay elementos en la galería. Creá el primero con el botón superior.</p>`;
      return;
    }

    const spanLabels = {
      'mural-hero': 'Hero 5x3',
      'mural-wide': 'Panorámico 4x2',
      'mural-tall': 'Vertical 3x3',
      'mural-standard': 'Estándar 3x2'
    };

    galleryAdminList.innerHTML = items.map((item, index) => `
      <div class="gallery-admin-card" data-id="${item.id}">
        <div class="admin-card-thumb-wrap">
          <img src="${item.img}" alt="${item.title}" class="admin-card-thumb" onerror="this.src='assets/fag-logo.png'">
          <span class="admin-card-badge"><i class="fa-solid ${item.badgeIcon || 'fa-camera'}"></i> ${item.badgeText || 'Evento'}</span>
          ${item.isReel ? '<span class="admin-card-reel-tag"><i class="fa-solid fa-play"></i> Reel</span>' : ''}
        </div>
        <div class="admin-card-body">
          <h4 class="admin-card-title">${item.title}</h4>
          <span class="admin-card-sub">${item.subtitle}</span>
          <div class="admin-card-meta">
            <span><i class="fa-solid fa-tag"></i> ${item.categoryName || item.category}</span>
            <span><i class="fa-solid fa-shapes"></i> ${spanLabels[item.span] || 'Estándar 3x2'}</span>
          </div>
          <div class="admin-card-actions">
            <div class="actions-order-group">
              <button type="button" class="btn-mini-action btn-move-up" data-index="${index}" title="Subir" ${index === 0 ? 'disabled style="opacity:0.4;"' : ''}>
                <i class="fa-solid fa-arrow-up"></i>
              </button>
              <button type="button" class="btn-mini-action btn-move-down" data-index="${index}" title="Bajar" ${index === items.length - 1 ? 'disabled style="opacity:0.4;"' : ''}>
                <i class="fa-solid fa-arrow-down"></i>
              </button>
            </div>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn-mini-action btn-edit-item" data-id="${item.id}" title="Editar">
                <i class="fa-solid fa-pen-to-square"></i> Editar
              </button>
              <button type="button" class="btn-mini-action btn-danger btn-delete-item" data-id="${item.id}" title="Eliminar">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    bindGalleryAdminActions();
  };

  const bindGalleryAdminActions = () => {
    // Editar
    document.querySelectorAll('.btn-edit-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openItemModal(id);
      });
    });

    // Eliminar
    document.querySelectorAll('.btn-delete-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm("¿Estás seguro de que deseás eliminar este trabajo de la galería?")) {
          const current = store.getData();
          current.gallery = current.gallery.filter(i => i.id !== id);
          store.saveData(current);
          renderGalleryAdmin();
          showToast("Elemento eliminado de la galería.");
        }
      });
    });

    // Mover Arriba
    document.querySelectorAll('.btn-move-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.getAttribute('data-index'), 10);
        if (index > 0) {
          const current = store.getData();
          const temp = current.gallery[index];
          current.gallery[index] = current.gallery[index - 1];
          current.gallery[index - 1] = temp;
          store.saveData(current);
          renderGalleryAdmin();
        }
      });
    });

    // Mover Abajo
    document.querySelectorAll('.btn-move-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.getAttribute('data-index'), 10);
        const current = store.getData();
        if (index < current.gallery.length - 1) {
          const temp = current.gallery[index];
          current.gallery[index] = current.gallery[index + 1];
          current.gallery[index + 1] = temp;
          store.saveData(current);
          renderGalleryAdmin();
        }
      });
    });
  };

  // Abrir modal de nuevo/editar item
  const openItemModal = (id = null) => {
    if (id) {
      const d = store.getData();
      const item = d.gallery.find(i => i.id === id);
      if (!item) return;

      itemModalTitle.textContent = "Editar Trabajo / Reel";
      itemEditId.value = item.id;
      itemTitle.value = item.title || '';
      itemSubtitle.value = item.subtitle || '';
      itemCategory.value = item.category || 'festivales';
      itemCategoryName.value = item.categoryName || '';
      itemImg.value = item.img || '';
      itemLink.value = item.link || '';
      itemBadgeText.value = item.badgeText || '';
      itemBadgeIcon.value = item.badgeIcon || 'fa-camera';
      itemIsReel.checked = Boolean(item.isReel);
      if (itemSpan) itemSpan.value = item.span || 'mural-standard';
    } else {
      itemModalTitle.textContent = "Nuevo Trabajo / Reel";
      itemEditId.value = '';
      itemForm.reset();
      itemCategory.value = 'festivales';
      itemBadgeIcon.value = 'fa-camera';
      itemIsReel.checked = false;
      if (itemSpan) itemSpan.value = 'mural-standard';
    }

    itemModal.classList.add('active');
  };

  const closeItemModal = () => {
    itemModal.classList.remove('active');
  };

  if (btnNewGalleryItem) btnNewGalleryItem.addEventListener('click', () => openItemModal());
  if (btnItemModalClose) btnItemModalClose.addEventListener('click', closeItemModal);
  if (btnItemCancel) btnItemCancel.addEventListener('click', closeItemModal);

  if (itemForm) {
    itemForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const current = store.getData();
      const isEditing = Boolean(itemEditId.value);
      const id = isEditing ? itemEditId.value : `item-${Date.now()}`;

      // Nombre amigable para la categoría seleccionada
      const categoryOptions = {
        'festivales': 'Festivales & Fiestas',
        'tecnica': 'Montaje & Técnica',
        'gastronomia': 'Gastronomía & BTL',
        'videos': 'Videos & Reels',
        'festivales tecnica': 'Festivales & Montaje',
        'festivales gastronomia': 'Fiestas & Gastronomía',
        'festivales gastronomia videos': 'Festivales & Experiencias',
        'festivales videos': 'Festivales & Videos'
      };

      const newItem = {
        id,
        title: itemTitle.value.trim(),
        subtitle: itemSubtitle.value.trim(),
        category: itemCategory.value,
        categoryName: itemCategoryName.value.trim() || categoryOptions[itemCategory.value] || 'Evento',
        img: itemImg.value.trim(),
        link: itemLink.value.trim(),
        badgeText: itemBadgeText.value.trim() || 'Evento',
        badgeIcon: itemBadgeIcon.value,
        isReel: itemIsReel.checked,
        span: (itemSpan && itemSpan.value) || 'mural-standard'
      };

      if (isEditing) {
        const idx = current.gallery.findIndex(i => i.id === id);
        if (idx !== -1) current.gallery[idx] = newItem;
      } else {
        current.gallery.unshift(newItem); // Colocar al principio
      }

      store.saveData(current);
      closeItemModal();
      renderGalleryAdmin();
      showToast(isEditing ? "Trabajo actualizado." : "Nuevo trabajo agregado a la galería.");
    });
  }

  // --- SINCRONIZACIÓN EN LA NUBE (NEON / VERCEL & SUPABASE) ---
  const updateCloudStatus = () => {
    if (!cloudStatusBox) return;
    const isConfigured = store.isCloudConfigured();
    const cfg = store.getData().cloudConfig || {};
    const lastSync = cfg.lastSynced;

    if (isConfigured) {
      cloudStatusBox.className = "cloud-status-box connected";
      const isNeon = cfg.provider === 'neon' || !cfg.supabaseUrl;
      cloudStatusTitle.textContent = isNeon ? "Base de Datos Neon (Vercel) Vinculada" : "Base de Datos Supabase Conectada";
      const syncDate = lastSync ? new Date(lastSync).toLocaleString('es-AR') : 'Listo para sincronizar';
      cloudStatusDesc.textContent = isNeon
        ? `Sincronización Serverless activa vía /api/data. Última sincronización: ${syncDate}`
        : `Los cambios se guardan globalmente. Última sincronización: ${syncDate}`;
    } else {
      cloudStatusBox.className = "cloud-status-box local";
      cloudStatusTitle.textContent = "Modo Local Activo";
      cloudStatusDesc.textContent = "Los datos se guardan en el navegador. Conectá Neon en Vercel para publicar cambios globalmente.";
    }
  };

  if (btnSaveCloudConfig) {
    btnSaveCloudConfig.addEventListener('click', async () => {
      const url = inputSupabaseUrl ? inputSupabaseUrl.value.trim() : '';
      const key = inputSupabaseKey ? inputSupabaseKey.value.trim() : '';

      const current = store.getData();
      current.cloudConfig.supabaseUrl = url;
      current.cloudConfig.supabaseKey = key;
      current.cloudConfig.provider = url ? 'supabase' : 'neon';
      await store.saveData(current, false);
      updateCloudStatus();
      showToast("Configuración de base de datos actualizada.");
    });
  }

  if (btnTestCloud) {
    btnTestCloud.addEventListener('click', async () => {
      const url = inputSupabaseUrl ? inputSupabaseUrl.value.trim() : '';
      const key = inputSupabaseKey ? inputSupabaseKey.value.trim() : '';
      try {
        btnTestCloud.disabled = true;
        btnTestCloud.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Probando...';
        const res = await store.testCloudConnection(url, key);
        const name = res.provider === 'neon' ? 'Neon en Vercel' : 'Supabase';
        showToast(`¡Conexión a ${name} exitosa!`);
        updateCloudStatus();
      } catch (err) {
        showToast(`Fallo de conexión: ${err.message}`, true);
      } finally {
        btnTestCloud.disabled = false;
        btnTestCloud.innerHTML = '<i class="fa-solid fa-vial"></i> Probar Conexión';
      }
    });
  }

  if (btnPushCloud) {
    btnPushCloud.addEventListener('click', async () => {
      try {
        btnPushCloud.disabled = true;
        btnPushCloud.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...';
        const res = await store.pushToCloud();
        if (res && res.success) {
          const prov = res.provider === 'neon' ? 'Neon (Vercel)' : 'Supabase';
          showToast(`¡Datos subidos a ${prov}! Ya son visibles para cualquier dispositivo.`);
          updateCloudStatus();
        } else {
          showToast("No se pudo subir a la nube. Si estás en local, desplegá en Vercel.", true);
        }
      } catch (err) {
        showToast(`Error al subir: ${err.message}`, true);
      } finally {
        btnPushCloud.disabled = false;
        btnPushCloud.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Subir Datos a la Nube';
      }
    });
  }

  if (btnPullCloud) {
    btnPullCloud.addEventListener('click', async () => {
      try {
        btnPullCloud.disabled = true;
        btnPullCloud.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Descargando...';
        const cloudData = await store.fetchFromCloud();
        if (cloudData) {
          populateAllFields();
          renderGalleryAdmin();
          updateCloudStatus();
          showToast("¡Datos descargados desde la nube con éxito!");
        } else {
          showToast("No se encontraron datos en la nube o aún no se han subido.", true);
        }
      } catch (err) {
        showToast(`Error al descargar: ${err.message}`, true);
      } finally {
        btnPullCloud.disabled = false;
        btnPullCloud.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Descargar Datos de la Nube';
      }
    });
  }

  if (btnSyncNow) {
    btnSyncNow.addEventListener('click', async () => {
      btnSyncNow.disabled = true;
      btnSyncNow.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando...';
      try {
        const res = await store.pushToCloud();
        if (res && res.success) {
          showToast("Sincronización global completada con éxito.");
          updateCloudStatus();
        } else {
          showToast("No se pudo sincronizar con la nube.", true);
        }
      } catch (err) {
        showToast(`Error al sincronizar: ${err.message}`, true);
      } finally {
        btnSyncNow.disabled = false;
        btnSyncNow.innerHTML = '<i class="fa-solid fa-rotate"></i> Sincronizar Ahora';
      }
    });
  }

  // Copiar SQL
  if (btnCopySql) {
    btnCopySql.addEventListener('click', () => {
      const code = document.getElementById('sqlCode')?.textContent;
      if (code) {
        navigator.clipboard.writeText(code).then(() => {
          btnCopySql.innerHTML = '<i class="fa-solid fa-check"></i> ¡Copiado!';
          setTimeout(() => {
            btnCopySql.innerHTML = '<i class="fa-solid fa-copy"></i> Copiar SQL';
          }, 2500);
        });
      }
    });
  }

  // Exportar / Importar JSON
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      store.exportBackup();
      showToast("Descarga de copia de seguridad iniciada.");
    });
  }

  if (fileImportJson) {
    fileImportJson.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          await store.importBackup(event.target.result);
          populateAllFields();
          renderGalleryAdmin();
          showToast("Copia de seguridad restaurada con éxito.");
        } catch (err) {
          showToast(`Error al restaurar: ${err.message}`, true);
        }
      };
      reader.readAsText(file);
    });
  }

  if (btnResetDefaults) {
    btnResetDefaults.addEventListener('click', () => {
      if (confirm("¿Estás seguro de que deseás restaurar todos los datos a sus valores originales de fábrica? Se borrarán los cambios locales.")) {
        store.resetToDefaults();
        populateAllFields();
        renderGalleryAdmin();
        updateCloudStatus();
        showToast("Valores de fábrica restaurados.");
      }
    });
  }

  // --- CAMBIO DE PIN DE SEGURIDAD ---
  if (formChangePin) {
    formChangePin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const current = inputCurrentPin.value;
      const newPin = inputNewPin.value;
      const confirmPin = inputConfirmPin.value;

      const isValid = await store.verifyPin(current);
      if (!isValid) {
        showToast("El PIN actual no es correcto.", true);
        inputCurrentPin.focus();
        return;
      }

      if (newPin !== confirmPin) {
        showToast("Los nuevos PIN no coinciden.", true);
        inputConfirmPin.focus();
        return;
      }

      try {
        await store.setMasterPin(newPin);
        formChangePin.reset();
        showToast("¡PIN maestro actualizado exitosamente con cifrado SHA-256!");
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }

  // Comprobar estado al cargar la página
  checkAuth();
});
