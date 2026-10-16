/**
 * FAG EVENTOS - GESTOR CENTRALIZADO DE DATOS (DATA STORE)
 * Permite gestionar de forma dinámica la información de contacto, reels, galería,
 * estadísticas y sincronización en la nube (Supabase / REST / LocalStorage).
 */

const FAG_STORAGE_KEY = 'fag_eventos_site_data';
const FAG_AUTH_KEY = 'fag_eventos_admin_session';

const DEFAULT_FAG_DATA = {
  contact: {
    whatsapp: "5493517580045",
    whatsappDisplay: "+54 9 351 758-0045",
    whatsappMessage: "¡Hola FAG Eventos! Me comunico desde la web oficial para consultar por la organización y producción de un evento.",
    email: "fgigena@gmail.com",
    instagram: "https://www.instagram.com/fag.eventos/",
    instagramDisplay: "@fag.eventos",
    instagramFer: "https://www.instagram.com/fergigena/",
    instagramFede: "https://www.instagram.com/fedepellizzon/"
  },
  hero: {
    titleLine1: "Grandes Convocatorias.",
    titleLine2: "Espectáculos de Nivel Mundial.",
    pill1: "+30 Años",
    pill2: "Financiamiento Propio",
    pill3: "Internacional"
  },
  stats: {
    stat1: { target: 30, prefix: "+", suffix: "", label1: "Años de", label2: "Trayectoria" },
    stat2: { target: 10, prefix: "+", suffix: "", label1: "Países con", label2: "Producciones" },
    stat3: { target: 100, prefix: "", suffix: "%", label1: "Gestión Propia", label2: "& Financiamiento" }
  },
  gallery: [
    {
      id: "item-1",
      title: "Carnavales 2026",
      subtitle: "Montaje de Escenario",
      category: "festivales tecnica",
      categoryName: "Festivales & Montaje",
      img: "assets/gallery/carnaval-2026-montaje.png",
      link: "https://www.instagram.com/fag.eventos/",
      badgeText: "Estructura",
      badgeIcon: "fa-layer-group",
      isReel: false
    },
    {
      id: "item-2",
      title: "Festival Brocheriano",
      subtitle: "Plateas & Logística",
      category: "festivales tecnica",
      categoryName: "Festivales & Logística",
      img: "assets/gallery/brocheriano-predio.png",
      link: "https://www.instagram.com/fag.eventos/",
      badgeText: "Predio",
      badgeIcon: "fa-chair",
      isReel: false
    },
    {
      id: "item-3",
      title: "Festival Brocheriano",
      subtitle: "Pantallas LED & Luces",
      category: "festivales tecnica",
      categoryName: "Festivales & Shows",
      img: "assets/gallery/brocheriano-escenario.png",
      link: "https://www.instagram.com/fag.eventos/",
      badgeText: "Escenario",
      badgeIcon: "fa-tv",
      isReel: false
    },
    {
      id: "item-4",
      title: "Día de San Patricio",
      subtitle: "Santa Rosa de Calamuchita",
      category: "festivales gastronomia",
      categoryName: "Fiestas Populares & Gastronomía",
      img: "assets/gallery/san-patricio.jpg",
      link: "https://www.instagram.com/stories/highlights/18098134006807828/",
      badgeText: "Gastronomía",
      badgeIcon: "fa-beer-mug-empty",
      isReel: false
    },
    {
      id: "item-5",
      title: "Sabores Serranos #26",
      subtitle: "Gastronomía & Danzas",
      category: "festivales gastronomia videos",
      categoryName: "Festival Gastronómico",
      img: "assets/gallery/sabores-serranos.jpg",
      link: "https://www.instagram.com/p/DbBVlW5qEnr/",
      badgeText: "Festival",
      badgeIcon: "fa-utensils",
      isReel: true
    },
    {
      id: "item-6",
      title: "Delicias de Pascua",
      subtitle: "Marcianos en Vivo",
      category: "festivales videos",
      categoryName: "Shows en Vivo & Streaming",
      img: "assets/gallery/delicias-pascua-2026.jpg",
      link: "https://www.instagram.com/p/DW7gcp5iEZD/",
      badgeText: "Shows",
      badgeIcon: "fa-music",
      isReel: true
    },
    {
      id: "item-7",
      title: "Carnaval Santa Rosa",
      subtitle: "Sonido, Luces & Escenario",
      category: "festivales videos",
      categoryName: "Festivales & Recap",
      img: "assets/gallery/carnaval-santa-rosa.jpg",
      link: "https://www.instagram.com/p/DU4Hs2egQWO/",
      badgeText: "Carnaval",
      badgeIcon: "fa-masks-theater",
      isReel: true
    },
    {
      id: "item-8",
      title: "Fiesta Dulce Ciudad",
      subtitle: "Arroyito, Córdoba",
      category: "festivales gastronomia videos",
      categoryName: "Fiestas Nacionales & Experiencias",
      img: "assets/gallery/dulce-ciudad.jpg",
      link: "https://www.instagram.com/p/DJkI1Atpqr1/",
      badgeText: "Arroyito",
      badgeIcon: "fa-location-dot",
      isReel: true
    }
  ],
  cloudConfig: {
    provider: "supabase",
    supabaseUrl: "",
    supabaseKey: "",
    tableName: "fag_site_data",
    lastSynced: null,
    autoSync: true
  },
  security: {
    masterPin: "fag2026"
  }
};

