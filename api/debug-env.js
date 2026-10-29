import { getSql, ensureSchema } from './_lib/db.js';

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

  if (dbUrl) {
    try {
      const sql = getSql();
      await ensureSchema(sql);

      const authRows = await sql`SELECT count(*)::int as cnt FROM fag_admin_auth;`;
      adminAuthRowsCount = authRows?.[0]?.cnt ?? 0;

      const attemptRows = await sql`SELECT count(*)::int as cnt FROM fag_login_attempts;`;
      loginAttemptsCount = attemptRows?.[0]?.cnt ?? 0;

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
      loginAttemptsCount,
      dbError
    }
  };

  const allOk = report.SESSION_SECRET.ok && report.ADMIN_INITIAL_PASSWORD.ok && dbStatus === 'connected';

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    allOk,
    diagnostics: report
  });
}
