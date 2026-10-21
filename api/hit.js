import { cleanSrc, logEvent } from './_lib.js';

export default function handler(req, res) {
  logEvent(req, { type: 'view', id: 'home', src: cleanSrc(req.query.src) });
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 204;
  res.end();
}
