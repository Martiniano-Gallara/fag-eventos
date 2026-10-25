import { clearSessionCookie } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }

  try {
    clearSessionCookie(res);
    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error en /api/logout:', error);
    return res.status(500).json({ error: 'Error interno.' });
  }
}
