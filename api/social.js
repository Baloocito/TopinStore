// Llamado por GitHub Actions: ?action=sync tras cada cambio en content/, ?action=tick cada hora.
import { timingSafeEqual } from 'node:crypto';
import { sync, tick, kick } from './_social.js';

const ok = (h) => {
  const s = process.env.SOCIAL_SECRET || '';
  const a = Buffer.from(String(h || '')), b = Buffer.from('Bearer ' + s);
  return s.length >= 16 && a.length === b.length && timingSafeEqual(a, b);
};

export default async function handler(req, res) {
  if (!ok(req.headers.authorization)) {
    // Reloj público (cron-job.org, sin clave): solo publica lo que TÚ ya aprobaste y cuya hora llegó,
    // y manda el aviso de 5 min. No sincroniza ni cambia nada más.
    if (req.query.action === 'tick') {
      await kick({ external: true });
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ ok: true });
    }
    res.statusCode = 401; return res.end();
  }
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
