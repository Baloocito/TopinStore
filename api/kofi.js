// Webhook de Ko-fi: cada donación, membresía o compra en la tienda llega aquí.
// Ko-fi > Settings > More > API > Webhook URL: https://www.drpipa.cl/api/kofi
import { timingSafeEqual } from 'node:crypto';
import { sql, ensureSchema, notifyAdmin, esc } from './_demo.js';

const same = (a, b) => {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length > 0 && x.length === y.length && timingSafeEqual(x, y);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
  let d = null;
  try {
    const raw = req.body && (req.body.data || req.body);
    d = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (_) { /* cuerpo inválido */ }

  if (!d || !same(d.verification_token, process.env.KOFI_VERIFICATION_TOKEN)) {
    res.statusCode = 401;
    return res.end();
  }
  try {
    await ensureSchema();
    const id = String(d.kofi_transaction_id || d.message_id);
    const items = (d.shop_items || []).map((i) => i.variation_name || i.direct_link_code).filter(Boolean).join(', ');
    const kind = d.type === 'Shop Order' ? 'tienda' : d.type === 'Subscription' ? 'membresía' : d.type === 'Commission' ? 'encargo' : 'donación';
    const ins = await sql()`
      INSERT INTO donations (payment_id, source, amount, currency, status, donor, note, kind)
      VALUES (${'kofi:' + id}, 'kofi', ${Number(d.amount) || 0}, ${d.currency || 'USD'}, 'approved',
              ${d.is_public === false ? null : d.from_name || null}, ${d.message || items || null}, ${kind})
      ON CONFLICT (payment_id) DO NOTHING RETURNING payment_id`;
    if (ins.length) {
      await notifyAdmin(
        `☕ <b>Ko-fi · ${esc(kind)}</b>: ${esc(d.currency || 'USD')} ${esc(d.amount)}` +
        (d.from_name ? `\nDe: ${esc(d.from_name)}` : '') +
        (items ? `\nProducto: ${esc(items)}` : '') +
        (d.message ? `\n💬 ${esc(String(d.message).slice(0, 200))}` : ''));
    }
  } catch (e) {
    console.log(JSON.stringify({ kofi_error: String((e && e.message) || e) }));
  }
  res.statusCode = 200;
  res.end('ok');
}
