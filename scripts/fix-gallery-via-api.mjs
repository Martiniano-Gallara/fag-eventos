#!/usr/bin/env node
/**
 * scripts/fix-gallery-via-api.mjs
 *
 * Actualiza la galería de producción a través de la API oficial:
 * 1. Hace login como admin con la contraseña provista.
 * 2. Obtiene los datos actuales de /api/data.
 * 3. Corrige las rutas assets/gallery/*.jpg y *.png a *.webp.
 * 4. Publica el nuevo payload con control de concurrencia optimista.
 * 5. Verifica que las 12 imágenes devuelvan HTTP 200 en producción.
 *
 * Uso:
 *   node scripts/fix-gallery-via-api.mjs "<admin_password>"
 */

const BASE_URL = process.env.BASE_URL || 'https://fag-eventos.vercel.app';
const password = process.argv[2] || process.env.ADMIN_PASSWORD;

if (!password) {
  console.error('❌ Falta la contraseña de admin.');
  console.error('   Uso: node scripts/fix-gallery-via-api.mjs "<contraseña_admin>"');
  process.exit(1);
}

async function main() {
  console.log(`🔐 1. Iniciando sesión en ${BASE_URL}/api/login...`);

  const loginRes = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });

  if (!loginRes.ok) {
    const errorBody = await loginRes.text();
    console.error(`❌ Error en login (${loginRes.status}):`, errorBody);
    process.exit(1);
  }

  // Extraer cookie de sesión
  const setCookie = loginRes.headers.get('set-cookie');
  if (!setCookie) {
    console.error('❌ No se recibió encabezado Set-Cookie en la respuesta de login.');
    process.exit(1);
  }

  const cookieMatch = setCookie.match(/fag_admin=[^;]+/);
  if (!cookieMatch) {
    console.error('❌ No se encontró la cookie fag_admin en Set-Cookie.');
    process.exit(1);
  }
  const sessionCookie = cookieMatch[0];
  console.log('✅ Sesión iniciada correctamente.');

  // Obtener datos actuales
  console.log(`📥 2. Obteniendo datos actuales de ${BASE_URL}/api/data...`);
  const dataRes = await fetch(`${BASE_URL}/api/data`, {
    headers: { 'Cache-Control': 'no-cache' }
  });

  if (!dataRes.ok) {
    console.error(`❌ Error al obtener /api/data (${dataRes.status})`);
    process.exit(1);
  }

  const dataJson = await dataRes.json();
  const currentVersion = dataJson.version;
  const payload = dataJson.data;

  if (!payload || !Array.isArray(payload.gallery)) {
    console.error('❌ Payload inválido o sin galería.');
    process.exit(1);
  }

  console.log(`ℹ️  Versión actual: ${currentVersion}. Galería con ${payload.gallery.length} items.`);

  let changedCount = 0;
  const updatedGallery = payload.gallery.map((item) => {
    const oldImg = item.img || '';
    if (/^assets\/gallery\/.*(\.jpg|\.png|\.jpeg)$/i.test(oldImg)) {
      const newImg = oldImg.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      console.log(`   ✏️  ${oldImg}  ->  ${newImg}`);
      changedCount++;
      return { ...item, img: newImg };
    }
    return item;
  });

  if (changedCount === 0) {
    console.log('ℹ️  Todas las imágenes ya tienen extensión .webp. No se requieren cambios.');
  } else {
    console.log(`📤 3. Publicando nuevo payload (${changedCount} imágenes corregidas)...`);
    const newPayload = { ...payload, gallery: updatedGallery };

    const updateRes = await fetch(`${BASE_URL}/api/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        payload: newPayload,
        baseVersion: currentVersion
      })
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error(`❌ Error al guardar datos (${updateRes.status}):`, errText);
      process.exit(1);
    }

    const updateJson = await updateRes.json();
    console.log(`✅ Datos publicados exitosamente. Nueva versión en DB: ${updateJson.version}`);
  }

  // 4. Verificación de las imágenes en vivo
  console.log('\n🔎 4. Verificando disponibilidad de las 12 imágenes en producción...');
  let failed = 0;
  for (const item of updatedGallery) {
    const imgUrl = `${BASE_URL}/${item.img}`;
    const checkRes = await fetch(imgUrl, { method: 'HEAD' });
    if (checkRes.ok) {
      console.log(`   ✅ 200 OK: ${item.img}`);
    } else {
      console.log(`   ❌ ${checkRes.status}: ${item.img}`);
      failed++;
    }
  }

  if (failed === 0) {
    console.log('\n🎉 ¡ÉXITO TOTAL! Todas las imágenes de la galería están en .webp y responden 200 OK.');
  } else {
    console.warn(`\n⚠️  Atención: ${failed} imagen(es) no devolvieron 200 OK.`);
  }
}

main().catch((err) => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
