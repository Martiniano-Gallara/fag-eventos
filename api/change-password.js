import { getSql, ensureSchema } from './_lib/db.js';
import { requireSession, verifyPassword, hashPassword, clearSessionCookie } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }

  // 1. Requiere sesión activa
  if (!requireSession(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'JSON inválido.' });
      }
    }

    const { currentPassword, newPassword } = body || {};

    if (typeof currentPassword !== 'string' || !currentPassword) {
      return res.status(400).json({ error: 'La contraseña actual es requerida.' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 12) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 12 caracteres.' });
    }

    if (/[\x00-\x1F\x7F]/.test(newPassword)) {
      return res.status(400).json({ error: 'La nueva contraseña contiene caracteres no permitidos.' });
    }

    const sql = getSql();
    await ensureSchema(sql);

    // 2. Verificar la contraseña actual
    const rows = await sql`
      SELECT password_hash
      FROM fag_admin_auth
      WHERE id = 1
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return res.status(500).json({ error: 'Error interno.' });
    }

    const storedHash = rows[0].password_hash;
    const isValid = await verifyPassword(currentPassword, storedHash);

    if (!isValid) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    }

    // 3. Generar y guardar el nuevo hash
    const newHash = await hashPassword(newPassword);

    await sql`
      UPDATE fag_admin_auth
      SET password_hash = ${newHash},
          updated_at = NOW()
      WHERE id = 1;
    `;

    // 4. Invalidar sesión actual para obligar a reautenticarse
    clearSessionCookie(res);

    return res.status(200).json({
      status: 'success',
      message: 'Contraseña actualizada correctamente. Iniciá sesión con la nueva credencial.'
    });
  } catch (error) {
    console.error('Error en /api/change-password:', error);
    return res.status(500).json({ error: 'Error interno.' });
  }
}
