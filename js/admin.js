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
  const checkAuth = () => {
    if (store.isAuthenticated()) {
      loginScreen.style.display = 'none';
      adminDashboard.style.display = 'flex';
      populateAllFields();
      renderGalleryAdmin();
      updateCloudStatus();
    } else {
      loginScreen.style.display = 'flex';
      adminDashboard.style.display = 'none';
    }
  };

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pin = pinInput.value;
      if (store.login(pin)) {
        pinInput.value = '';
        checkAuth();
        showToast("¡Bienvenido al Panel de Control de FAG Eventos!");
      } else {
        showToast("PIN incorrecto. Intentá nuevamente.", true);
        pinInput.focus();
        pinInput.select();
      }
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
    showToast("Datos de contacto actualizados con éxito.");
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
    showToast("Métricas y titulares actualizados con éxito.");
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
      showToast("¡Todos los cambios han sido guardados correctamente!");
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
    } else {
      itemModalTitle.textContent = "Nuevo Trabajo / Reel";
      itemEditId.value = '';
      itemForm.reset();
      itemCategory.value = 'festivales';
      itemBadgeIcon.value = 'fa-camera';
      itemIsReel.checked = false;
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
        isReel: itemIsReel.checked
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

  // --- SINCRONIZACIÓN EN LA NUBE (SUPABASE) ---
  const updateCloudStatus = () => {
    if (!cloudStatusBox) return;
    const isConfigured = store.isCloudConfigured();
    const lastSync = store.getData().cloudConfig?.lastSynced;

    if (isConfigured) {
      cloudStatusBox.className = "cloud-status-box connected";
      cloudStatusTitle.textContent = "Base de Datos en la Nube Conectada";
      const syncDate = lastSync ? new Date(lastSync).toLocaleString('es-AR') : 'Pendiente de sincronizar';
      cloudStatusDesc.textContent = `Los cambios se guardan globalmente. Última sincronización: ${syncDate}`;
    } else {
      cloudStatusBox.className = "cloud-status-box local";
      cloudStatusTitle.textContent = "Modo Local Activo";
      cloudStatusDesc.textContent = "Los datos se guardan en el navegador. Configurá las claves de Supabase abajo para publicar para todo el mundo.";
    }
  };

  if (btnSaveCloudConfig) {
    btnSaveCloudConfig.addEventListener('click', async () => {
      const url = inputSupabaseUrl.value.trim();
      const key = inputSupabaseKey.value.trim();

      const current = store.getData();
      current.cloudConfig.supabaseUrl = url;
      current.cloudConfig.supabaseKey = key;
      await store.saveData(current, false);
      updateCloudStatus();
      showToast("Configuración de nube guardada.");
    });
  }

  if (btnTestCloud) {
    btnTestCloud.addEventListener('click', async () => {
      const url = inputSupabaseUrl.value.trim();
      const key = inputSupabaseKey.value.trim();
      try {
        btnTestCloud.disabled = true;
        btnTestCloud.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Probando...';
        await store.testCloudConnection(url, key);
        showToast("¡Conexión a Supabase exitosa!");
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
        const success = await store.pushToCloud();
        if (success) {
          showToast("¡Datos subidos a la nube! Ya son visibles para cualquier dispositivo.");
          updateCloudStatus();
        } else {
          showToast("No se pudo subir a la nube. Verificá la tabla y claves.", true);
        }
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
          showToast("No se encontraron datos en la nube o las claves son inválidas.", true);
        }
      } finally {
        btnPullCloud.disabled = false;
        btnPullCloud.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Descargar Datos de la Nube';
      }
    });
  }

  if (btnSyncNow) {
    btnSyncNow.addEventListener('click', async () => {
      if (!store.isCloudConfigured()) {
        showToast("Primero ingresá la URL y Key de Supabase en la pestaña Nube.", true);
        return;
      }
      btnSyncNow.disabled = true;
      btnSyncNow.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando...';
      const success = await store.pushToCloud();
      btnSyncNow.disabled = false;
      btnSyncNow.innerHTML = '<i class="fa-solid fa-rotate"></i> Sincronizar Ahora';
      if (success) {
        showToast("Sincronización global completada.");
        updateCloudStatus();
      } else {
        showToast("Error al sincronizar con la nube.", true);
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
    formChangePin.addEventListener('submit', (e) => {
      e.preventDefault();
      const current = inputCurrentPin.value;
      const newPin = inputNewPin.value;
      const confirmPin = inputConfirmPin.value;

      if (!store.verifyPin(current)) {
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
        store.setMasterPin(newPin);
        formChangePin.reset();
        showToast("¡PIN maestro actualizado exitosamente!");
      } catch (err) {
        showToast(err.message, true);
      }
    });
  }

  // Comprobar estado al cargar la página
  checkAuth();
});
