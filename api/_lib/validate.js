const ALLOWED_CATEGORIES = new Set([
  'festivales',
  'tecnica',
  'gastronomia',
  'videos',
  'festivales tecnica',
  'festivales gastronomia',
  'festivales gastronomia videos',
  'festivales videos'
]);

const ALLOWED_SPANS = new Set([
  'mural-hero',
  'mural-wide',
  'mural-tall',
  'mural-standard'
]);

const STAT_SYMBOLS_REGEX = /^[+%xkKM\s]{0,3}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID_REGEX = /^item-[a-z0-9-]{1,40}$/;
const BADGE_ICON_REGEX = /^fa-[a-z0-9-]{1,40}$/;
const GALLERY_IMG_RELATIVE_REGEX = /^assets\/gallery\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp|avif)$/i;
const DATA_IMAGE_REGEX = /^data:image\/(webp|jpeg|jpg|png|gif|avif);base64,[A-Za-z0-9+/=]+$/i;

function validateText(str, fieldName, maxLen, { optional = false, allowNewlines = false } = {}) {
  if (str === undefined || str === null) {
    if (optional) return { ok: true, value: '' };
    return { ok: false, error: `El campo ${fieldName} es obligatorio.` };
  }
  if (typeof str !== 'string') {
    return { ok: false, error: `El campo ${fieldName} debe ser una cadena de texto.` };
  }
  const trimmed = str.trim();
  if (trimmed.length === 0 && optional) {
    return { ok: true, value: '' };
  }
  if (trimmed.length === 0 && !optional) {
    return { ok: false, error: `El campo ${fieldName} no puede estar vacío.` };
  }
  if (trimmed.includes('<') || trimmed.includes('>')) {
    return { ok: false, error: `El campo ${fieldName} contiene caracteres no permitidos (< o >).` };
  }
  const controlRegex = allowNewlines
    ? /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/
    : /[\x00-\x1F\x7F]/;
  if (controlRegex.test(trimmed)) {
    return { ok: false, error: `El campo ${fieldName} contiene caracteres de control no permitidos.` };
  }
  if (trimmed.length > maxLen) {
    return { ok: false, error: `El campo ${fieldName} supera el límite de ${maxLen} caracteres.` };
  }
  return { ok: true, value: trimmed };
}

function validateInstagramUrl(urlStr, fieldName) {
  if (typeof urlStr !== 'string') {
    return { ok: false, error: `El campo ${fieldName} debe ser una URL.` };
  }
  const trimmed = urlStr.trim();
  if (trimmed.includes('<') || trimmed.includes('>')) {
    return { ok: false, error: `El campo ${fieldName} contiene caracteres no permitidos (< o >).` };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return { ok: false, error: `El campo ${fieldName} debe utilizar el protocolo HTTPS.` };
    }
    const host = parsed.hostname.toLowerCase();
    if (host !== 'instagram.com' && host !== 'www.instagram.com') {
      return { ok: false, error: `El campo ${fieldName} debe tener como destino instagram.com.` };
    }
    return { ok: true, value: trimmed };
  } catch {
    return { ok: false, error: `El campo ${fieldName} no es una URL válida.` };
  }
}

function validateGalleryImg(imgStr, fieldName) {
  if (typeof imgStr !== 'string') {
    return { ok: false, error: `El campo ${fieldName} debe ser una ruta o URL.` };
  }
  const trimmed = imgStr.trim();
  if (trimmed.includes('<') || trimmed.includes('>')) {
    return { ok: false, error: `El campo ${fieldName} contiene caracteres no permitidos (< o >).` };
  }
  if (GALLERY_IMG_RELATIVE_REGEX.test(trimmed)) {
    return { ok: true, value: trimmed };
  }
  if (DATA_IMAGE_REGEX.test(trimmed)) {
    if (trimmed.length > 2.5 * 1024 * 1024) {
      return { ok: false, error: `La imagen subida en ${fieldName} supera el límite de 2 MB.` };
    }
    return { ok: true, value: trimmed };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') {
      return { ok: true, value: trimmed };
    }
  } catch {}

  return {
    ok: false,
    error: `El campo ${fieldName} debe ser una ruta relativa válida, una imagen subida válida o una URL HTTPS.`
  };
}