class FagDataStore {
  constructor() {
    this.data = this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(FAG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Mezcla profunda para preservar nuevos campos por defecto si faltan
        return {
          ...DEFAULT_FAG_DATA,
          ...parsed,
          contact: { ...DEFAULT_FAG_DATA.contact, ...(parsed.contact || {}) },
          hero: { ...DEFAULT_FAG_DATA.hero, ...(parsed.hero || {}) },
          stats: { ...DEFAULT_FAG_DATA.stats, ...(parsed.stats || {}) },
          gallery: Array.isArray(parsed.gallery) && parsed.gallery.length > 0 ? parsed.gallery : DEFAULT_FAG_DATA.gallery,
          cloudConfig: { ...DEFAULT_FAG_DATA.cloudConfig, ...(parsed.cloudConfig || {}) },
          security: { ...DEFAULT_FAG_DATA.security, ...(parsed.security || {}) }
        };
      }
    } catch (e) {
      console.warn("FagDataStore: Error al cargar localStorage, usando valores por defecto", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_FAG_DATA));
  }

  getData() {
    return this.data;
  }

  async saveData(newData, triggerCloud = true) {
    this.data = { ...this.data, ...newData };
    try {
      localStorage.setItem(FAG_STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error("FagDataStore: Error al guardar en localStorage", e);
    }

    if (triggerCloud && this.isCloudConfigured()) {
      await this.pushToCloud();
    }
    return this.data;
  }

  resetToDefaults() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_FAG_DATA));
    localStorage.removeItem(FAG_STORAGE_KEY);
    return this.data;
  }

  // --- AUTENTICACIÓN / PIN MAESTRO ---
  verifyPin(inputPin) {
    const currentPin = this.data.security?.masterPin || "fag2026";
    return String(inputPin).trim() === String(currentPin).trim();
  }

  setMasterPin(newPin) {
    if (!newPin || newPin.length < 4) {
      throw new Error("El PIN debe tener al menos 4 caracteres.");
    }
    this.data.security.masterPin = String(newPin).trim();
    this.saveData(this.data, false);
  }

  isAuthenticated() {
    return sessionStorage.getItem(FAG_AUTH_KEY) === 'true';
  }

  login(pin) {
    if (this.verifyPin(pin)) {
      sessionStorage.setItem(FAG_AUTH_KEY, 'true');
      return true;
    }
    return false;
  }

  logout() {
    sessionStorage.removeItem(FAG_AUTH_KEY);
  }

  // --- SINCRONIZACIÓN EN LA NUBE (SUPABASE REST / CUALQUIER REST) ---
  isCloudConfigured() {
    const { supabaseUrl, supabaseKey } = this.data.cloudConfig || {};
    return Boolean(supabaseUrl && supabaseKey && supabaseUrl.startsWith('http'));
  }

  async testCloudConnection(url, key) {
    const targetUrl = (url || this.data.cloudConfig.supabaseUrl || '').replace(/\/$/, '');
    const targetKey = key || this.data.cloudConfig.supabaseKey;
    const tableName = this.data.cloudConfig.tableName || 'fag_site_data';

    if (!targetUrl || !targetKey) {
      throw new Error("Debes ingresar la URL y el API Key de Supabase.");
    }

    const endpoint = `${targetUrl}/rest/v1/${tableName}?select=*&limit=1`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': targetKey,
        'Authorization': `Bearer ${targetKey}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Error ${response.status}: ${errText || 'No se pudo conectar a la tabla'}`);
    }

    return true;
  }

  async fetchFromCloud() {
    if (!this.isCloudConfigured()) return null;

    const { supabaseUrl, supabaseKey, tableName } = this.data.cloudConfig;
    const cleanUrl = supabaseUrl.replace(/\/$/, '');
    const endpoint = `${cleanUrl}/rest/v1/${tableName}?id=eq.1&select=*`;

    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (!res.ok) {
        console.warn("FagDataStore: No se pudo obtener datos de Supabase", res.status);
        return null;
      }

      const rows = await res.json();
      if (rows && rows.length > 0 && rows[0].payload) {
        const cloudData = typeof rows[0].payload === 'string' ? JSON.parse(rows[0].payload) : rows[0].payload;
        // Preservar cloudConfig local y mezclar datos
        const merged = {
          ...this.data,
          ...cloudData,
          cloudConfig: {
            ...this.data.cloudConfig,
            lastSynced: new Date().toISOString()
          }
        };
        await this.saveData(merged, false);
        return merged;
      }
    } catch (e) {
      console.warn("FagDataStore: Error al sincronizar desde la nube:", e);
    }
    return null;
  }

  async pushToCloud() {
    if (!this.isCloudConfigured()) return false;

    const { supabaseUrl, supabaseKey, tableName } = this.data.cloudConfig;
    const cleanUrl = supabaseUrl.replace(/\/$/, '');
    const endpoint = `${cleanUrl}/rest/v1/${tableName}`;

    const payloadToSave = {
      id: 1,
      payload: {
        contact: this.data.contact,
        hero: this.data.hero,
        stats: this.data.stats,
        gallery: this.data.gallery,
        security: this.data.security
      },
      updated_at: new Date().toISOString()
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payloadToSave)
      });

      if (res.ok) {
        this.data.cloudConfig.lastSynced = new Date().toISOString();
        localStorage.setItem(FAG_STORAGE_KEY, JSON.stringify(this.data));
        return true;
      } else {
        const err = await res.text();
        console.error("FagDataStore: Error al subir a la nube", err);
        return false;
      }
    } catch (e) {
      console.error("FagDataStore: Error de red al subir a la nube", e);
      return false;
    }
  }

  // --- EXPORTAR E IMPORTAR COPIA DE SEGURIDAD ---
  exportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fag-eventos-datos-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  async importBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.contact || !parsed.gallery) {
        throw new Error("El archivo no tiene el formato válido de FAG Eventos.");
      }
      await this.saveData(parsed);
      return true;
    } catch (e) {
      throw new Error("JSON inválido: " + e.message);
    }
  }

  // --- APLICAR DATOS DINÁMICOS AL DOM (INDEX / QUIÉNES SOMOS) ---
  applyToDOM() {
    const d = this.data;

    // 1. WhatsApp Buttons
    const cleanPhone = (d.contact.whatsapp || "5493517580045").replace(/[^0-9]/g, '');
    const waMsg = encodeURIComponent(d.contact.whatsappMessage || "¡Hola FAG Eventos! Me comunico desde la web oficial.");
    const waUrl = `https://wa.me/${cleanPhone}?text=${waMsg}`;

    document.querySelectorAll('.dynamic-whatsapp-btn').forEach(btn => {
      btn.setAttribute('href', waUrl);
      btn.setAttribute('target', '_blank');
      btn.setAttribute('rel', 'noopener noreferrer');
    });

    // 2. Email
    if (d.contact.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(btn => {
        btn.setAttribute('href', `mailto:${d.contact.email}`);
      });
    }

    // 3. Instagram Oficial
    if (d.contact.instagram) {
      document.querySelectorAll('a[href*="instagram.com/fag.eventos"]').forEach(btn => {
        btn.setAttribute('href', d.contact.instagram);
      });
    }

    // 4. Hero Titles (si existen en el documento actual)
    const heroTitle = document.querySelector('.hero-main-title');
    if (heroTitle && d.hero) {
      heroTitle.innerHTML = `${d.hero.titleLine1 || 'Grandes Convocatorias.'}<br><span class="hero-title-accent">${d.hero.titleLine2 || 'Espectáculos de Nivel Mundial.'}</span>`;
    }

    // 5. Estadísticas
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 3 && d.stats) {
      const s1 = d.stats.stat1;
      const s2 = d.stats.stat2;
      const s3 = d.stats.stat3;

      if (statCards[0] && s1) {
        const num = statCards[0].querySelector('.stat-number');
        if (num) num.setAttribute('data-target', s1.target);
        const lbl = statCards[0].querySelector('.stat-label');
        if (lbl) lbl.innerHTML = `<span>${s1.label1}</span><span>${s1.label2}</span>`;
      }
      if (statCards[1] && s2) {
        const num = statCards[1].querySelector('.stat-number');
        if (num) num.setAttribute('data-target', s2.target);
        const lbl = statCards[1].querySelector('.stat-label');
        if (lbl) lbl.innerHTML = `<span>${s2.label1}</span><span>${s2.label2}</span>`;
      }
      if (statCards[2] && s3) {
        const num = statCards[2].querySelector('.stat-number');
        if (num) num.setAttribute('data-target', s3.target);
        const lbl = statCards[2].querySelector('.stat-label');
        if (lbl) lbl.innerHTML = `<span>${s3.label1}</span><span>${s3.label2}</span>`;
      }
    }

    // 6. Galería Dinámica
    const galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid && Array.isArray(d.gallery) && d.gallery.length > 0) {
      galleryGrid.innerHTML = d.gallery.map(item => `
        <div class="gallery-item" data-category="${item.category}" data-category-name="${item.categoryName || item.title}" data-img="${item.img}" data-link="${item.link}">
          <div class="gallery-thumb-wrap">
            <span class="gallery-badge"><i class="fa-solid ${item.badgeIcon || 'fa-camera'}"></i> ${item.badgeText || 'Evento'}</span>
            ${item.isReel ? '<span class="gallery-badge-reel video-play-indicator"><i class="fa-solid fa-play"></i> Reel</span>' : ''}
            <img src="${item.img}" alt="${item.title} - ${item.subtitle}" class="gallery-img" loading="lazy" decoding="async">
            <div class="gallery-overlay">
              <div class="gallery-info">
                <h4 class="gallery-title">${item.title}</h4>
                <span class="gallery-subtitle">${item.subtitle}</span>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    }
  }
}

// Instancia global disponible en toda la aplicación
window.fagStore = new FagDataStore();
