import { getSql, ensureSchema } from './_lib/db.js';
import { requireSession, getClientIp } from './_lib/auth.js';
import { validatePayload } from './_lib/validate.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const sql = getSql();
      await ensureSchema(sql);

      const rows = await sql`
        SELECT payload, version, updated_at
        FROM fag_site_data
        WHERE id = 1
        LIMIT 1;
      `;

      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

      if (!rows || rows.length === 0) {
        return res.status(200).json({
          status: 'empty',
          data: null,
          version: 0,
          updated_at: null
        });
      }

      const row = rows[0];
      const valid = validatePayload(row.payload);

      return res.status(200).json({
        status: 'success',
        data: valid.ok ? valid.value : null,
        version: row.version || 1,
        updated_at: row.updated_at
      });
    }

    if (req.method === 'POST') {
      // 1. Verificar sesión activa
      if (!requireSession(req)) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      // 2. Verificar Content-Type y tamaño máximo del cuerpo (<= 100 KB)
      const contentType = req.headers?.['content-type'] || '';
      if (!contentType.toLowerCase().includes('application/json')) {
        return res.status(400).json({ error: 'El encabezado Content-Type debe ser application/json.' });
      }

      let body = req.body;
      if (typeof body === 'string') {
        if (Buffer.byteLength(body, 'utf8') > 100 * 1024) {
          return res.status(400).json({ error: 'El tamaño de la solicitud excede los 100 KB.' });
        }
        try {
          body = JSON.parse(body);
        } catch {
          return res.status(400).json({ error: 'Formato JSON inválido.' });
        }
      } else if (body && typeof body === 'object') {
        const serialized = JSON.stringify(body);
        if (Buffer.byteLength(serialized, 'utf8') > 100 * 1024) {
          return res.status(400).json({ error: 'El tamaño de la solicitud excede los 100 KB.' });
        }
      } else {
        return res.status(400).json({ error: 'Cuerpo de solicitud inválido.' });
      }

      // 3. Validar payload esperado
      const { payload, baseVersion } = body || {};
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'El campo payload es obligatorio.' });
      }

      const valid = validatePayload(payload);
      if (!valid.ok) {
        return res.status(400).json({ error: valid.error });
      }

      const sql = getSql();
      await ensureSchema(sql);

      // 4. Control de concurrencia optimista
      const baseVer = (baseVersion === undefined || baseVersion === null || baseVersion === 0) ? 0 : Number(baseVersion);

      const updated = await sql`
        UPDATE fag_site_data
        SET payload = ${JSON.stringify(valid.value)},
            version = version + 1,
            updated_at = NOW()
        WHERE id = 1 AND version = ${baseVer}
        RETURNING version;
      `;

      let newVersion;
      if (updated && updated.length > 0) {
        newVersion = updated[0].version;
      } else {
        const existing = await sql`SELECT id FROM fag_site_data WHERE id = 1 LIMIT 1;`;
        if (existing.length === 0 && baseVer === 0) {
          const inserted = await sql`
            INSERT INTO fag_site_data (id, payload, version, updated_at)
            VALUES (1, ${JSON.stringify(valid.value)}, 1, NOW())
            RETURNING version;
          `;
          newVersion = inserted[0].version;
        } else {
          return res.status(409).json({
            error: 'El contenido fue modificado desde otra sesión. Recargá antes de guardar.'
          });
        }
      }

      // 5. Historial: conservar solo las últimas 50 versiones
      const ip = getClientIp(req);
      await sql`
        INSERT INTO fag_site_data_history (payload, version, saved_at, saved_ip)
        VALUES (${JSON.stringify(valid.value)}, ${newVersion}, NOW(), ${ip});
      `;
      await sql`
        DELETE FROM fag_site_data_history
        WHERE id NOT IN (
          SELECT id FROM fag_site_data_history
          ORDER BY id DESC
          LIMIT 50
        );
      `;

      // 6. Éxito
      return res.status(200).json({ status: 'success', version: newVersion });
    }

    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  } catch (error) {
    console.error('Error en /api/data:', error);
    return res.status(500).json({ error: 'Error interno.' });
  }
}
