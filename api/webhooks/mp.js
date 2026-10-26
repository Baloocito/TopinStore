// Avisos de Mercado Pago (IPN / Webhooks). El aviso solo dice "cambió el pago X":
// el pago se consulta siempre a la API, así un aviso falso no puede registrar nada.
import { checkPayment, sql, ensureSchema, notifyAdmin, MIN_AMOUNT } from '../_demo.js';

const clp = (n) => '$' + Math.round(n).toLocaleString('es-CL');

export default async function handler(req, res) {
  try {
    const q = req.query || {};
    const b = req.body || {};
    const topic = q.topic || q.type || b.type || b.topic;
    const id = String(q['data.id'] || q.id || (b.data && b.data.id) || '').replace(/\D/g, '');

    if (id && (!topic || topic === 'payment')) {
      const r = await checkPayment(id);
      const p = r.payment;
      if (p && p.status === 'approved') {
        await ensureSchema();
        const ins = await sql()`
          INSERT INTO donations (payment_id, source, amount, currency, status)
          VALUES (${p.id}, 'mercadopago', ${p.amount}, ${p.currency || 'CLP'}, ${p.status})
          ON CONFLICT (payment_id) DO NOTHING RETURNING payment_id`;
        if (ins.length) {
          await notifyAdmin(
            `💰 <b>Nueva donación</b> por Mercado Pago: ${clp(p.amount)}` +
            (p.amount >= MIN_AMOUNT ? '\nTiene derecho a la demo.' : '') +
            `\nOperación <code>${p.id}</code>`);
        }
      }
    }
  } catch (e) {
    console.log(JSON.stringify({ mp_webhook_error: String(e && e.message || e) }));
  }
  // Siempre 200: si no, Mercado Pago reintenta el mismo aviso muchas veces.
  res.statusCode = 200;
  res.end('ok');
}
