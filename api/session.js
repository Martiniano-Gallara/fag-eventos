import { requireSession } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }

  res.setHeader('Cache-Control', 'no-store');

  try {
    const authenticated = requireSession(req);
    return res.status(200).json({ authenticated });
  } catch (error) {
    console.error('Error en /api/session:', error);
    return res.status(500).json({ error: 'Error interno.' });
  }
}
