/**
 * FAG EVENTOS - LÓGICA DEL PANEL DE ADMINISTRACIÓN (ADMIN JS)
 * Autenticación centralizada en el servidor, validación estricta y sin credenciales en el cliente.
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
  const btnTogglePin = document.getElementById('btnTogglePin');
  const togglePinIcon = document.getElementById('togglePinIcon');
  const loginLockoutBanner = document.getElementById('loginLockoutBanner');
  const lockoutTimerMsg = document.getElementById('lockoutTimerMsg');
  const btnLoginSubmit = document.getElementById('btnLoginSubmit');
  const btnLogout = document.getElementById('btnLogout');
  const btnPublish = document.getElementById('btnPublish');
  const publishStatus = document.getElementById('publishStatus');
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

  // Backup & Reset Buttons
  const btnExportJson = document.getElementById('btnExportJson');
  const fileImportJson = document.getElementById('fileImportJson');
  const btnResetDefaults = document.getElementById('btnResetDefaults');

  // Change Password Form
  const formChangePassword = document.getElementById('formChangePassword');
  const inputCurrentPassword = document.getElementById('inputCurrentPassword');
  const inputNewPassword = document.getElementById('inputNewPassword');
  const inputConfirmPassword = document.getElementById('inputConfirmPassword');
  const btnSubmitPassword = document.getElementById('btnSubmitPassword');

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
  const itemLink = document.getElementById('itemLink');
  const itemImgData = document.getElementById('itemImgData');
  const itemFileInput = document.getElementById('itemFileInput');
  const imageUploadDropzone = document.getElementById('imageUploadDropzone');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const imagePreview = document.getElementById('imagePreview');
  const imageUploadPrompt = document.getElementById('imageUploadPrompt');
  const btnChangeImage = document.getElementById('btnChangeImage');

  let hasUnsavedChanges = false;
  let lockoutInterval = null;

  // --- NOTIFICACIONES TOAST ---
  const showToast = (message, isError = false) => {
    if (adminToastMsg) adminToastMsg.textContent = message;
    if (adminToast) {
      adminToast.classList.toggle('toast-danger', isError);
      adminToast.classList.add('show');
      setTimeout(() => {
        adminToast.classList.remove('show');
      }, 4000);
    }
  };

  const setUnsavedChanges = (dirty) => {
    hasUnsavedChanges = dirty;
    if (!publishStatus) return;
    if (dirty) {
      publishStatus.classList.remove('is-hidden');
      publishStatus.className = 'publish-status status-dirty';
      const label = publishStatus.querySelector('.status-label');
      if (label) label.textContent = 'Cambios sin publicar';
    } else {
      publishStatus.classList.add('is-hidden');
    }
  };

  // Advertir antes de salir con cambios sin publicar
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  const showLoginScreen = () => {
    if (loginScreen) loginScreen.classList.remove('is-hidden');
    if (adminDashboard) adminDashboard.classList.add('is-hidden');
  };

  const showDashboard = () => {
    if (loginScreen) loginScreen.classList.add('is-hidden');
    if (adminDashboard) adminDashboard.classList.remove('is-hidden');
  };

  // --- MANEJO DE BLOQUEO POR RATE LIMITING (SERVIDOR) ---
  const handleLockout = (retryAfterSeconds) => {
    if (lockoutInterval) clearInterval(lockoutInterval);
    let remaining = Math.max(1, Math.ceil(retryAfterSeconds));

    if (loginLockoutBanner) loginLockoutBanner.classList.remove('is-hidden');
    if (pinInput) pinInput.disabled = true;
    if (btnLoginSubmit) btnLoginSubmit.disabled = true;

    const updateTimer = () => {
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      const fmt = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}s`;
      if (lockoutTimerMsg) {
        lockoutTimerMsg.textContent = `Demasiados intentos fallidos. Reintentá en ${fmt}`;
      }
      if (remaining <= 0) {
        clearInterval(lockoutInterval);
        lockoutInterval = null;
        if (loginLockoutBanner) loginLockoutBanner.classList.add('is-hidden');
        if (pinInput) {
          pinInput.disabled = false;
          pinInput.focus();
        }
        if (btnLoginSubmit) btnLoginSubmit.disabled = false;
        showToast("Podés intentar ingresar nuevamente.");
      }
      remaining--;
    };

    updateTimer();
    lockoutInterval = setInterval(updateTimer, 1000);
  };

  // --- CIERRE DE SESIÓN POR INACTIVIDAD (20 MIN) ---
  const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000;
  let inactivityTimer = null;

  const performLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {}
    showLoginScreen();
    if (pinInput) {
      pinInput.value = '';
      pinInput.focus();
    }
  };

  const resetInactivityTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(async () => {
      await performLogout();
      showToast("Sesión cerrada automáticamente por inactividad (20 min).", true);
    }, INACTIVITY_TIMEOUT_MS);
  };

  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });

  // --- VERIFICACIÓN DE SESIÓN AL CARGAR ---
  const checkSession = async () => {
    try {
      const res = await fetch('/api/session', {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.authenticated) {
        // Cargar SIEMPRE datos de la nube antes de llenar formularios y renderizar
        await store.fetchFromCloud();
        showDashboard();
        populateAllFields();
        renderGalleryAdmin();
        setUnsavedChanges(false);
        resetInactivityTimer();
        return;
      }
    } catch (e) {
      console.warn("FagAdmin: Error al verificar sesión.", e);
    }

    showLoginScreen();
    if (pinInput) pinInput.focus();
  };

  checkSession();

  // --- MOSTRAR / OCULTAR CONTRASEÑA ---
  if (btnTogglePin && pinInput) {
    btnTogglePin.addEventListener('click', () => {
      const isPassword = pinInput.type === 'password';
      pinInput.type = isPassword ? 'text' : 'password';
      if (togglePinIcon) {
        togglePinIcon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
      }
    });
  }

  // --- LOGIN ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = pinInput.value;
      if (!password) return;

      if (btnLoginSubmit) btnLoginSubmit.disabled = true;

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ password })
        });

        const json = await res.json().catch(() => ({}));

        if (res.status === 200 && json.status === 'success') {
          pinInput.value = '';
          if (loginLockoutBanner) loginLockoutBanner.classList.add('is-hidden');
          await store.fetchFromCloud();
          showDashboard();
          populateAllFields();
          renderGalleryAdmin();
          setUnsavedChanges(false);
          resetInactivityTimer();
          showToast("¡Bienvenido al Panel de Control de FAG Eventos!");
        } else if (res.status === 429) {
          handleLockout(json.retryAfterSeconds || 30);
          showToast(json.error || "Acceso temporalmente bloqueado por demasiados intentos.", true);
        } else {
          // 401 Contraseña incorrecta
          const loginCard = document.querySelector('.login-card');
          if (loginCard) {
            loginCard.classList.remove('shake');
            void loginCard.offsetWidth; // Reflow
            loginCard.classList.add('shake');
          }
          showToast(json.error || "Contraseña incorrecta. Acceso denegado.", true);
          pinInput.focus();
          pinInput.select();
        }
      } catch (err) {
        showToast("Error de conexión al iniciar sesión.", true);
      } finally {
        if (!loginLockoutBanner || loginLockoutBanner.classList.contains('is-hidden')) {
          if (btnLoginSubmit) btnLoginSubmit.disabled = false;
        }
      }
    });
  }

  // --- LOGOUT (CON GUARDA DE CAMBIOS PENDIENTES) ---
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      if (hasUnsavedChanges) {
        const ok = confirm("Tenés cambios pendientes sin publicar. Si cerrás sesión ahora, se perderán.\n\n¿Estás seguro de que deseás salir?");
        if (!ok) return;
      }
      await performLogout();
      showToast("Sesión cerrada correctamente.");
    });
  }

  // --- ENLACES EXTERNOS / VER WEB (CON GUARDA) ---
  document.querySelectorAll('a[href="index.html"]').forEach(link => {
    link.addEventListener('click', (e) => {
      if (hasUnsavedChanges) {
        const ok = confirm("Tenés cambios pendientes sin publicar.\n\n¿Deseás salir a la web pública y descartar los cambios no publicados?");
        if (!ok) {
          e.preventDefault();
        }
      }
    });
  });

  // --- CAMBIO DE PESTAÑAS (TABS CON GUARDA DE CAMBIOS PENDIENTES) ---
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (hasUnsavedChanges) {
        const ok = confirm("Tenés cambios pendientes sin publicar en esta sección.\n\n¿Deseás descartar los cambios y cambiar de pestaña?");
        if (!ok) return;
        // Revertir cambios en memoria al estado del store
        populateAllFields();
        renderGalleryAdmin();
        setUnsavedChanges(false);
      }
      const targetId = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // --- LLENAR CAMPOS DESDE STORE ---
  function populateAllFields() {
    const d = store.getData();
    if (!d) return;

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
    }

    // Estadísticas
    if (d.stats) {
      if (d.stats.stat1) {
        if (stat1Target) stat1Target.value = d.stats.stat1.target ?? 30;
        if (stat1Prefix) stat1Prefix.value = d.stats.stat1.prefix || '';
        if (stat1Label1) stat1Label1.value = d.stats.stat1.label1 || '';
        if (stat1Label2) stat1Label2.value = d.stats.stat1.label2 || '';
      }
      if (d.stats.stat2) {
        if (stat2Target) stat2Target.value = d.stats.stat2.target ?? 10;
        if (stat2Prefix) stat2Prefix.value = d.stats.stat2.prefix || '';
        if (stat2Label1) stat2Label1.value = d.stats.stat2.label1 || '';
        if (stat2Label2) stat2Label2.value = d.stats.stat2.label2 || '';
      }
      if (d.stats.stat3) {
        if (stat3Target) stat3Target.value = d.stats.stat3.target ?? 100;
        if (stat3Suffix) stat3Suffix.value = d.stats.stat3.suffix || '';
        if (stat3Label1) stat3Label1.value = d.stats.stat3.label1 || '';
        if (stat3Label2) stat3Label2.value = d.stats.stat3.label2 || '';
      }
    }
  }

  // --- FUNCIONES DE GUARDADO DE SECCIONES EN MEMORIA ---
  const commitContactSection = (showFeedback = true) => {
    const rawPhone = inputWhatsapp ? inputWhatsapp.value.trim() : '';
    const digitsPhone = store.onlyDigits(rawPhone);
    if (digitsPhone.length < 8 || digitsPhone.length > 15) {
      if (showFeedback) showToast("El teléfono debe contener entre 8 y 15 dígitos.", true);
      return false;
    }

    const email = inputEmail ? inputEmail.value.trim() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      if (showFeedback) showToast("Ingresá un correo electrónico válido.", true);
      return false;
    }

    const igOfficial = inputInstagram ? inputInstagram.value.trim() : '';
    const igFer = inputInstagramFer ? inputInstagramFer.value.trim() : '';
    const igFede = inputInstagramFede ? inputInstagramFede.value.trim() : '';

    const checkIg = (u) => {
      try {
        const p = new URL(u);
        return p.protocol === 'https:' && (p.hostname === 'instagram.com' || p.hostname === 'www.instagram.com');
      } catch {
        return false;
      }
    };

    if (igOfficial && !checkIg(igOfficial)) {
      if (showFeedback) showToast("La URL de Instagram Oficial debe ser HTTPS de instagram.com.", true);
      return false;
    }
    if (igFer && !checkIg(igFer)) {
      if (showFeedback) showToast("La URL de Instagram de Fernando debe ser HTTPS de instagram.com.", true);
      return false;
    }
    if (igFede && !checkIg(igFede)) {
      if (showFeedback) showToast("La URL de Instagram de Federico debe ser HTTPS de instagram.com.", true);
      return false;
    }

    const current = store.getData();
    current.contact = {
      whatsapp: digitsPhone,
      whatsappDisplay: inputWhatsappDisplay ? inputWhatsappDisplay.value.trim().slice(0, 30) : '',
      whatsappMessage: inputWhatsappMsg ? inputWhatsappMsg.value.trim().slice(0, 300) : '',
      email: email.slice(0, 120),
      instagram: igOfficial,
      instagramDisplay: inputInstagramDisplay ? inputInstagramDisplay.value.trim().slice(0, 40) : '@fag.eventos',
      instagramFer: igFer,
      instagramFede: igFede
    };

    store.saveData(current);
    setUnsavedChanges(true);
    if (showFeedback) showToast("Contacto guardado en memoria. Recordá 'Publicar'.");
    return true;
  };

  const commitStatsSection = (showFeedback = true) => {
    const line1 = inputHero1 ? inputHero1.value.trim().slice(0, 80) : '';
    const line2 = inputHero2 ? inputHero2.value.trim().slice(0, 80) : '';
    if (line1.includes('<') || line1.includes('>') || line2.includes('<') || line2.includes('>')) {
      if (showFeedback) showToast("Los títulos no pueden contener caracteres < o >.", true);
      return false;
    }

    const current = store.getData();
    current.hero = {
      titleLine1: line1 || 'Grandes Convocatorias.',
      titleLine2: line2 || 'Espectáculos de Nivel Mundial.',
      pill1: current.hero?.pill1 || 'Financiamiento Propio',
      pill2: current.hero?.pill2 || 'Internacional'
    };

    const t1 = parseInt(stat1Target ? stat1Target.value : '30', 10);
    const t2 = parseInt(stat2Target ? stat2Target.value : '10', 10);
    const t3 = parseInt(stat3Target ? stat3Target.value : '100', 10);

    current.stats = {
      stat1: {
        target: isNaN(t1) ? 30 : Math.min(100000, Math.max(0, t1)),
        prefix: (stat1Prefix ? stat1Prefix.value.trim() : '+').slice(0, 3),
        suffix: '',
        label1: (stat1Label1 ? stat1Label1.value.trim() : 'Años de').slice(0, 30),
        label2: (stat1Label2 ? stat1Label2.value.trim() : 'Trayectoria').slice(0, 30)
      },
      stat2: {
        target: isNaN(t2) ? 10 : Math.min(100000, Math.max(0, t2)),
        prefix: (stat2Prefix ? stat2Prefix.value.trim() : '+').slice(0, 3),
        suffix: '',
        label1: (stat2Label1 ? stat2Label1.value.trim() : 'Países con').slice(0, 30),
        label2: (stat2Label2 ? stat2Label2.value.trim() : 'Producciones').slice(0, 30)
      },
      stat3: {
        target: isNaN(t3) ? 100 : Math.min(100000, Math.max(0, t3)),
        prefix: '',
        suffix: (stat3Suffix ? stat3Suffix.value.trim() : '%').slice(0, 3),
        label1: (stat3Label1 ? stat3Label1.value.trim() : 'Gestión Propia').slice(0, 30),
        label2: (stat3Label2 ? stat3Label2.value.trim() : '& Financiamiento').slice(0, 30)
      }
    };

    store.saveData(current);
    setUnsavedChanges(true);
    if (showFeedback) showToast("Portada y cifras guardadas en memoria. Recordá 'Publicar'.");
    return true;
  };

  // Botones de guardado de sección
  document.querySelectorAll('.btn-save-section').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.getAttribute('data-section');
      if (section === 'contact') commitContactSection(true);
      if (section === 'stats') commitStatsSection(true);
    });
  });

  // Detección automática de cambios en tiempo real
  const trackedInputs = document.querySelectorAll('#tab-contacto input, #tab-contacto textarea, #tab-estadisticas input');
  trackedInputs.forEach(input => {
    input.addEventListener('input', () => setUnsavedChanges(true));
  });

  // --- BOTÓN PROBAR WHATSAPP ---
  if (btnTestWa) {
    btnTestWa.addEventListener('click', () => {
      const rawPhone = inputWhatsapp ? inputWhatsapp.value.trim() : '';
      const phone = store.onlyDigits(rawPhone) || "5493517580045";
      const msg = encodeURIComponent(inputWhatsappMsg ? inputWhatsappMsg.value.trim() : '');
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    });
  }

  // --- PUBLICAR CAMBIOS EN EL SERVIDOR ---
  if (btnPublish) {
    btnPublish.addEventListener('click', async () => {
      if (btnPublish.disabled) return;
      btnPublish.disabled = true;

      // Auto-sincronizar formularios en memoria antes de publicar si hay campos editados
      if (inputWhatsapp && !commitContactSection(false)) {
        btnPublish.disabled = false;
        showToast("Por favor revisá los datos de contacto antes de publicar.", true);
        return;
      }
      if (inputHero1 && !commitStatsSection(false)) {
        btnPublish.disabled = false;
        showToast("Por favor revisá los datos de portada antes de publicar.", true);
        return;
      }

      if (publishStatus) {
        const label = publishStatus.querySelector('.status-label');
        if (label) label.textContent = 'Publicando...';
        else publishStatus.textContent = 'Publicando...';
        publishStatus.className = 'publish-status';
      }

      try {
        const newVersion = await store.publish();
        setUnsavedChanges(false);
        showToast(`¡Cambios publicados en vivo con éxito! (versión ${newVersion})`);
      } catch (err) {
        if (publishStatus) {
          const label = publishStatus.querySelector('.status-label');
          if (label) label.textContent = 'Error';
          else publishStatus.textContent = 'Error';
          publishStatus.className = 'publish-status status-error';
        }

        if (err.message === 'SESSION_EXPIRED') {
          showToast("Tu sesión ha expirado. Por favor ingresá nuevamente.", true);
          showLoginScreen();
        } else if (err.message === 'CONFLICT') {
          const reload = confirm("El contenido fue modificado desde otra sesión. ¿Deseas recargar la versión más reciente del servidor? (Los cambios no guardados se perderán)");
          if (reload) {
            await store.fetchFromCloud();
            populateAllFields();
            renderGalleryAdmin();
            setUnsavedChanges(false);
          }
        } else {
          showToast(err.message || "Error al publicar los datos.", true);
        }
      } finally {
        btnPublish.disabled = false;
      }
    });
  }

  // --- RENDERIZAR LISTA DE GALERÍA SIN INNERHTML ---
  function renderGalleryAdmin() {
    if (!galleryAdminList) return;

    const items = store.getData().gallery || [];
    if (items.length === 0) {
      const p = document.createElement('p');
      p.className = 'admin-gallery-empty';
      p.textContent = 'No hay elementos en la galería. Creá el primero con el botón superior.';
      galleryAdminList.replaceChildren(p);
      return;
    }

    const spanLabels = {
      'mural-hero': 'Hero 5x3',
      'mural-wide': 'Panorámico 4x2',
      'mural-tall': 'Vertical 3x3',
      'mural-standard': 'Estándar 3x2'
    };

    const fragment = document.createDocumentFragment();

    items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'gallery-admin-card';
      card.dataset.id = item.id;

      // Thumbnail
      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'admin-card-thumb-wrap';

      const img = document.createElement('img');
      const safeImgSrc = store.safeUrl(item.img, { allowRelativeAssets: true }) || 'assets/fag-logo.png';
      img.src = safeImgSrc;
      img.alt = item.title || 'Trabajo FAG';
      img.className = 'admin-card-thumb';
      img.addEventListener('error', () => {
        img.src = 'assets/fag-logo.png';
      }, { once: true });
      thumbWrap.appendChild(img);
      card.appendChild(thumbWrap);

      // Body
      const body = document.createElement('div');
      body.className = 'admin-card-body';

      const h4 = document.createElement('h4');
      h4.className = 'admin-card-title';
      h4.textContent = item.title || '';
      body.appendChild(h4);

      const sub = document.createElement('span');
      sub.className = 'admin-card-sub';
      sub.textContent = item.subtitle || '';
      body.appendChild(sub);

      const meta = document.createElement('div');
      meta.className = 'admin-card-meta';

      const spanTag = document.createElement('span');
      const iTag = document.createElement('i');
      iTag.className = 'fa-solid fa-tag';
      spanTag.appendChild(iTag);
      spanTag.appendChild(document.createTextNode(' ' + (item.categoryName || item.category || '')));
      meta.appendChild(spanTag);

      body.appendChild(meta);

      // Actions
      const actions = document.createElement('div');
      actions.className = 'admin-card-actions';

      const orderGroup = document.createElement('div');
      orderGroup.className = 'actions-order-group';

      const btnUp = document.createElement('button');
      btnUp.type = 'button';
      btnUp.className = 'btn-mini-action btn-move-up';
      btnUp.dataset.index = String(index);
      btnUp.title = 'Subir';
      if (index === 0) {
        btnUp.disabled = true;
      }
      const iUp = document.createElement('i');
      iUp.className = 'fa-solid fa-arrow-up';
      btnUp.appendChild(iUp);
      orderGroup.appendChild(btnUp);

      const btnDown = document.createElement('button');
      btnDown.type = 'button';
      btnDown.className = 'btn-mini-action btn-move-down';
      btnDown.dataset.index = String(index);
      btnDown.title = 'Bajar';
      if (index === items.length - 1) {
        btnDown.disabled = true;
      }
      const iDown = document.createElement('i');
      iDown.className = 'fa-solid fa-arrow-down';
      btnDown.appendChild(iDown);
      orderGroup.appendChild(btnDown);

      actions.appendChild(orderGroup);

      const editDeleteGroup = document.createElement('div');
      editDeleteGroup.className = 'admin-card-action-group';

      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.className = 'btn-mini-action btn-edit-item';
      btnEdit.dataset.id = item.id;
      btnEdit.title = 'Editar';
      const iEdit = document.createElement('i');
      iEdit.className = 'fa-solid fa-pen-to-square';
      btnEdit.appendChild(iEdit);
      btnEdit.appendChild(document.createTextNode(' Editar'));
      editDeleteGroup.appendChild(btnEdit);

      const btnDelete = document.createElement('button');
      btnDelete.type = 'button';
      btnDelete.className = 'btn-mini-action btn-danger-action btn-delete-item';
      btnDelete.dataset.id = item.id;
      btnDelete.title = 'Eliminar';
      const iDelete = document.createElement('i');
      iDelete.className = 'fa-solid fa-trash';
      btnDelete.appendChild(iDelete);
      editDeleteGroup.appendChild(btnDelete);

      actions.appendChild(editDeleteGroup);
      body.appendChild(actions);
      card.appendChild(body);

      fragment.appendChild(card);
    });

    galleryAdminList.replaceChildren(fragment);
  }

  // --- ACCIONES EN ELEMENTOS DE GALERÍA (EDITAR, BORRAR, REORDENAR) ---
  if (galleryAdminList) {
    galleryAdminList.addEventListener('click', (e) => {
      const btnMoveUp = e.target.closest('.btn-move-up');
      const btnMoveDown = e.target.closest('.btn-move-down');
      const btnEdit = e.target.closest('.btn-edit-item');
      const btnDelete = e.target.closest('.btn-delete-item');

      const current = store.getData();
      const gallery = current.gallery || [];

      if (btnMoveUp) {
        const idx = parseInt(btnMoveUp.dataset.index, 10);
        if (idx > 0 && idx < gallery.length) {
          const temp = gallery[idx];
          gallery[idx] = gallery[idx - 1];
          gallery[idx - 1] = temp;
          store.saveData(current);
          renderGalleryAdmin();
          setUnsavedChanges(true);
        }
        return;
      }

      if (btnMoveDown) {
        const idx = parseInt(btnMoveDown.dataset.index, 10);
        if (idx >= 0 && idx < gallery.length - 1) {
          const temp = gallery[idx];
          gallery[idx] = gallery[idx + 1];
          gallery[idx + 1] = temp;
          store.saveData(current);
          renderGalleryAdmin();
          setUnsavedChanges(true);
        }
        return;
      }

      if (btnEdit) {
        const id = btnEdit.dataset.id;
        const item = gallery.find(it => it.id === id);
        if (item) openGalleryModal(item);
        return;
      }

      if (btnDelete) {
        const id = btnDelete.dataset.id;
        if (confirm("¿Estás seguro de que deseás eliminar este elemento de la galería?")) {
          current.gallery = gallery.filter(it => it.id !== id);
          store.saveData(current);
          renderGalleryAdmin();
          setUnsavedChanges(true);
          showToast("Elemento eliminado en memoria. Recordá 'Publicar cambios'.");
        }
        return;
      }
    });
  }

  // --- PROCESAMIENTO DE IMÁGENES DESDE EL DISPOSITIVO ---
  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast("Seleccioná un archivo de imagen válido (JPG, PNG o WebP).", true);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar si supera 1600px para garantizar subida rápida y peso liviano
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a JPEG con compresión equilibrada
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        if (itemImgData) itemImgData.value = dataUrl;
        if (imagePreview) imagePreview.src = dataUrl;
        if (imagePreviewContainer) imagePreviewContainer.classList.remove('is-hidden');
        if (imageUploadPrompt) imageUploadPrompt.classList.add('is-hidden');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  if (itemFileInput) {
    itemFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) processImageFile(file);
      itemFileInput.value = '';
    });
  }

  if (imageUploadDropzone) {
    imageUploadDropzone.addEventListener('click', (e) => {
      if (btnChangeImage && (e.target === btnChangeImage || btnChangeImage.contains(e.target))) {
        return;
      }
      if (itemFileInput) itemFileInput.click();
    });

    imageUploadDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      imageUploadDropzone.classList.add('drag-over');
    });

    imageUploadDropzone.addEventListener('dragleave', () => {
      imageUploadDropzone.classList.remove('drag-over');
    });

    imageUploadDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      imageUploadDropzone.classList.remove('drag-over');
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) processImageFile(file);
    });
  }

  if (btnChangeImage) {
    btnChangeImage.addEventListener('click', (e) => {
      e.stopPropagation();
      if (itemFileInput) itemFileInput.click();
    });
  }

  // --- MODAL DE GALERÍA (AGREGAR / EDITAR SIMPLIFICADO) ---
  const openGalleryModal = (item = null) => {
    if (!itemModal) return;
    if (item) {
      if (itemModalTitle) itemModalTitle.textContent = "Editar Trabajo";
      if (itemEditId) itemEditId.value = item.id;
      if (itemTitle) itemTitle.value = item.title || '';
      if (itemSubtitle) itemSubtitle.value = item.subtitle || '';

      const allowedCats = ['festivales', 'tecnica', 'gastronomia', 'videos'];
      let matchedCat = 'festivales';
      if (item.category) {
        const parts = item.category.split(/\s+/);
        for (const p of parts) {
          if (allowedCats.includes(p)) {
            matchedCat = p;
            break;
          }
        }
      }
      if (itemCategory) itemCategory.value = matchedCat;

      if (itemLink) {
        itemLink.value = (item.link && item.link !== 'https://www.instagram.com/fag.eventos/') ? item.link : '';
      }

      if (itemImgData) itemImgData.value = item.img || '';

      if (item.img && imagePreview) {
        const safeImg = store.safeUrl(item.img, { allowRelativeAssets: true }) || item.img;
        imagePreview.src = safeImg;
        if (imagePreviewContainer) imagePreviewContainer.classList.remove('is-hidden');
        if (imageUploadPrompt) imageUploadPrompt.classList.add('is-hidden');
      } else {
        if (imagePreviewContainer) imagePreviewContainer.classList.add('is-hidden');
        if (imageUploadPrompt) imageUploadPrompt.classList.remove('is-hidden');
      }
    } else {
      if (itemModalTitle) itemModalTitle.textContent = "Agregar Nuevo Trabajo";
      if (itemForm) itemForm.reset();
      if (itemEditId) itemEditId.value = '';
      if (itemImgData) itemImgData.value = '';
      if (itemCategory) itemCategory.value = 'festivales';
      if (imagePreview) imagePreview.src = '';
      if (imagePreviewContainer) imagePreviewContainer.classList.add('is-hidden');
      if (imageUploadPrompt) imageUploadPrompt.classList.remove('is-hidden');
    }
    itemModal.classList.add('active');
    document.body.classList.add('overflow-hidden');
  };

  const closeGalleryModal = () => {
    if (itemModal) itemModal.classList.remove('active');
    document.body.classList.remove('overflow-hidden');
  };

  if (btnNewGalleryItem) {
    btnNewGalleryItem.addEventListener('click', () => openGalleryModal());
  }

  if (btnItemModalClose) btnItemModalClose.addEventListener('click', closeGalleryModal);
  if (btnItemCancel) btnItemCancel.addEventListener('click', closeGalleryModal);
  const modalBackdrop = document.getElementById('modalBackdrop');
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeGalleryModal);

  // Cerrar modal al presionar Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && itemModal && itemModal.classList.contains('active')) {
      closeGalleryModal();
    }
  });

  if (itemForm) {
    itemForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = itemTitle.value.trim();
      if (!title || title.length > 80 || title.includes('<') || title.includes('>')) {
        showToast("El título es obligatorio (máx. 80 caracteres, sin < ni >).", true);
        return;
      }

      const imgVal = itemImgData ? itemImgData.value.trim() : '';
      if (!imgVal) {
        showToast("Por favor seleccioná una foto desde tu dispositivo.", true);
        return;
      }

      let linkVal = itemLink ? itemLink.value.trim() : '';
      if (!linkVal) {
        linkVal = 'https://www.instagram.com/fag.eventos/';
      } else {
        try {
          const u = new URL(linkVal);
          if (u.protocol !== 'https:' || (!u.hostname.includes('instagram.com'))) {
            showToast("El enlace debe ser una URL HTTPS de instagram.com.", true);
            return;
          }
        } catch {
          showToast("El enlace de Instagram ingresado no es válido.", true);
          return;
        }
      }

      const catNames = {
        'festivales': 'Festivales & Fiestas',
        'tecnica': 'Montaje & Técnica',
        'gastronomia': 'Gastronomía & BTL',
        'videos': 'Videos & Cobertura'
      };
      const catVal = itemCategory ? itemCategory.value : 'festivales';
      const catName = catNames[catVal] || 'Festivales';

      const current = store.getData();
      const gallery = current.gallery || [];
      const editId = itemEditId.value;
      const existingItem = editId ? gallery.find(it => it.id === editId) : null;

      const itemPayload = {
        id: editId || `item-${Math.random().toString(36).slice(2, 10)}`,
        title,
        subtitle: (itemSubtitle.value || '').trim().slice(0, 120),
        category: catVal,
        categoryName: catName,
        img: imgVal,
        link: linkVal,
        badgeText: existingItem?.badgeText || 'Evento',
        badgeIcon: existingItem?.badgeIcon || 'fa-camera',
        isReel: Boolean(existingItem?.isReel),
        span: existingItem?.span || 'mural-standard'
      };

      if (editId) {
        const idx = gallery.findIndex(it => it.id === editId);
        if (idx !== -1) {
          gallery[idx] = itemPayload;
        } else {
          gallery.push(itemPayload);
        }
      } else {
        gallery.push(itemPayload);
      }

      current.gallery = gallery;
      store.saveData(current);
      renderGalleryAdmin();
      closeGalleryModal();
      setUnsavedChanges(true);
      showToast("Trabajo guardado en memoria. Recordá presionar 'Publicar' para subir los cambios a la web.");
    });
  }

  // --- FORMULARIO DE CAMBIO DE CONTRASEÑA ---
  if (formChangePassword) {
    const reqLength = document.getElementById('reqLength');
    const reqMatch = document.getElementById('reqMatch');

    function checkPasswordReqs() {
      const newPass = inputNewPassword ? inputNewPassword.value : '';
      const confPass = inputConfirmPassword ? inputConfirmPassword.value : '';

      if (reqLength) {
        if (newPass.length >= 12) {
          reqLength.classList.add('is-valid');
        } else {
          reqLength.classList.remove('is-valid');
        }
      }

      if (reqMatch) {
        if (newPass.length >= 12 && confPass && newPass === confPass) {
          reqMatch.classList.add('is-valid');
        } else {
          reqMatch.classList.remove('is-valid');
        }
      }
    }

    if (inputNewPassword) inputNewPassword.addEventListener('input', checkPasswordReqs);
    if (inputConfirmPassword) inputConfirmPassword.addEventListener('input', checkPasswordReqs);

    // Botones de mostrar/ocultar contraseña
    document.querySelectorAll('.btn-input-eye').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;
        const icon = btn.querySelector('i');
        if (input.type === 'password') {
          input.type = 'text';
          if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
          }
        } else {
          input.type = 'password';
          if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
          }
        }
      });
    });

    formChangePassword.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = inputCurrentPassword ? inputCurrentPassword.value : '';
      const newPassword = inputNewPassword ? inputNewPassword.value : '';
      const confirmPassword = inputConfirmPassword ? inputConfirmPassword.value : '';

      if (!currentPassword) {
        showToast("Ingresá la contraseña actual.", true);
        if (inputCurrentPassword) inputCurrentPassword.focus();
        return;
      }

      if (newPassword.length < 12) {
        showToast("La nueva contraseña debe tener al menos 12 caracteres.", true);
        if (inputNewPassword) inputNewPassword.focus();
        return;
      }

      if (newPassword !== confirmPassword) {
        showToast("Las contraseñas nuevas no coinciden.", true);
        if (inputConfirmPassword) inputConfirmPassword.focus();
        return;
      }

      if (btnSubmitPassword) {
        btnSubmitPassword.disabled = true;
        btnSubmitPassword.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualizando...';
      }

      try {
        const res = await fetch('/api/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ currentPassword, newPassword })
        });

        const json = await res.json().catch(() => ({}));

        if (res.status === 200 && json.status === 'success') {
          showToast(json.message || "Contraseña actualizada. Iniciá sesión nuevamente.");
          formChangePassword.reset();
          checkPasswordReqs();
          setTimeout(() => {
            showLoginScreen();
            if (pinInput) {
              pinInput.value = '';
              pinInput.focus();
            }
          }, 1000);
        } else {
          showToast(json.error || "No se pudo actualizar la contraseña.", true);
        }
      } catch (err) {
        showToast("Error de conexión al cambiar la contraseña.", true);
      } finally {
        if (btnSubmitPassword) {
          btnSubmitPassword.disabled = false;
          btnSubmitPassword.innerHTML = '<i class="fa-solid fa-lock"></i> <span>Actualizar Contraseña</span>';
        }
      }
    });
  }
});
