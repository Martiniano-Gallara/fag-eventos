/**
 * FAG EVENTOS - ENDPOINT RECEPTOR DE REPORTES CSP
 * Recibe y registra violaciones de Content Security Policy enviadas por navegadores.
 */

export default async function handler(req, res) {
  // CSP reports are always sent via POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }

  try {
    let reportData = req.body;

    if (typeof reportData === 'string') {
      try {
        reportData = JSON.parse(reportData);
      } catch {
        reportData = { raw: reportData };
      }
    }

    const cspReport = reportData?.['csp-report'] || reportData;

    // Log structured violation for observability in Vercel logs
    console.warn('[CSP-VIOLATION]', JSON.stringify({
      timestamp: new Date().toISOString(),
      documentUri: cspReport?.['document-uri'] || cspReport?.documentURL || 'unknown',
      violatedDirective: cspReport?.['violated-directive'] || cspReport?.effectiveDirective || 'unknown',
      blockedUri: cspReport?.['blocked-uri'] || cspReport?.blockedURL || 'unknown',
      disposition: cspReport?.disposition || 'enforce',
      sourceFile: cspReport?.['source-file'] || cspReport?.sourceFile,
      lineNumber: cspReport?.['line-number'] || cspReport?.lineNumber
    }));

    // Browsers expect 204 No Content for report endpoints
    return res.status(204).end();
  } catch (err) {
    console.error('Error procesando reporte CSP:', err);
    return res.status(400).json({ error: 'Reporte CSP inválido.' });
  }
}

