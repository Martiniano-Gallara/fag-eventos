/**
 * FAG EVENTOS - GESTOR CENTRALIZADO DE DATOS (DATA STORE)
 * Gestiona el contenido del sitio (contacto, hero, estadísticas, galería).
 * Utiliza localStorage únicamente como caché local y sincroniza con la API de Vercel / Neon.
 */

const FAG_STORAGE_KEY = 'fag_eventos_site_data';

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
      id: "item-2",
      title: "Carnavales 2026",
      subtitle: "Montaje de Escenario Layher",
      category: "festivales tecnica",
      categoryName: "Festivales & Montaje",
      img: "assets/gallery/carnaval-2026-montaje.webp",
      link: "https://www.instagram.com/fag.eventos/",
      badgeText: "Estructura",
      badgeIcon: "fa-layer-group",
      isReel: false,
      span: "mural-hero"
    },
    {
      id: "item-4",
      title: "Festival Brocheriano",
      subtitle: "Pantallas LED & Luces",
      category: "festivales tecnica",
      categoryName: "Festivales & Shows",
      img: "assets/gallery/brocheriano-escenario.webp",
      link: "https://www.instagram.com/fag.eventos/",
      badgeText: "Escenario",
      badgeIcon: "fa-tv",
      isReel: false,
      span: "mural-wide"
    },
    {
      id: "item-7",
      title: "Festival Brocheriano",
      subtitle: "Plateas & Logística",
      category: "festivales tecnica",
      categoryName: "Festivales & Logística",
      img: "assets/gallery/brocheriano-predio.webp",
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
      img: "assets/gallery/san-patricio.webp",
      link: "https://www.instagram.com/stories/highlights/18098134006807828/",
      badgeText: "Gastronomía",
      badgeIcon: "fa-beer-mug-empty",
      isReel: false,
      span: "mural-tall"
    },
    {
      id: "item-9",
      title: "Sabores Serranos #26",
      subtitle: "Gastronomía & Danzas",
      category: "festivales gastronomia videos",
      categoryName: "Festival Gastronómico",
      img: "assets/gallery/sabores-serranos.webp",
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
      img: "assets/gallery/delicias-pascua-2026.webp",
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
      img: "assets/gallery/carnaval-santa-rosa.webp",
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
      img: "assets/gallery/dulce-ciudad.webp",
      link: "https://www.instagram.com/p/DJkI1Atpqr1/",
      badgeText: "Arroyito",
      badgeIcon: "fa-location-dot",
      isReel: true,
      span: "mural-standard"
    }
  ]
};

class FagDataStore {
  constructor() {
    this.version = 0;
    this.data = this.loadFromStorage();
  }

  // --- HELPERS DE SANITIZACIÓN Y VALIDACIÓN ---
  onlyDigits(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return '';
    return String(value).replace(/\D/g, '');
  }

