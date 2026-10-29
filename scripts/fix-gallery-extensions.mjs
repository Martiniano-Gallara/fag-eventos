#!/usr/bin/env node
/**
 * fix-gallery-extensions.mjs
 *
 * Corrige las extensiones de imagen en la DB de Neon:
 *   assets/gallery/*.jpg  →  assets/gallery/*.webp
 *   assets/gallery/*.png  →  assets/gallery/*.webp
 *
 * Uso:
 *   DATABASE_URL="postgresql://..." node scripts/fix-gallery-extensions.mjs
 *
 * El script es idempotente: si los datos ya están en .webp no hace nada.
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.STORAGE_URL;

if (!DATABASE_URL) {
  console.error('❌  Falta la variable de entorno DATABASE_URL (o POSTGRES_URL / STORAGE_URL).');
  console.error('    Ejemplo: DATABASE_URL="postgresql://..." node scripts/fix-gallery-extensions.mjs');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  console.log('🔍  Leyendo datos actuales de fag_site_data...');

  const rows = await sql`
    SELECT payload, version
    FROM fag_site_data
    WHERE id = 1
    LIMIT 1;
  `;

  if (!rows || rows.length === 0) {
    console.log('ℹ️   Tabla vacía — no hay nada que corregir.');
    return;
  }

  const { payload, version } = rows[0];
  const gallery = payload?.gallery;

  if (!Array.isArray(gallery)) {
    console.log('ℹ️   No se encontró el array gallery en el payload — nada que corregir.');
    return;
  }

  let changed = 0;
  const fixedGallery = gallery.map((item) => {
    const original = item.img || '';
    // Solo corregir imágenes que apunten a assets/gallery/
    if (!/^assets\/gallery\//i.test(original)) return item;

    const fixed = original
      .replace(/\.jpg(\?.*)?$/i, '.webp$1')
      .replace(/\.jpeg(\?.*)?$/i, '.webp$1')
      .replace(/\.png(\?.*)?$/i, '.webp$1');

    if (fixed !== original) {
      changed++;
      console.log(`  ✏️   ${original}  →  ${fixed}`);
      return { ...item, img: fixed };
    }
    return item;
  });

  if (changed === 0) {
    console.log('✅  Todas las imágenes ya tienen extensión .webp — nada que corregir.');
    return;
  }

  console.log(`\n🔧  Corrigiendo ${changed} imagen(es)...`);

  const newPayload = { ...payload, gallery: fixedGallery };

  const result = await sql`
    UPDATE fag_site_data
    SET
      payload = ${JSON.stringify(newPayload)}::jsonb,
      version = version + 1,
      updated_at = NOW()
    WHERE id = 1
      AND version = ${version}
    RETURNING version;
  `;

  if (!result || result.length === 0) {
    console.error('❌  La actualización falló por un conflicto de versión (otro proceso la modificó).');
    console.error('    Volvé a ejecutar el script.');
    process.exit(1);
  }

  console.log(`\n✅  Listo. DB actualizada a versión ${result[0].version}.`);
  console.log('    ${changed} imagen(es) corregidas de .jpg/.png a .webp.');
}

main().catch((err) => {
  console.error('❌  Error inesperado:', err.message);
  process.exit(1);
});
