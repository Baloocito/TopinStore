// Llamado por GitHub Actions: ?action=sync tras cada cambio en content/, ?action=tick cada hora.
import { timingSafeEqual } from 'node:crypto';
import { sync, tick } from './_social.js';

const ok = (h) => {
  const s = process.env.SOCIAL_SECRET || '';
  const a = Buffer.from(String(h || '')), b = Buffer.from('Bearer ' + s);
  return s.length >= 16 && a.length === b.length && timingSafeEqual(a, b);
};

export default async function handler(req, res) {
  if (!ok(req.headers.authorization)) { res.statusCode = 401; return res.end(); }
  const out = {};
  try {
    out.sync = await sync();
    if (req.query.action !== 'sync') out.published = await tick();
  } catch (e) {
    out.error = e.message;
  }
  res.setHeader('Cache-Control', 'no-store');
  res.status(out.error ? 500 : 200).json(out);
}
