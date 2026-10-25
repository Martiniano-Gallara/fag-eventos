import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(crypto.scrypt);

export async function hashPassword(plain) {
  if (typeof plain !== 'string' || !plain) {
    throw new Error('Invalid password input');
  }
  const salt = crypto.randomBytes(16);
  const derivedKey = await scryptAsync(plain, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024
  });
  return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(plain, stored) {
  if (typeof plain !== 'string' || typeof stored !== 'string') {
    return false;
  }
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }
  const saltHex = parts[1];
  const hashHex = parts[2];
  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expectedHash = Buffer.from(hashHex, 'hex');
    const derivedKey = await scryptAsync(plain, salt, expectedHash.length, {
      N: 16384,
      r: 8,
      p: 1,
      maxmem: 32 * 1024 * 1024
    });
    if (derivedKey.length !== expectedHash.length) {
      return false;
    }
    return crypto.timingSafeEqual(derivedKey, expectedHash);
  } catch {
    return false;
  }
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET is missing or less than 32 characters');
  }
  return secret;
}

export function createSessionToken() {
  const secret = getSessionSecret();
  const payload = {
    exp: Date.now() + 8 * 60 * 60 * 1000,
    nonce: crypto.randomBytes(16).toString('hex')
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signatureB64 = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signatureB64}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }
  let secret;
  try {
    secret = getSessionSecret();
  } catch {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return false;
  }
  const [payloadB64, signatureB64] = parts;
  try {
    const expectedSignatureB64 = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    const sigBuf = Buffer.from(signatureB64);
    const expSigBuf = Buffer.from(expectedSignatureB64);
    if (sigBuf.length !== expSigBuf.length) {
      return false;
    }
    if (!crypto.timingSafeEqual(sigBuf, expSigBuf)) {
      return false;
    }

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);
    if (!payload || typeof payload.exp !== 'number' || Date.now() > payload.exp) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function setSessionCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `fag_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`
  );
}

export function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    'fag_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
  );
}

export function requireSession(req) {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return false;
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const prefix = 'fag_admin=';
  const match = cookies.find((c) => c.startsWith(prefix));
  if (!match) return false;
  const token = match.slice(prefix.length);
  return verifySessionToken(token);
}

export function getClientIp(req) {
  const xForwardedFor = req.headers?.['x-forwarded-for'];
  if (xForwardedFor) {
    const ips = (Array.isArray(xForwardedFor) ? xForwardedFor.join(',') : xForwardedFor).split(',');
    if (ips[0]) return ips[0].trim();
  }
  const xRealIp = req.headers?.['x-real-ip'];
  if (xRealIp) {
    return (Array.isArray(xRealIp) ? xRealIp[0] : xRealIp).trim();
  }
  const remoteAddr = req.socket?.remoteAddress;
  if (remoteAddr) return remoteAddr;
  return 'unknown';
}
