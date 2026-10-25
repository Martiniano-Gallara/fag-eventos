import { hashPassword, createSessionToken, setSessionCookie, verifySessionToken } from '../api/_lib/auth.js';
import dataHandler from '../api/data.js';
import loginHandler from '../api/login.js';
import logoutHandler from '../api/logout.js';
import sessionHandler from '../api/session.js';
import changePasswordHandler from '../api/change-password.js';
import * as dbModule from '../api/_lib/db.js';

process.env.SESSION_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.ADMIN_INITIAL_PASSWORD = 'BootstrapPassword123!';

// Simple mock in-memory database simulating Neon tagged template queries
class MockNeonDb {
  constructor() {
    this.siteData = null;
    this.history = [];
    this.adminAuth = null;
    this.loginAttempts = new Map();
  }

  getSql() {
    const self = this;
    const sql = async (strings, ...values) => {
      const query = strings.reduce((acc, str, i) => acc + str + (values[i] !== undefined ? `$${i + 1}` : ''), '').trim();

      // DDL queries: CREATE TABLE, ALTER TABLE
      if (query.startsWith('CREATE TABLE') || query.startsWith('ALTER TABLE')) {
        return [];
      }

      // SELECT from fag_login_attempts
      if (query.includes('FROM fag_login_attempts')) {
        const ip = values[0];
        const record = self.loginAttempts.get(ip);
        if (!record) return [];
        let secondsRemaining = 0;
        if (record.locked_until) {
          secondsRemaining = Math.max(0, (new Date(record.locked_until).getTime() - Date.now()) / 1000);
        }
        return [{
          attempts: record.attempts,
          locked_until: record.locked_until,
          seconds_remaining: secondsRemaining
        }];
      }

      // INSERT / UPDATE fag_login_attempts
      if (query.includes('INSERT INTO fag_login_attempts')) {
        const [ip, attempts, locked_until] = values;
        self.loginAttempts.set(ip, {
          attempts,
          locked_until
        });
        return [];
      }

      // DELETE FROM fag_login_attempts
      if (query.includes('DELETE FROM fag_login_attempts')) {
        const ip = values[0];
        self.loginAttempts.delete(ip);
        return [];
      }

      // SELECT from fag_admin_auth
      if (query.includes('FROM fag_admin_auth')) {
        if (!self.adminAuth) return [];
        return [{ password_hash: self.adminAuth.password_hash }];
      }

      // INSERT into fag_admin_auth
      if (query.includes('INSERT INTO fag_admin_auth')) {
        const password_hash = values[0];
        self.adminAuth = { password_hash };
        return [];
      }

      // UPDATE fag_admin_auth
      if (query.includes('UPDATE fag_admin_auth')) {
        const password_hash = values[0];
        self.adminAuth = { password_hash };
        return [];
      }

      // SELECT from fag_site_data
      if (query.includes('SELECT payload, version, updated_at FROM fag_site_data')) {
        if (!self.siteData) return [];
        return [{
          payload: self.siteData.payload,
          version: self.siteData.version,
          updated_at: self.siteData.updated_at
        }];
      }

      if (query.includes('SELECT id FROM fag_site_data')) {
        if (!self.siteData) return [];
        return [{ id: 1 }];
      }

      // UPDATE fag_site_data (Optimistic locking)
      if (query.includes('UPDATE fag_site_data')) {
        const [payloadJson, baseVer] = values;
        if (!self.siteData || self.siteData.version !== Number(baseVer)) {
          return [];
        }
        self.siteData.payload = JSON.parse(payloadJson);
        self.siteData.version += 1;
        self.siteData.updated_at = new Date().toISOString();
        return [{ version: self.siteData.version }];
      }

      // INSERT INTO fag_site_data
      if (query.includes('INSERT INTO fag_site_data')) {
        const payloadJson = values[0];
        self.siteData = {
          payload: JSON.parse(payloadJson),
          version: 1,
          updated_at: new Date().toISOString()
        };
        return [{ version: 1 }];
      }

      // INSERT INTO fag_site_data_history
      if (query.includes('INSERT INTO fag_site_data_history')) {
        const [payloadJson, version, ip] = values;
        self.history.push({
          id: self.history.length + 1,
          payload: JSON.parse(payloadJson),
          version,
          saved_ip: ip
        });
        return [];
      }

      // DELETE FROM fag_site_data_history
      if (query.includes('DELETE FROM fag_site_data_history')) {
        if (self.history.length > 50) {
          self.history = self.history.slice(-50);
        }
        return [];
      }

      return [];
    };

    return sql;
  }
}

