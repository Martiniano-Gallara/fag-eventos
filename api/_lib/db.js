import { neon } from '@neondatabase/serverless';

let customSqlFactory = null;

export function setSqlFactory(factory) {
  customSqlFactory = factory;
}

export function getSql() {
  if (customSqlFactory) {
    return customSqlFactory();
  }

  const connectionUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.STORAGE_URL;

  if (!connectionUrl) {
    throw new Error('Database connection URL is not configured.');
  }

  return neon(connectionUrl);
}

let schemaReady = null;

export async function ensureSchema(sql) {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS fag_site_data (
          id INTEGER PRIMARY KEY DEFAULT 1,
          payload JSONB NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      await sql`
        ALTER TABLE fag_site_data ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS fag_site_data_history (
          id BIGSERIAL PRIMARY KEY,
          payload JSONB NOT NULL,
          version INTEGER NOT NULL,
          saved_at TIMESTAMPTZ DEFAULT NOW(),
          saved_ip TEXT
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS fag_admin_auth (
          id INTEGER PRIMARY KEY DEFAULT 1,
          password_hash TEXT NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS fag_login_attempts (
          ip TEXT PRIMARY KEY,
          attempts INTEGER NOT NULL DEFAULT 0,
          locked_until TIMESTAMPTZ,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }

  return schemaReady;
}
