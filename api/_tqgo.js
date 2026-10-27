// "Lo quiero" en Trueque: cuenta el clic y abre el bot de Telegram con el producto ya elegido.
import { cleanSrc, logEvent } from './_lib.js';
import { sql, ensureSchema } from './_demo.js';
import { UUID, FALLBACK } from './_tq.js';

let cached = null;
async function botUsername() {
  if (cached) return cached;
  if (!process.env.TELEGRAM_TRUEQUE_BOT_TOKEN || !process.env.DATABASE_URL) return null;
  try {
    await ensureSchema();
    const [r] = await sql()`SELECT value FROM settings WHERE key = 'tq_bot_username'`;
    cached = r ? r.value : null;
  } catch { cached = null; }
  return cached;
}

export default async function truequeGo(req, res) {
  const id = String(req.query.p || '');
  const ok = UUID.test(id);
  if (ok) logEvent(req, { type: 'click', id: 'tql:' + id.toLowerCase(), src: cleanSrc(req.query.src) });
  const bot = await botUsername();
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 302;
  res.setHeader('Location', bot ? `https://t.me/${bot}?start=${ok ? 'p_' + id.toLowerCase() : 'tienda'}` : FALLBACK);
  res.end();
}