export function validatePayload(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'El contenido principal debe ser un objeto válido.' };
  }

  // Verificar tamaño del JSON serializado <= 4.5 MB (soporte imágenes subidas)
  try {
    const jsonStr = JSON.stringify(input);
    if (Buffer.byteLength(jsonStr, 'utf8') > 4.5 * 1024 * 1024) {
      return { ok: false, error: 'El tamaño de los datos supera el límite máximo de 4.5 MB.' };
    }
  } catch {
    return { ok: false, error: 'Los datos no se pueden serializar correctamente.' };
  }

  // --- CONTACTO ---
  const rawContact = input.contact;
  if (!rawContact || typeof rawContact !== 'object') {
    return { ok: false, error: 'La sección contact es obligatoria.' };
  }

  const whatsappRaw = String(rawContact.whatsapp || '').trim();
  if (!/^\d{8,15}$/.test(whatsappRaw)) {
    return { ok: false, error: 'El teléfono de WhatsApp debe contener entre 8 y 15 dígitos numéricos.' };
  }

  const waDisplayRes = validateText(rawContact.whatsappDisplay, 'contact.whatsappDisplay', 30);
  if (!waDisplayRes.ok) return waDisplayRes;

  const waMsgRes = validateText(rawContact.whatsappMessage, 'contact.whatsappMessage', 300, { allowNewlines: true });
  if (!waMsgRes.ok) return waMsgRes;

  const emailRes = validateText(rawContact.email, 'contact.email', 120);
  if (!emailRes.ok) return emailRes;
  if (!EMAIL_REGEX.test(emailRes.value)) {
    return { ok: false, error: 'El correo electrónico no tiene un formato válido.' };
  }

  const igOfficialRes = validateInstagramUrl(rawContact.instagram, 'contact.instagram');
  if (!igOfficialRes.ok) return igOfficialRes;

  const igFerRes = validateInstagramUrl(rawContact.instagramFer, 'contact.instagramFer');
  if (!igFerRes.ok) return igFerRes;

  const igFedeRes = validateInstagramUrl(rawContact.instagramFede, 'contact.instagramFede');
  if (!igFedeRes.ok) return igFedeRes;

  const igDisplayRes = validateText(rawContact.instagramDisplay, 'contact.instagramDisplay', 40);
  if (!igDisplayRes.ok) return igDisplayRes;

  const cleanContact = {
    whatsapp: whatsappRaw,
    whatsappDisplay: waDisplayRes.value,
    whatsappMessage: waMsgRes.value,
    email: emailRes.value,
    instagram: igOfficialRes.value,
    instagramDisplay: igDisplayRes.value,
    instagramFer: igFerRes.value,
    instagramFede: igFedeRes.value
  };

  // --- HERO ---
  const rawHero = input.hero;
  if (!rawHero || typeof rawHero !== 'object') {
    return { ok: false, error: 'La sección hero es obligatoria.' };
  }

  const hTitle1Res = validateText(rawHero.titleLine1, 'hero.titleLine1', 80);
  if (!hTitle1Res.ok) return hTitle1Res;

  const hTitle2Res = validateText(rawHero.titleLine2, 'hero.titleLine2', 80);
  if (!hTitle2Res.ok) return hTitle2Res;

  const hPill1Res = validateText(rawHero.pill1, 'hero.pill1', 40);
  if (!hPill1Res.ok) return hPill1Res;

  const hPill2Res = validateText(rawHero.pill2, 'hero.pill2', 40);
  if (!hPill2Res.ok) return hPill2Res;

  const cleanHero = {
    titleLine1: hTitle1Res.value,
    titleLine2: hTitle2Res.value,
    pill1: hPill1Res.value,
    pill2: hPill2Res.value
  };

  // --- STATS ---
  const rawStats = input.stats;
  if (!rawStats || typeof rawStats !== 'object') {
    return { ok: false, error: 'La sección stats es obligatoria.' };
  }

  const cleanStats = {};
  for (const statKey of ['stat1', 'stat2', 'stat3']) {
    const s = rawStats[statKey];
    if (!s || typeof s !== 'object') {
      return { ok: false, error: `El campo stats.${statKey} es obligatorio.` };
    }

    const targetNum = Number(s.target);
    if (!Number.isInteger(targetNum) || targetNum < 0 || targetNum > 100000) {
      return { ok: false, error: `El valor numérico de stats.${statKey}.target debe ser un entero entre 0 y 100000.` };
    }

    const prefixRes = validateText(s.prefix || '', `stats.${statKey}.prefix`, 3, { optional: true });
    if (!prefixRes.ok) return prefixRes;
    if (!STAT_SYMBOLS_REGEX.test(prefixRes.value)) {
      return { ok: false, error: `El prefijo de stats.${statKey} solo permite los símbolos: + % x k K M.` };
    }

    const suffixRes = validateText(s.suffix || '', `stats.${statKey}.suffix`, 3, { optional: true });
    if (!suffixRes.ok) return suffixRes;
    if (!STAT_SYMBOLS_REGEX.test(suffixRes.value)) {
      return { ok: false, error: `El sufijo de stats.${statKey} solo permite los símbolos: + % x k K M.` };
    }

    const label1Res = validateText(s.label1, `stats.${statKey}.label1`, 30);
    if (!label1Res.ok) return label1Res;

    const label2Res = validateText(s.label2, `stats.${statKey}.label2`, 30);
    if (!label2Res.ok) return label2Res;

    cleanStats[statKey] = {
      target: targetNum,
      prefix: prefixRes.value,
      suffix: suffixRes.value,
      label1: label1Res.value,
      label2: label2Res.value
    };
  }

  // --- GALLERY ---
  const rawGallery = input.gallery;
  if (!Array.isArray(rawGallery)) {
    return { ok: false, error: 'La sección gallery debe ser un arreglo de elementos.' };
  }
  if (rawGallery.length > 40) {
    return { ok: false, error: 'La galería no puede contener más de 40 elementos.' };
  }

  const cleanGallery = [];
  for (let i = 0; i < rawGallery.length; i++) {
    const item = rawGallery[i];
    if (!item || typeof item !== 'object') {
      return { ok: false, error: `El elemento ${i + 1} de la galería es inválido.` };
    }

    const id = String(item.id || '').trim();
    if (!ID_REGEX.test(id)) {
      return { ok: false, error: `El identificador '${id}' en la galería no tiene un formato válido (item-...).` };
    }

    const titleRes = validateText(item.title, `gallery[${i}].title`, 80);
    if (!titleRes.ok) return titleRes;

    const subtitleRes = validateText(item.subtitle, `gallery[${i}].subtitle`, 120, { optional: true });
    if (!subtitleRes.ok) return subtitleRes;

    const catNameRes = validateText(item.categoryName, `gallery[${i}].categoryName`, 60, { optional: true });
    if (!catNameRes.ok) return catNameRes;

    const badgeTextRes = validateText(item.badgeText, `gallery[${i}].badgeText`, 30, { optional: true });
    if (!badgeTextRes.ok) return badgeTextRes;

    const category = String(item.category || '').trim();
    if (!ALLOWED_CATEGORIES.has(category)) {
      return { ok: false, error: `La categoría '${category}' en gallery[${i}] no es válida.` };
    }

    const span = String(item.span || 'mural-standard').trim();
    if (!ALLOWED_SPANS.has(span)) {
      return { ok: false, error: `El formato visual '${span}' en gallery[${i}] no es válido.` };
    }

    const badgeIcon = String(item.badgeIcon || 'fa-camera').trim();
    if (!BADGE_ICON_REGEX.test(badgeIcon)) {
      return { ok: false, error: `El ícono '${badgeIcon}' en gallery[${i}] no tiene un formato FontAwesome válido.` };
    }

    if (typeof item.isReel !== 'boolean') {
      return { ok: false, error: `El campo isReel en gallery[${i}] debe ser un valor booleano.` };
    }

    const imgRes = validateGalleryImg(item.img, `gallery[${i}].img`);
    if (!imgRes.ok) return imgRes;

    const linkRes = validateInstagramUrl(item.link, `gallery[${i}].link`);
    if (!linkRes.ok) return linkRes;

    cleanGallery.push({
      id,
      title: titleRes.value,
      subtitle: subtitleRes.value,
      category,
      categoryName: catNameRes.value,
      img: imgRes.value,
      link: linkRes.value,
      badgeText: badgeTextRes.value,
      badgeIcon,
      isReel: item.isReel,
      span
    });
  }

  return {
    ok: true,
    value: {
      contact: cleanContact,
      hero: cleanHero,
      stats: cleanStats,
      gallery: cleanGallery
    }
  };
}
