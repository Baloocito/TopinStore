import { cleanSrc, cleanPage, logEvent } from './_lib.js';

export default function handler(req, res) {
  logEvent(req, { type: 'view', id: cleanPage(req.query.page), src: cleanSrc(req.query.src) });
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 204;
  res.end();
}