  safeUrl(value, options = {}) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.includes('<') || trimmed.includes('>')) return null;

    if (options.allowRelativeAssets) {
      if (/^assets\/gallery\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp|avif)$/i.test(trimmed)) {
        return trimmed;
      }
    }

    if (options.allowDataImage || options.allowRelativeAssets) {
      if (/^data:image\/(webp|jpeg|jpg|png|gif|avif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
        return trimmed;
      }
    }

    try {
      const base = typeof location !== 'undefined' ? location.origin : 'https://localhost';
      const parsed = new URL(trimmed, base);
      if (parsed.protocol === 'https:') {
        return parsed.href;
      }
    } catch {
      return null;
    }

    return null;
  }

  // --- ALMACENAMIENTO LOCAL COMO CACHÉ ---
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(FAG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed &&
          typeof parsed === 'object' &&
          parsed.contact &&
          parsed.hero &&
          parsed.stats &&
          Array.isArray(parsed.gallery)
        ) {
          if (typeof parsed._version === 'number') {
            this.version = parsed._version;
          }
          return {
            contact: parsed.contact,
            hero: parsed.hero,
            stats: parsed.stats,
            gallery: parsed.gallery
          };
        }
      }
    } catch (e) {
      console.warn("FagDataStore: Error al leer la caché local. Usando valores por defecto.", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_FAG_DATA));
  }

  saveToStorage() {
    try {
      const cacheObject = {
        ...this.data,
        _version: this.version
      };
      localStorage.setItem(FAG_STORAGE_KEY, JSON.stringify(cacheObject));
    } catch (e) {
      console.warn("FagDataStore: No se pudo guardar en caché local.", e);
    }
  }

  getData() {
    return JSON.parse(JSON.stringify(this.data));
  }

  saveData(newData) {
    if (!newData || typeof newData !== 'object') return;
    this.data = {
      contact: { ...(newData.contact || this.data.contact) },
      hero: { ...(newData.hero || this.data.hero) },
      stats: { ...(newData.stats || this.data.stats) },
      gallery: Array.isArray(newData.gallery) ? [...newData.gallery] : this.data.gallery
    };
  }

  // --- COMUNICACIÓN CON LA API EN LA NUBE ---
  async fetchFromCloud() {
    try {
      const res = await fetch('/api/data', {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        this.data = json.data;
        this.version = typeof json.version === 'number' ? json.version : 1;
        this.saveToStorage();
        return this.data;
      }
    } catch (e) {
      console.warn("FagDataStore: No se pudo sincronizar desde el servidor, usando caché local.", e.message);
    }
    return this.data;
  }

  async publish() {
    const payload = {
      contact: this.data.contact,
      hero: this.data.hero,
      stats: this.data.stats,
      gallery: this.data.gallery
    };

    const res = await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        payload,
        baseVersion: this.version
      })
    });

    const json = await res.json().catch(() => ({}));

    if (res.status === 200 && json.status === 'success') {
      this.version = json.version;
      this.saveToStorage();
      return json.version;
    }

    if (res.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }

    if (res.status === 409) {
      throw new Error('CONFLICT');
    }

    if (res.status === 400) {
      throw new Error(json.error || 'Error de validación en los datos enviados.');
    }

    throw new Error(json.error || 'Error al publicar los cambios.');
  }

  // --- COPIAS DE SEGURIDAD JSON ---
  exportBackup() {
    const backupData = {
      contact: this.data.contact,
      hero: this.data.hero,
      stats: this.data.stats,
      gallery: this.data.gallery
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fag-eventos-datos-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  async importBackup(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error("Formato JSON inválido: " + e.message);
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error("El archivo no contiene un JSON válido.");
    }

    if (!parsed.contact || !parsed.hero || !parsed.stats || !Array.isArray(parsed.gallery)) {
      throw new Error("El archivo no contiene las secciones requeridas (contact, hero, stats, gallery).");
    }

    const checkText = (val, max) =>
      typeof val === 'string' && !val.includes('<') && !val.includes('>') && val.trim().length <= max;

    if (!checkText(parsed.hero.titleLine1, 80) || !checkText(parsed.hero.titleLine2, 80)) {
      throw new Error("Los textos de Hero contienen caracteres inválidos o superan el límite.");
    }

    const cleanGallery = [];
    for (const item of parsed.gallery) {
      if (!item || typeof item !== 'object') continue;
      const imgUrl = this.safeUrl(item.img, { allowRelativeAssets: true });
      if (!imgUrl) continue;

      cleanGallery.push({
        id: String(item.id || `item-${crypto.randomUUID().slice(0, 8)}`),
        title: String(item.title || '').slice(0, 80),
        subtitle: String(item.subtitle || '').slice(0, 120),
        category: String(item.category || 'festivales'),
        categoryName: String(item.categoryName || ''),
        img: imgUrl,
        link: this.safeUrl(item.link) || 'https://www.instagram.com/fag.eventos/',
        badgeText: String(item.badgeText || '').slice(0, 30),
        badgeIcon: String(item.badgeIcon || 'fa-camera'),
        isReel: Boolean(item.isReel),
        span: String(item.span || 'mural-standard')
      });
    }

    this.data = {
      contact: { ...parsed.contact },
      hero: { ...parsed.hero },
      stats: { ...parsed.stats },
      gallery: cleanGallery
    };

    return true;
  }

  // --- APLICAR DATOS DINÁMICOS AL DOM SIN INNERHTML CON DATOS DINÁMICOS ---
  applyToDOM() {
    const d = this.data;
    if (!d) return;

    // 1. WhatsApp: Enlaces directos y botones
    const cleanPhone = this.onlyDigits(d.contact?.whatsapp || "5493517580045");
    const rawMsg = (d.contact?.whatsappMessage || "").trim();
    const waMsg = encodeURIComponent(rawMsg);
    if (cleanPhone.length >= 8 && cleanPhone.length <= 15) {
      const waUrl = `https://wa.me/${cleanPhone}${waMsg ? `?text=${waMsg}` : ''}`;
      document.querySelectorAll('.dynamic-whatsapp-btn, a[href*="wa.me"]').forEach(btn => {
        btn.setAttribute('href', waUrl);
        btn.setAttribute('target', '_blank');
        btn.setAttribute('rel', 'noopener noreferrer');
      });
    }

    // 2. Correo Electrónico
    const email = (d.contact?.email || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && emailRegex.test(email) && email.length <= 120 && !email.includes('<') && !email.includes('>')) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(btn => {
        btn.setAttribute('href', `mailto:${email}`);
      });
    }

    // 3. Instagram Oficial FAG y Socios
    const igOfficial = this.safeUrl(d.contact?.instagram);
    if (igOfficial) {
      document.querySelectorAll('a[href*="instagram.com/fag.eventos"]').forEach(btn => {
        btn.setAttribute('href', igOfficial);
      });
    }
    const igFer = this.safeUrl(d.contact?.instagramFer);
    if (igFer) {
      document.querySelectorAll('a[href*="instagram.com/fergigena"]').forEach(btn => {
        btn.setAttribute('href', igFer);
      });
    }
    const igFede = this.safeUrl(d.contact?.instagramFede);
    if (igFede) {
      document.querySelectorAll('a[href*="instagram.com/fedepellizzon"]').forEach(btn => {
        btn.setAttribute('href', igFede);
      });
    }

    // 4. Hero Titles (Titulares en portada)
    const heroTitle = document.querySelector('.hero-main-title');
    if (heroTitle && d.hero) {
      const t1 = document.createTextNode(d.hero.titleLine1 || 'Grandes Convocatorias.');
      const br = document.createElement('br');
      const spanAccent = document.createElement('span');
      spanAccent.className = 'hero-title-accent';
      spanAccent.textContent = d.hero.titleLine2 || 'Espectáculos de Nivel Mundial.';
      heroTitle.replaceChildren(t1, br, spanAccent);
    }

    // 5. Estadísticas de Impacto (Número, Prefijo/Sufijo y Renglones)
    const statCards = document.querySelectorAll('.stat-card');
    const statsList = [d.stats?.stat1, d.stats?.stat2, d.stats?.stat3];
    statCards.forEach((card, idx) => {
      const s = statsList[idx];
      if (!s) return;

      const wrap = card.querySelector('.stat-number-wrap');
      if (wrap) {
        const children = [];
        if (s.prefix) {
          const spPrefix = document.createElement('span');
          spPrefix.className = 'stat-plus';
          spPrefix.textContent = s.prefix;
          children.push(spPrefix);
        }
        const spNum = document.createElement('span');
        spNum.className = 'stat-number';
        spNum.dataset.target = String(Number(s.target) || 0);
        spNum.textContent = String(Number(s.target) || 0);
        children.push(spNum);

        if (s.suffix) {
          const spSuffix = document.createElement('span');
          spSuffix.className = 'stat-plus';
          spSuffix.textContent = s.suffix;
          children.push(spSuffix);
        }
        wrap.replaceChildren(...children);
      }

      const lbl = card.querySelector('.stat-label');
      if (lbl) {
        const sp1 = document.createElement('span');
        sp1.textContent = s.label1 || '';
        const sp2 = document.createElement('span');
        sp2.textContent = s.label2 || '';
        lbl.replaceChildren(sp1, sp2);
      }
    });

    // 6. Galería Dinámica (Reconstrucción solo si difieren los IDs)
    const galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid && Array.isArray(d.gallery)) {
      const currentIds = Array.from(galleryGrid.querySelectorAll('.gallery-item')).map(
        el => el.dataset.id || ''
      );
      const newIds = d.gallery.map(item => item.id || '');
      const idsMatch =
        currentIds.length === newIds.length &&
        currentIds.every((id, i) => id === newIds[i]);

      if (!idsMatch) {
        const fragment = document.createDocumentFragment();
        for (const item of d.gallery) {
          const imgSrc = this.safeUrl(item.img, { allowRelativeAssets: true });
          if (!imgSrc) continue;

          const linkUrl = this.safeUrl(item.link) || 'https://www.instagram.com/fag.eventos/';

          const itemEl = document.createElement('div');
          itemEl.className = `gallery-item ${item.span || 'mural-standard'}`;
          itemEl.dataset.id = item.id || '';
          itemEl.dataset.category = item.category || 'festivales';
          itemEl.dataset.categoryName = item.categoryName || item.title || '';
          itemEl.dataset.img = imgSrc;
          itemEl.dataset.link = linkUrl;

          const thumbWrap = document.createElement('div');
          thumbWrap.className = 'gallery-thumb-wrap';

          const img = document.createElement('img');
          img.src = imgSrc;
          img.alt = item.title || 'FAG Eventos';
          img.className = 'gallery-img';
          img.loading = 'lazy';
          img.decoding = 'async';

          const overlay = document.createElement('div');
          overlay.className = 'gallery-overlay';

          const info = document.createElement('div');
          info.className = 'gallery-info';

          const h4 = document.createElement('h4');
          h4.className = 'gallery-title';
          h4.textContent = item.title || '';
          info.appendChild(h4);

          if (item.subtitle) {
            const sub = document.createElement('span');
            sub.className = 'gallery-subtitle';
            sub.textContent = item.subtitle;
            info.appendChild(sub);
          }

          // Detalles y botón que se revelan al expandirse en el mural
          const details = document.createElement('div');
          details.className = 'gallery-expanded-details';

          const igBtn = document.createElement('a');
          igBtn.href = linkUrl;
          igBtn.target = '_blank';
          igBtn.rel = 'noopener noreferrer';
          igBtn.className = 'gallery-expand-btn-ig';

          const igIcon = document.createElement('i');
          igIcon.className = 'fa-brands fa-instagram';
          igBtn.appendChild(igIcon);

          const isVideo = linkUrl.includes('/reel/') || linkUrl.includes('/p/') || (item.category && item.category.includes('videos'));
          const btnText = document.createTextNode(isVideo ? ' Ver Reel en Instagram' : ' Ver en Instagram');
          igBtn.appendChild(btnText);

          details.appendChild(igBtn);
          info.appendChild(details);
          overlay.appendChild(info);

          // Botón cerrar para contraer ítem expandido
          const closeBtn = document.createElement('button');
          closeBtn.type = 'button';
          closeBtn.className = 'gallery-expand-close';
          closeBtn.setAttribute('aria-label', 'Contraer elemento');
          const closeIcon = document.createElement('i');
          closeIcon.className = 'fa-solid fa-xmark';
          closeBtn.appendChild(closeIcon);

          thumbWrap.appendChild(img);
          thumbWrap.appendChild(closeBtn);
          thumbWrap.appendChild(overlay);
          itemEl.appendChild(thumbWrap);

          fragment.appendChild(itemEl);
        }
        galleryGrid.replaceChildren(fragment);
        galleryGrid.dataset.visibleCount = String(d.gallery.length);
      }
    }

    // Despachar evento para sincronización reactiva
    window.dispatchEvent(new CustomEvent('fagStoreUpdated', { detail: d }));
  }
}

// Instancia global disponible en toda la aplicación
window.fagStore = new FagDataStore();