function createMockReqRes({ method = 'GET', headers = {}, body = null, ip = '127.0.0.1' } = {}) {
  const req = {
    method,
    headers: { ...headers },
    body,
    socket: { remoteAddress: ip }
  };
  let statusCode = 200;
  const resHeaders = {};
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    setHeader(key, value) {
      resHeaders[key.toLowerCase()] = value;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    end() {
      return res;
    },
    get statusCode() { return statusCode; },
    get headers() { return resHeaders; },
    get body() { return responseData; }
  };

  return { req, res };
}

async function runTests() {
  console.log('--- STARTING VERIFICATION TESTS ---');

  const mockDb = new MockNeonDb();
  dbModule.setSqlFactory(() => mockDb.getSql());

  // Baseline valid payload
  const samplePayload = {
    contact: {
      whatsapp: "5493517580045",
      whatsappDisplay: "+54 9 351 758-0045",
      whatsappMessage: "Hola",
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
        id: "item-1",
        title: "Grandes Conciertos",
        subtitle: "Estadios",
        category: "festivales videos",
        categoryName: "Conciertos",
        img: "assets/gallery/mural-lead-singer.webp",
        link: "https://www.instagram.com/fag.eventos/",
        badgeText: "Mega Show",
        badgeIcon: "fa-microphone",
        isReel: false,
        span: "mural-hero"
      }
    ]
  };

  // Test 4: POST /api/data sin cookie -> 401
  {
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { payload: samplePayload, baseVersion: 0 }
    });
    await dataHandler(req, res);
    console.log(`Test 4 - POST /api/data without cookie -> status: ${res.statusCode} (expected 401)`);
    if (res.statusCode !== 401) throw new Error('Test 4 failed');
  }

  // Create valid session token for subsequent tests
  const sessionToken = createSessionToken();
  const authHeaders = {
    'content-type': 'application/json',
    cookie: `fag_admin=${sessionToken}`
  };

  // Test 5: POST /api/data con sesión y hero.titleLine1 = "<img src=x onerror=alert(1)>" -> 400
  {
    const badPayload = JSON.parse(JSON.stringify(samplePayload));
    badPayload.hero.titleLine1 = "<img src=x onerror=alert(1)>";
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: authHeaders,
      body: { payload: badPayload, baseVersion: 0 }
    });
    await dataHandler(req, res);
    console.log(`Test 5 - POST with XSS in hero -> status: ${res.statusCode} (expected 400), error: ${res.body?.error}`);
    if (res.statusCode !== 400) throw new Error('Test 5 failed');
  }

  // Test 6: POST /api/data con sesión y gallery[0].link = "javascript:alert(1)" -> 400
  {
    const badPayload = JSON.parse(JSON.stringify(samplePayload));
    badPayload.gallery[0].link = "javascript:alert(1)";
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: authHeaders,
      body: { payload: badPayload, baseVersion: 0 }
    });
    await dataHandler(req, res);
    console.log(`Test 6 - POST with javascript: in gallery link -> status: ${res.statusCode} (expected 400), error: ${res.body?.error}`);
    if (res.statusCode !== 400) throw new Error('Test 6 failed');
  }

  // Test 7: Dos publicaciones con el mismo baseVersion -> la segunda devuelve 409
  {
    // First publication (inserts initial version 1)
    const { req: req1, res: res1 } = createMockReqRes({
      method: 'POST',
      headers: authHeaders,
      body: { payload: samplePayload, baseVersion: 0 }
    });
    await dataHandler(req1, res1);
    console.log(`Test 7a - First publish baseVersion 0 -> status: ${res1.statusCode}, version: ${res1.body?.version}`);

    // Second publication with same baseVersion 0 (now current version is 1, so mismatch!)
    const { req: req2, res: res2 } = createMockReqRes({
      method: 'POST',
      headers: authHeaders,
      body: { payload: samplePayload, baseVersion: 0 }
    });
    await dataHandler(req2, res2);
    console.log(`Test 7b - Second publish with stale baseVersion 0 -> status: ${res2.statusCode} (expected 409), error: ${res2.body?.error}`);
    if (res2.statusCode !== 409) throw new Error('Test 7 failed');
  }

  // Test 8: Cuatro logins fallidos seguidos desde la misma IP -> el cuarto devuelve 429 con retryAfterSeconds
  {
    const testIp = '198.51.100.42';
    // Attempts 1, 2, 3 fail with 401
    for (let i = 1; i <= 3; i++) {
      const { req, res } = createMockReqRes({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: { password: 'wrongpassword' },
        ip: testIp
      });
      await loginHandler(req, res);
      console.log(`Test 8 - Failed login attempt ${i} -> status: ${res.statusCode} (expected 401)`);
      if (res.statusCode !== 401) throw new Error(`Test 8 attempt ${i} failed`);
    }

    // 4th attempt should be blocked by rate limit
    const { req: req4, res: res4 } = createMockReqRes({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { password: 'wrongpassword' },
      ip: testIp
    });
    await loginHandler(req4, res4);
    console.log(`Test 8 - 4th login attempt -> status: ${res4.statusCode} (expected 429), retryAfterSeconds: ${res4.body?.retryAfterSeconds}`);
    if (res4.statusCode !== 429 || typeof res4.body?.retryAfterSeconds !== 'number') {
      throw new Error('Test 8 failed');
    }
  }

  // Test 9: GET /api/data no incluye security ni ningún hash, e incluye version
  {
    const { req, res } = createMockReqRes({ method: 'GET' });
    await dataHandler(req, res);
    console.log(`Test 9 - GET /api/data -> status: ${res.statusCode}, version: ${res.body?.version}`);
    const bodyStr = JSON.stringify(res.body);
    const hasSecurity = bodyStr.includes('security') || bodyStr.includes('pinHash') || bodyStr.includes('password');
    console.log(`Test 9 - Does body contain security/pin/hash? ${hasSecurity} (expected false)`);
    if (res.statusCode !== 200 || hasSecurity || typeof res.body?.version !== 'number') {
      throw new Error('Test 9 failed');
    }
  }

  // Test 12: Cambiar la contraseña en "Seguridad" -> la sesión se cierra; la contraseña vieja da 401 y la nueva funciona
  {
    const loginIp = '203.0.113.10';
    // Bootstrap initial login with ADMIN_INITIAL_PASSWORD
    const { req: reqBoot, res: resBoot } = createMockReqRes({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { password: 'BootstrapPassword123!' },
      ip: loginIp
    });
    await loginHandler(reqBoot, resBoot);
    console.log(`Test 12a - Bootstrap login -> status: ${resBoot.statusCode} (expected 200)`);
    const cookieHeader = resBoot.headers['set-cookie'];
    const tokenMatch = cookieHeader?.match(/fag_admin=([^;]+)/);
    const activeToken = tokenMatch ? tokenMatch[1] : null;

    // Change password to new password
    const newPass = 'MyNewSecurePassword2026!';
    const { req: reqChange, res: resChange } = createMockReqRes({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `fag_admin=${activeToken}`
      },
      body: {
        currentPassword: 'BootstrapPassword123!',
        newPassword: newPass
      }
    });
    await changePasswordHandler(reqChange, resChange);
    console.log(`Test 12b - Change password -> status: ${resChange.statusCode} (expected 200)`);
    const changeCookie = resChange.headers['set-cookie'];
    const isCookieCleared = changeCookie && changeCookie.includes('Max-Age=0');
    console.log(`Test 12c - Session cookie cleared on password change? ${Boolean(isCookieCleared)} (expected true)`);

    // Verify old password gives 401
    const { req: reqOld, res: resOld } = createMockReqRes({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { password: 'BootstrapPassword123!' },
      ip: loginIp
    });
    await loginHandler(reqOld, resOld);
    console.log(`Test 12d - Old password login -> status: ${resOld.statusCode} (expected 401)`);

    // Verify new password works
    const { req: reqNew, res: resNew } = createMockReqRes({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { password: newPass },
      ip: loginIp
    });
    await loginHandler(reqNew, resNew);
    console.log(`Test 12e - New password login -> status: ${resNew.statusCode} (expected 200)`);
    if (resOld.statusCode !== 401 || resNew.statusCode !== 200) {
      throw new Error('Test 12 failed');
    }
  }

  // Test 13: Responder la API con un error forzado -> respuesta es { "error": "Error interno." } sin detalles
  {
    // Force DB error by throwing in getSql
    dbModule.setSqlFactory(() => {
      throw new Error('FATAL: Connection to postgres://secret_admin:p4ssw0rd@neon.internal failed!');
    });
    const { req, res } = createMockReqRes({ method: 'GET' });
    await dataHandler(req, res);
    console.log(`Test 13 - Forced error response -> status: ${res.statusCode} (expected 500), body:`, JSON.stringify(res.body));
    const leaked = JSON.stringify(res.body).includes('secret_admin') || JSON.stringify(res.body).includes('postgres://');
    if (res.statusCode !== 500 || res.body?.error !== 'Error interno.' || leaked) {
      throw new Error('Test 13 failed');
    }
  }

  console.log('--- ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! ---');
}

runTests().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
