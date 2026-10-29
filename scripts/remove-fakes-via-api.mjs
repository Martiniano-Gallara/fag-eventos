#!/usr/bin/env node
/**
 * scripts/remove-fakes-via-api.mjs
 *
 * Elimina los 4 ítems de stock/falsos de la base de datos de producción
 * dejando únicamente los 8 trabajos reales verificados de FAG Eventos.
 */

const BASE_URL = process.env.BASE_URL || 'https://www.fageventos.com';
const password = process.argv[2] || 'AdminFAG2026';

const FAKE_IDS = new Set(['item-1', 'item-3', 'item-5', 'item-6']);

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

  const setCookie = loginRes.headers.get('set-cookie');
  if (!setCookie) {
    console.error('❌ No se recibió encabezado Set-Cookie.');
    process.exit(1);
  }

  const cookieMatch = setCookie.match(/fag_admin=[^;]+/);
  if (!cookieMatch) {
    console.error('❌ No se encontró la cookie fag_admin.');
    process.exit(1);
  }
  const sessionCookie = cookieMatch[0];
  console.log('✅ Sesión iniciada correctamente.');

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
    console.error('❌ Payload inválido.');
    process.exit(1);
  }

  console.log(`ℹ️  Versión en DB: ${currentVersion}. Total ítems: ${payload.gallery.length}`);

  const filteredGallery = payload.gallery.filter(item => !FAKE_IDS.has(item.id));
  console.log(`ℹ️  Ítems reales restantes: ${filteredGallery.length}`);

  filteredGallery.forEach((item, idx) => {
    console.log(`   [${idx + 1}] ${item.id}: "${item.title}" (${item.img})`);
  });

  if (filteredGallery.length === payload.gallery.length) {
    console.log('✅ La galería ya contenía solo ítems reales. No se requieren cambios.');
    return;
  }

  console.log(`📤 3. Publicando nuevo payload en ${BASE_URL}/api/data (baseVersion: ${currentVersion})...`);
  const newPayload = { ...payload, gallery: filteredGallery };

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
    console.error(`❌ Error al actualizar /api/data (${updateRes.status}):`, errText);
    process.exit(1);
  }

  const updateJson = await updateRes.json();
  console.log(`🎉 ¡Éxito! Nueva versión publicada en la base de datos: ${updateJson.version}`);
  console.log(`   Total de ítems reales en producción: ${filteredGallery.length}`);
}

main().catch(err => {
  console.error('❌ Error inesperado:', err);
  process.exit(1);
});
