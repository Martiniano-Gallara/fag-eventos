import { getSql, ensureSchema } from './_lib/db.js';
import { verifyPassword } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionSecret = process.env.SESSION_SECRET;
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.STORAGE_URL;

  let dbStatus = 'not checked';
  let adminAuthRowsCount = null;
  let loginAttemptsCount = null;
  let dbError = null;
  let testQueryError = null;
  let testVerifyResult = null;

  if (dbUrl) {
    try {
      const sql = getSql();
      await ensureSchema(sql);

      const authRows = await sql`SELECT password_hash FROM fag_admin_auth WHERE id = 1;`;
      adminAuthRowsCount = authRows?.length ?? 0;

      if (adminAuthRowsCount > 0) {
        testVerifyResult = await verifyPassword('wrongpassword', authRows[0].password_hash);
      }

      // Probar la consulta exacta de fag_login_attempts
      try {
        const testIp = 'debug-probe-ip';
        const currentAttempts = 1;
        const lockedUntil = null;
        await sql`
          INSERT INTO fag_login_attempts (ip, attempts, locked_until, updated_at)
          VALUES (${testIp}, ${currentAttempts}, ${lockedUntil}, NOW())
          ON CONFLICT (ip) DO UPDATE
          SET attempts = EXCLUDED.attempts,
              locked_until = EXCLUDED.locked_until,
              updated_at = NOW();
        `;
        await sql`DELETE FROM fag_login_attempts WHERE ip = ${testIp};`;
      } catch (errQ) {
        testQueryError = errQ.message;
      }

      dbStatus = 'connected';
    } catch (err) {
      dbStatus = 'error';
      dbError = err.message;
    }
  }

  const report = {
    SESSION_SECRET: {
      present: !!sessionSecret,
      length: sessionSecret ? sessionSecret.length : 0,
      ok: Boolean(sessionSecret && sessionSecret.length >= 32)
    },
    ADMIN_INITIAL_PASSWORD: {
      present: !!adminPassword,
      length: adminPassword ? adminPassword.length : 0,
      ok: Boolean(adminPassword && adminPassword.length >= 12)
    },
    DATABASE: {
      present: !!dbUrl,
      status: dbStatus,
      adminAuthRowsCount,
      dbError,
      testQueryError,
      testVerifyResult
    }
  };

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    diagnostics: report
  });
}
