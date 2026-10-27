import { urlFor, cleanSrc, logEvent } from './_lib.js';
import truequeGo from './_tqgo.js';

export default function handler(req, res) {
  const id = String(req.query.id || '');
  // /api/tq?p=<producto> llega aquí como id=tq: "Lo quiero" de Trueque.
  if (id === 'tq') return truequeGo(req, res);
  const target = urlFor(id);
  if (!target) {
    res.statusCode = 302;
    res.setHeader('Location', '/');
    return res.end();
  }
  logEvent(req, { type: 'click', id, src: cleanSrc(req.query.src) });
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 302;
  res.setHeader('Location', target);
  res.end();
}
