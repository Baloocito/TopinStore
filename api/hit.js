import { cleanSrc, cleanPage, logEvent } from './_lib.js';
import { UUID } from './_tq.js';

export default function handler(req, res) {
  const page = cleanPage(req.query.page);
  // En Trueque, la vista de un producto se guarda como "tqp:<id>" para saber qué se mira más.
  const p = String(req.query.p || '');
  const id = page === 'trueque' && UUID.test(p) ? 'tqp:' + p.toLowerCase() : page;
  logEvent(req, { type: 'view', id, src: cleanSrc(req.query.src) });
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 204;
  res.end();
}
