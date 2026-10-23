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
    pill1: "Financiamiento Propio",
    pill2: "Internacional"
  },
  stats: {
    stat1: { target: 30, prefix: "+", suffix: "", label1: "Años de", label2: "Trayectoria" },
    stat2: { target: 10, prefix: "+", suffix: "", label1: "Países con", label2: "Producciones" },
    stat3: { target: 100, prefix: "", suffix: "%", label1: "Gestión Propia", label2: "& Financiamiento" }
  },
  gallery: [
    {
      id: "item-1",
      title: "Grandes Conciertos",
      subtitle: "Estadios & Giras Mundiales",
      category: "festivales videos",
      categoryName: "Conciertos Internacionales",
      img: "assets/gallery/mural-lead-singer.jpg",
      link: "https://www.instagram.com/fag.eventos/",
      badgeText: "Mega Show",
      badgeIcon: "fa-microphone",
      isReel: false,
      span: "mural-hero"
    },
    {
      id: "item-2",
      title: "Carnavales 2026",
      subtitle: "Montaje de Escenario Layher",
      category: "festivales tecnica",
      categoryName: "Festivales & Montaje",
      img: "assets/gallery/carnaval-2026-montaje.png",
      link: "https://www.instagram.com/fag.eventos/",
      badgeText: "Estructura",
      badgeIcon: "fa-layer-group",
      isReel: false,
      span: "mural-wide"
    },
    {
      id: "item-3",
      title: "Festival de Peñas",
      subtitle: "Programación Artística & Hitos",
      category: "festivales",
      categoryName: "Festivales Nacionales",
      img: "assets/gallery/mural-latin-artist.jpg",
      link: "https://www.instagram.com/fag.eventos/",
      badgeText: "Festival",
      badgeIcon: "fa-guitar",
      isReel: false,
      span: "mural-tall"
    },
    {
      id: "item-4",
      title: "Festival Brocheriano",
      subtitle: "Pantallas LED & Luces",
      category: "festivales tecnica",
      categoryName: "Festivales & Shows",
      img: "assets/gallery/brocheriano-escenario.png",
      link: "https://www.instagram.com/fag.eventos/",
      badgeText: "Escenario",
      badgeIcon: "fa-tv",
      isReel: false,
      span: "mural-standard"
    },
    {
      id: "item-5",
      title: "Rock & Bandas en Vivo",
      subtitle: "Sonido Line-Array 360°",
      category: "festivales tecnica",
      categoryName: "Técnica & Sonido",
      img: "assets/gallery/mural-guitar-solo.jpg",
      link: "https://www.instagram.com/fag.eventos/",
      badgeText: "Técnica 360°",
      badgeIcon: "fa-bolt",
      isReel: false,
      span: "mural-tall"
    },
    {
      id: "item-6",
      title: "Shows Masivos & Pop",
      subtitle: "Iluminación & Puesta en Escena",
      category: "festivales videos",
      categoryName: "Shows en Vivo",
      img: "assets/gallery/mural-female-star.jpg",
      link: "https://www.instagram.com/fag.eventos/",
      badgeText: "En Vivo",
      badgeIcon: "fa-star",
      isReel: true,
      span: "mural-wide"
    },
    {
      id: "item-7",
      title: "Festival Brocheriano",
      subtitle: "Plateas & Logística",
      category: "festivales tecnica",
      categoryName: "Festivales & Logística",
      img: "assets/gallery/brocheriano-predio.png",
      link: "https://www.instagram.com/fag.eventos/",
      badgeText: "Predio",
      badgeIcon: "fa-chair",
      isReel: false,
      span: "mural-standard"
    },
    {
      id: "item-8",
      title: "Día de San Patricio",
      subtitle: "Santa Rosa de Calamuchita",
      category: "festivales gastronomia",
      categoryName: "Fiestas Populares & Gastronomía",
      img: "assets/gallery/san-patricio.jpg",
      link: "https://www.instagram.com/stories/highlights/18098134006807828/",
      badgeText: "Gastronomía",
      badgeIcon: "fa-beer-mug-empty",
      isReel: false,
      span: "mural-standard"
    },
    {
      id: "item-9",
      title: "Sabores Serranos #26",
      subtitle: "Gastronomía & Danzas",
      category: "festivales gastronomia videos",
      categoryName: "Festival Gastronómico",
      img: "assets/gallery/sabores-serranos.jpg",
      link: "https://www.instagram.com/p/DbBVlW5qEnr/",
      badgeText: "Festival",
      badgeIcon: "fa-utensils",
      isReel: true,
      span: "mural-standard"
    },
    {
      id: "item-10",
      title: "Delicias de Pascua",
      subtitle: "Marcianos en Vivo",
      category: "festivales videos",
      categoryName: "Shows en Vivo & Streaming",
      img: "assets/gallery/delicias-pascua-2026.jpg",
      link: "https://www.instagram.com/p/DW7gcp5iEZD/",
      badgeText: "Shows",
      badgeIcon: "fa-music",
      isReel: true,
      span: "mural-wide"
    },
    {
      id: "item-11",
      title: "Carnaval Santa Rosa",
      subtitle: "Sonido, Luces & Escenario",
      category: "festivales videos",
      categoryName: "Festivales & Recap",
      img: "assets/gallery/carnaval-santa-rosa.jpg",
      link: "https://www.instagram.com/p/DU4Hs2egQWO/",
      badgeText: "Carnaval",
      badgeIcon: "fa-masks-theater",
      isReel: true,
      span: "mural-standard"
    },
    {
      id: "item-12",
      title: "Fiesta Dulce Ciudad",
      subtitle: "Arroyito, Córdoba",
      category: "festivales gastronomia videos",
      categoryName: "Fiestas Nacionales & Experiencias",
      img: "assets/gallery/dulce-ciudad.jpg",
      link: "https://www.instagram.com/p/DJkI1Atpqr1/",
      badgeText: "Arroyito",
      badgeIcon: "fa-location-dot",
      isReel: true,
      span: "mural-standard"
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
    pinHash: "da7c3232b0167aa67ab9627ff7a7ef504863a2d2e5636cbaa956db05aab71a0f"
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

        // Blindaje: eliminar cualquier rastro de PIN en texto plano de versiones anteriores
        let pinHash = DEFAULT_FAG_DATA.security.pinHash;
        if (parsed.security) {
          if (parsed.security.pinHash) {
            pinHash = parsed.security.pinHash;
          }
          delete parsed.security.masterPin;
        }

        // Mezcla profunda para preservar nuevos campos por defecto si faltan
        const merged = {
          ...DEFAULT_FAG_DATA,
          ...parsed,
          contact: { ...DEFAULT_FAG_DATA.contact, ...(parsed.contact || {}) },
          hero: { ...DEFAULT_FAG_DATA.hero, ...(parsed.hero || {}) },
          gallery: (() => {
            if (Array.isArray(parsed.gallery) && parsed.gallery.length >= DEFAULT_FAG_DATA.gallery.length && parsed.gallery[0].span) {
              const items = parsed.gallery;
              if (items[11] && items[11].span === 'mural-wide') {
                items[11].span = 'mural-standard';
              }
              return items;
            }
            return DEFAULT_FAG_DATA.gallery;
          })(),
          cloudConfig: { ...DEFAULT_FAG_DATA.cloudConfig, ...(parsed.cloudConfig || {}) },
          security: { pinHash }
        };

        if (parsed.security && parsed.security.masterPin) {
          localStorage.setItem(FAG_STORAGE_KEY, JSON.stringify(merged));
        }

        return merged;
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

  // --- AUTENTICACIÓN / PIN MAESTRO BLINDADO (SHA-256) ---
  async hashPin(pin) {
    const raw = String(pin || '').trim();
    if (window.crypto && window.crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(raw);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        console.warn("FagDataStore: Error en SubtleCrypto", e);
      }
    }
    return raw;
  }

  async verifyPin(inputPin) {
    if (!inputPin) return false;
    const inputHash = await this.hashPin(inputPin);
    const storedHash = (this.data.security && this.data.security.pinHash) || DEFAULT_FAG_DATA.security.pinHash;
    return inputHash === storedHash;
  }

  async setMasterPin(newPin) {
    if (!newPin || String(newPin).trim().length < 4) {
      throw new Error("El PIN debe tener al menos 4 caracteres.");
    }
    const newHash = await this.hashPin(newPin);
    this.data.security = { pinHash: newHash };
    await this.saveData(this.data, false);
  }

  isAuthenticated() {
    return sessionStorage.getItem(FAG_AUTH_KEY) === 'true';
  }

  async login(pin) {
    const isValid = await this.verifyPin(pin);
    if (isValid) {
      sessionStorage.setItem(FAG_AUTH_KEY, 'true');
      return true;
    }
    return false;
  }

  logout() {
    sessionStorage.removeItem(FAG_AUTH_KEY);
  }

  // --- SINCRONIZACIÓN EN LA NUBE (NEON / VERCEL & SUPABASE) ---
  isCloudConfigured() {
    const cfg = this.data.cloudConfig || {};
    // Neon en Vercel funciona de forma nativa a través de /api/data
    if (cfg.provider === 'neon' || !cfg.provider) return true;
    return Boolean(cfg.supabaseUrl && cfg.supabaseKey && cfg.supabaseUrl.startsWith('http'));
  }

  async testCloudConnection(url, key) {
    // Si no se pasaron credenciales de Supabase, probar el endpoint de Neon en Vercel
    if (!url && !key) {
      const response = await fetch('/api/data', { method: 'GET' });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Error ${response.status}: No se pudo conectar con /api/data (Neon).`);
      }
      return { provider: 'neon' };
    }

    const targetUrl = url.replace(/\/$/, '');
    const tableName = this.data.cloudConfig.tableName || 'fag_site_data';

    const endpoint = `${targetUrl}/rest/v1/${tableName}?select=*&limit=1`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Error ${response.status}: ${errText || 'No se pudo conectar a la tabla de Supabase'}`);
    }

    return { provider: 'supabase' };
  }

  async fetchFromCloud() {
    // 1. Intentar primero con el endpoint serverless de Neon (/api/data)
    try {
      const res = await fetch('/api/data', { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.status === 'success' && json.data) {
          const merged = {
            ...this.data,
            ...json.data,
            cloudConfig: {
              ...this.data.cloudConfig,
              provider: 'neon',
              lastSynced: json.updated_at || new Date().toISOString()
            }
          };
          await this.saveData(merged, false);
          return merged;
        }
      }
    } catch (e) {
      // Ignorar si estamos en local sin Vercel dev
    }

    // 2. Fallback a Supabase si está configurado
    const { supabaseUrl, supabaseKey, tableName } = this.data.cloudConfig || {};
    if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
      const cleanUrl = supabaseUrl.replace(/\/$/, '');
      const endpoint = `${cleanUrl}/rest/v1/${tableName || 'fag_site_data'}?id=eq.1&select=*`;

      try {
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });

        if (res.ok) {
          const rows = await res.json();
          if (rows && rows.length > 0 && rows[0].payload) {
            const cloudData = typeof rows[0].payload === 'string' ? JSON.parse(rows[0].payload) : rows[0].payload;
            const merged = {
              ...this.data,
              ...cloudData,
              cloudConfig: {
                ...this.data.cloudConfig,
                provider: 'supabase',
                lastSynced: new Date().toISOString()
              }
            };
            await this.saveData(merged, false);
            return merged;
          }
        }
      } catch (e) {
        console.warn("FagDataStore: Error al sincronizar desde Supabase:", e);
      }
    }

    return null;
  }

  async pushToCloud(customPin = null) {
    // Sanitización: excluir 'security' para evitar almacenar credenciales o hashes en bases públicas
    const payloadToSave = {
      contact: this.data.contact,
      hero: this.data.hero,
      stats: this.data.stats,
      gallery: this.data.gallery
    };

    const activePin = customPin || (this.data.security && this.data.security.pinHash) || DEFAULT_FAG_DATA.security.pinHash;

    // 1. Intentar subir primero a Neon en Vercel (/api/data)
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: payloadToSave, pin: activePin })
      });

      if (res.ok) {
        this.data.cloudConfig.provider = 'neon';
        this.data.cloudConfig.lastSynced = new Date().toISOString();
        localStorage.setItem(FAG_STORAGE_KEY, JSON.stringify(this.data));
        return { success: true, provider: 'neon' };
      } else if (res.status === 401) {
        throw new Error("PIN de seguridad no válido.");
      }
    } catch (e) {
      if (e.message && e.message.includes("PIN")) throw e;
      // Continuar al fallback de Supabase si aplica
    }

    // 2. Fallback a Supabase si está configurado
    const { supabaseUrl, supabaseKey, tableName } = this.data.cloudConfig || {};
    if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
      const cleanUrl = supabaseUrl.replace(/\/$/, '');
      const endpoint = `${cleanUrl}/rest/v1/${tableName || 'fag_site_data'}`;

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            id: 1,
            payload: payloadToSave,
            updated_at: new Date().toISOString()
          })
        });

        if (res.ok) {
          this.data.cloudConfig.provider = 'supabase';
          this.data.cloudConfig.lastSynced = new Date().toISOString();
          localStorage.setItem(FAG_STORAGE_KEY, JSON.stringify(this.data));
          return { success: true, provider: 'supabase' };
        } else {
          const err = await res.text();
          console.error("FagDataStore: Error al subir a Supabase", err);
          return false;
        }
      } catch (e) {
        console.error("FagDataStore: Error de red al subir a Supabase", e);
        return false;
      }
    }

    return false;
  }

  // --- EXPORTAR E IMPORTAR COPIA DE SEGURIDAD ---
  exportBackup() {
    const safeData = { ...this.data };
    delete safeData.security; // Nunca exportar hashes ni PIN en el JSON descargable
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(safeData, null, 2));
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
    if (!d) return;

    // 1. WhatsApp: Enlaces directos y botones
    const cleanPhone = (d.contact?.whatsapp || "5493517580045").replace(/[^0-9]/g, '');
    const waMsg = encodeURIComponent(d.contact?.whatsappMessage || "¡Hola FAG Eventos! Me comunico desde la web oficial para consultar por la organización y producción de un evento.");
    const waUrl = `https://wa.me/${cleanPhone}?text=${waMsg}`;

    document.querySelectorAll('.dynamic-whatsapp-btn, a[href*="wa.me"]').forEach(btn => {
      btn.setAttribute('href', waUrl);
      btn.setAttribute('target', '_blank');
      btn.setAttribute('rel', 'noopener noreferrer');
    });

    // 2. Correo Electrónico
    if (d.contact?.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(btn => {
        btn.setAttribute('href', `mailto:${d.contact.email}`);
      });
    }

    // 3. Instagram Oficial FAG y Socios
    if (d.contact?.instagram) {
      document.querySelectorAll('a[href*="instagram.com/fag.eventos"]').forEach(btn => {
        btn.setAttribute('href', d.contact.instagram);
      });
    }
    if (d.contact?.instagramFer) {
      document.querySelectorAll('a[href*="instagram.com/fergigena"]').forEach(btn => {
        btn.setAttribute('href', d.contact.instagramFer);
      });
    }
    if (d.contact?.instagramFede) {
      document.querySelectorAll('a[href*="instagram.com/fedepellizzon"]').forEach(btn => {
        btn.setAttribute('href', d.contact.instagramFede);
      });
    }

    // 4. Hero Titles (Titulares en portada)
    const heroTitle = document.querySelector('.hero-main-title');
    if (heroTitle && d.hero) {
      heroTitle.innerHTML = `${d.hero.titleLine1 || 'Grandes Convocatorias.'}<br><span class="hero-title-accent">${d.hero.titleLine2 || 'Espectáculos de Nivel Mundial.'}</span>`;
    }

    // 5. Estadísticas de Impacto (Número, Prefijo/Sufijo y Renglones)
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 3 && d.stats) {
      const s1 = d.stats.stat1;
      const s2 = d.stats.stat2;
      const s3 = d.stats.stat3;

      if (statCards[0] && s1) {
        const wrap = statCards[0].querySelector('.stat-number-wrap');
        const num = statCards[0].querySelector('.stat-number');
        if (wrap) {
          wrap.innerHTML = `${s1.prefix ? `<span class="stat-plus">${s1.prefix}</span>` : ''}<span class="stat-number" data-target="${s1.target}">${s1.target}</span>${s1.suffix ? `<span class="stat-plus">${s1.suffix}</span>` : ''}`;
        } else if (num) {
          num.setAttribute('data-target', s1.target);
          num.textContent = s1.target;
        }
        const lbl = statCards[0].querySelector('.stat-label');
        if (lbl) lbl.innerHTML = `<span>${s1.label1}</span><span>${s1.label2}</span>`;
      }

      if (statCards[1] && s2) {
        const wrap = statCards[1].querySelector('.stat-number-wrap');
        const num = statCards[1].querySelector('.stat-number');
        if (wrap) {
          wrap.innerHTML = `${s2.prefix ? `<span class="stat-plus">${s2.prefix}</span>` : ''}<span class="stat-number" data-target="${s2.target}">${s2.target}</span>${s2.suffix ? `<span class="stat-plus">${s2.suffix}</span>` : ''}`;
        } else if (num) {
          num.setAttribute('data-target', s2.target);
          num.textContent = s2.target;
        }
        const lbl = statCards[1].querySelector('.stat-label');
        if (lbl) lbl.innerHTML = `<span>${s2.label1}</span><span>${s2.label2}</span>`;
      }

      if (statCards[2] && s3) {
        const wrap = statCards[2].querySelector('.stat-number-wrap');
        const num = statCards[2].querySelector('.stat-number');
        if (wrap) {
          wrap.innerHTML = `${s3.prefix ? `<span class="stat-plus">${s3.prefix}</span>` : ''}<span class="stat-number" data-target="${s3.target}">${s3.target}</span>${s3.suffix ? `<span class="stat-plus">${s3.suffix}</span>` : ''}`;
        } else if (num) {
          num.setAttribute('data-target', s3.target);
          num.textContent = s3.target;
        }
        const lbl = statCards[2].querySelector('.stat-label');
        if (lbl) lbl.innerHTML = `<span>${s3.label1}</span><span>${s3.label2}</span>`;
      }
    }

    // 6. Galería Dinámica
    const galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid && Array.isArray(d.gallery) && d.gallery.length > 0) {
      galleryGrid.innerHTML = d.gallery.map(item => `
        <div class="gallery-item ${item.span || 'mural-standard'}" data-category="${item.category}" data-category-name="${item.categoryName || item.title}" data-img="${item.img}" data-link="${item.link}">
          <div class="gallery-thumb-wrap">
            <img src="${item.img}" alt="${item.title}" class="gallery-img" loading="lazy" decoding="async">
            <div class="gallery-overlay">
              <div class="gallery-info">
                <h4 class="gallery-title">${item.title}</h4>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Despachar evento para sincronización reactiva
    window.dispatchEvent(new CustomEvent('fagStoreUpdated', { detail: d }));
  }
}

// Instancia global disponible en toda la aplicación
window.fagStore = new FagDataStore();
