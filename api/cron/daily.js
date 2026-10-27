// Tarea diaria (Vercel Cron): guarda la foto del día, renueva el token de Instagram
// y los lunes envía el informe semanal por Telegram.
import { sql, ensureSchema, notifyAdmin, esc, checkPayment } from '../_demo.js';
import { stats, goal, channelMembers } from '../_stats.js';
import { igToken, igProfile, igAccountInsights, igRefreshIfNeeded } from '../_ig.js';

const clp = (n) => '$' + Math.round(n || 0).toLocaleString('es-CL');
const pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '—');
const LABEL = {
  'mp-1500': 'MP $1.500', 'mp-5000': 'MP $5.000', 'mp-10000': 'MP $10.000', kofi: 'Ko-fi', demobot: 'Bot de demo',
  switch: 'Canal Switch', 'tq-contacto': 'TopinStore · Lo quiero', faro: 'Faro Hundido', zombies: 'Topin de Zombies', trueque: 'TopinStore', colabora: 'Colaboraciones',
  ig: 'Instagram', tiktok: 'TikTok', tg: 'Telegram',
};

async function snapshot(day) {
  const put = (metric, value) => value == null ? null
    : sql()`INSERT INTO metrics_daily (day, metric, value) VALUES (${day}, ${metric}, ${value})
            ON CONFLICT (day, metric) DO UPDATE SET value = EXCLUDED.value`;
  const out = {};
  out.tg_channel_members = await channelMembers().catch(() => null);
  await put('tg_channel_members', out.tg_channel_members);
  const token = await igToken();
  if (token) {
    try {
      const p = await igProfile(token);
      out.ig_followers = p.followers_count;
      await put('ig_followers', p.followers_count);
      const ins = await igAccountInsights(token, 1);
      out.ig_reach = ins.reach;
      await put('ig_reach', ins.reach);
    } catch (e) { out.ig_error = e.message; }
  }
  return out;
}

/** Revisa las donaciones de Mercado Pago recientes y borra las que no fueron pagos recibidos por ti. */
async function cleanDonations() {
  const rows = await sql()`SELECT payment_id, amount FROM donations
    WHERE source = 'mercadopago' AND created_at > now() - interval '60 days'`;
  const removed = [];
  for (const d of rows) {
    const r = await checkPayment(d.payment_id);
    if (r.reason === 'mp_error') continue;
    if (!r.payment || !r.payment.mine || r.payment.status !== 'approved') {
      await sql()`DELETE FROM donations WHERE payment_id = ${d.payment_id}`;
      removed.push(d);
    }
  }
  if (removed.length) {
    await notifyAdmin('🧹 Saqué de la meta ' + removed.length + ' pago(s) que no eran donaciones recibidas: ' +
      removed.map((d) => `$${Math.round(d.amount).toLocaleString('es-CL')} (<code>${esc(d.payment_id)}</code>)`).join(', '));
  }
  return removed.length;
}

async function weeklyReport() {
  const s = await stats(7);
  const g = await goal();
  const t = s.traffic;
  const trend = t.prev_visitors ? Math.round(((t.visitors - t.prev_visitors) / t.prev_visitors) * 100) : null;
  const topSrc = s.sources.slice(0, 3).map((x) => `${esc(x.src)} (${x.visitors})`).join(', ') || '—';
  const topClick = s.targets.slice(0, 3).map((x) => `${esc(LABEL[x.target] || x.target)} (${x.clicks})`).join(', ') || '—';
  const best = s.sources.filter((x) => x.visitors >= 5).sort((a, b) => b.support_clicks / b.visitors - a.support_clicks / a.visitors)[0];

  const lines = [
    '📊 <b>Informe semanal · TopinGames</b>', '',
    `👀 Visitas únicas: <b>${t.visitors}</b>${trend == null ? '' : ` (${trend >= 0 ? '+' : ''}${trend}% vs semana anterior)`}`,
    `🖱️ Clics: <b>${t.clicks}</b> · en apoyar: <b>${t.support_clicks}</b> (${pct(t.support_clicks, t.visitors)} de las visitas)`,
    `🎮 Visitas a los juegos: Faro <b>${t.faro_views}</b> · Zombies <b>${t.zombies_views}</b>`,
    `💰 Mercado Pago: <b>${clp(s.money.mp_clp)}</b> (${s.money.mp_count}) · Ko-fi: <b>US$${s.money.kofi_usd.toFixed(2)}</b> (${s.money.kofi_count})`,
    `🎁 Demos canjeadas: <b>${s.demos.by_platform.reduce((a, x) => a + x.n, 0)}</b>`,
    `🛍️ TopinStore: <b>${s.trueque.visitors}</b> visitas · <b>${s.trueque.wants}</b> "lo quiero" · <b>${s.trueque.asks}</b> preguntas` +
      (s.trueque.top[0] ? ` · lo más visto: ${esc(s.trueque.top[0].name)}` : ''),
    '', `📍 Origen top: ${topSrc}`, `🎯 Lo más clicado: ${topClick}`,
  ];
  if (best && best.support_clicks) lines.push(`⭐ Mejor origen para apoyar: <b>${esc(best.src)}</b> (${pct(best.support_clicks, best.visitors)})`);
  if (g.target) lines.push('', `🏁 Meta "${esc(g.label || '')}": ${clp(g.raised)} de ${clp(g.target)} (${pct(g.raised, g.target)})`);
  lines.push('', 'Detalle completo en drpipa.cl/panel');
  await notifyAdmin(lines.join('\n'));
}

export default async function handler(req, res) {
  const auth = req.headers.authorization || '';
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    res.statusCode = 401;
    return res.end();
  }
  const out = {};
  try {
    await ensureSchema();
    const day = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
    out.snapshot = await snapshot(day);
    out.donations_removed = await cleanDonations().catch((e) => 'error: ' + e.message);
    out.instagram_token = await igRefreshIfNeeded().catch((e) => 'error: ' + e.message);
    const weekday = new Date().toLocaleDateString('en-US', { timeZone: 'America/Santiago', weekday: 'short' });
    if (weekday === 'Mon' || req.query.report === '1') {
      await weeklyReport();
      out.report = 'enviado';
    }
  } catch (e) {
    out.error = e.message;
  }
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(out);
}
