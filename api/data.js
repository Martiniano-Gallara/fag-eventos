import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Configuración de encabezados CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Vercel y Neon inyectan STORAGE_URL, DATABASE_URL o POSTGRES_URL automáticamente
  const databaseUrl = 
    process.env.STORAGE_URL || 
    process.env.DATABASE_URL || 
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;

  if (!databaseUrl) {
    return res.status(500).json({
      error: 'DATABASE_URL no está configurada en las variables de entorno de Vercel.',
      hint: 'Asegúrate de vincular la base de datos Neon desde la pestaña Storage del proyecto en Vercel.'
    });
  }

  const sql = neon(databaseUrl);

  try {
    // Inicialización automática de la tabla si aún no existe
    await sql`
      CREATE TABLE IF NOT EXISTS fag_site_data (
        id INTEGER PRIMARY KEY DEFAULT 1,
        payload JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 1. OBTENER DATOS (GET)
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT payload, updated_at 
        FROM fag_site_data 
        WHERE id = 1 
        LIMIT 1;
      `;

      if (!rows || rows.length === 0) {
        return res.status(200).json({
          status: 'empty',
          data: null,
          message: 'Base de datos conectada correctamente. No hay registros previos.'
        });
      }

      return res.status(200).json({
        status: 'success',
        data: rows[0].payload,
        updated_at: rows[0].updated_at
      });
    }

    // 2. GUARDAR / ACTUALIZAR DATOS (POST)
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { payload, pin } = body || {};

      // Validación del PIN maestro (desde variable de entorno o por defecto 'fag2026')
      const masterPin = process.env.ADMIN_MASTER_PIN || 'fag2026';
      if (!pin || String(pin).trim() !== String(masterPin).trim()) {
        return res.status(401).json({
          status: 'error',
          error: 'PIN de seguridad no válido o no autorizado.'
        });
      }

      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({
          status: 'error',
          error: 'El cuerpo de la solicitud no contiene un payload válido.'
        });
      }

      // Upsert: si existe el id 1 lo actualiza, si no lo inserta
      await sql`
        INSERT INTO fag_site_data (id, payload, updated_at)
        VALUES (1, ${JSON.stringify(payload)}, NOW())
        ON CONFLICT (id) DO UPDATE
        SET payload = EXCLUDED.payload,
            updated_at = NOW();
      `;

      return res.status(200).json({
        status: 'success',
        message: 'Datos de FAG Eventos sincronizados exitosamente en Neon.'
      });
    }

    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  } catch (error) {
    console.error('Error en /api/data:', error);
    return res.status(500).json({
      status: 'error',
      error: error.message || 'Error interno al comunicarse con Neon.'
    });
  }
}
