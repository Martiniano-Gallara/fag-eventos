import crypto from 'node:crypto';
import { getSql, ensureSchema } from './_lib/db.js';
import { hashPassword, verifyPassword, createSessionToken, setSessionCookie, getClientIp } from './_lib/auth.js';

function getLockoutDurationMs(attempts) {
  if (attempts >= 8) return 15 * 60 * 1000;
  if (attempts >= 5) return 2 * 60 * 1000;
  if (attempts >= 3) return 30 * 1000;
  return 0;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }

  try {
    const sql = getSql();
    await ensureSchema(sql);

    const ip = getClientIp(req);

    // 1. Rate limiting en base de datos
    const attemptsRows = await sql`
      SELECT attempts, locked_until, EXTRACT(EPOCH FROM (locked_until - NOW())) AS seconds_remaining
      FROM fag_login_attempts
      WHERE ip = ${ip}
      LIMIT 1;
    `;

    const attemptRow = attemptsRows[0];
    if (attemptRow && attemptRow.locked_until) {
      const secondsLeft = Math.ceil(Number(attemptRow.seconds_remaining) || 0);
      if (secondsLeft > 0) {
        return res.status(429).json({
          error: 'Demasiados intentos fallidos. Intente nuevamente más tarde.',
          retryAfterSeconds: secondsLeft
        });
      }
    }

    // 2. Parsear body
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'JSON inválido.' });
      }
    }
    const { password } = body || {};
    const inputPassword = typeof password === 'string' ? password : '';

    // 3. Obtener credenciales de la base de datos
    const authRows = await sql`
      SELECT password_hash
      FROM fag_admin_auth
      WHERE id = 1
      LIMIT 1;
    `;

    let isAuthenticated = false;

    if (!authRows || authRows.length === 0) {
      // Bootstrap de primer acceso
      const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
      if (!initialPassword || initialPassword.length < 12) {
        console.error('CRITICAL: ADMIN_INITIAL_PASSWORD is not configured or is under 12 characters.');
        return res.status(500).json({ error: 'Error interno.' });
      }

      const inputBuf = Buffer.from(inputPassword);
      const initBuf = Buffer.from(initialPassword);
      const isInitialMatch =
        inputBuf.length === initBuf.length &&
        crypto.timingSafeEqual(inputBuf, initBuf);

      if (isInitialMatch) {
        const hashedPassword = await hashPassword(inputPassword);
        await sql`
          INSERT INTO fag_admin_auth (id, password_hash, updated_at)
          VALUES (1, ${hashedPassword}, NOW())
          ON CONFLICT (id) DO UPDATE
          SET password_hash = EXCLUDED.password_hash, updated_at = NOW();
        `;
        isAuthenticated = true;
      }
    } else {
      const storedHash = authRows[0].password_hash;
      isAuthenticated = await verifyPassword(inputPassword, storedHash);
    }

    // 4. Manejo de resultado
    if (!isAuthenticated) {
      const currentAttempts = (attemptRow ? attemptRow.attempts : 0) + 1;
      const lockoutMs = getLockoutDurationMs(currentAttempts);
      const lockedUntil = lockoutMs > 0 ? new Date(Date.now() + lockoutMs).toISOString() : null;

      await sql`
        INSERT INTO fag_login_attempts (ip, attempts, locked_until, updated_at)
        VALUES (${ip}, ${currentAttempts}, ${lockedUntil}, NOW())
        ON CONFLICT (ip) DO UPDATE
        SET attempts = EXCLUDED.attempts,
            locked_until = EXCLUDED.locked_until,
            updated_at = NOW();
      `;

      await new Promise((resolve) => setTimeout(resolve, 300));
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    // Éxito: limpiar intentos y emitir cookie de sesión
    await sql`DELETE FROM fag_login_attempts WHERE ip = ${ip};`;

    const token = createSessionToken();
    setSessionCookie(res, token);

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error en /api/login:', error);
    return res.status(500).json({ error: 'Error interno.' });
  }
}
