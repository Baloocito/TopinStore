// Cálculo de métricas para el panel, la barra de meta y el informe semanal.
import { readFileSync } from 'node:fs';
import { sql, ensureSchema, tg } from './_demo.js';
import { products as tqProducts } from './_tq.js';

const TZ = 'America/Santiago';
const SUPPORT = ['mp-1500', 'mp-5000', 'mp-10000', 'kofi', 'demobot'];
const links = () => JSON.parse(readFileSync(new URL('../data/links.json', import.meta.url), 'utf8'));

export const usdRate = () => Number(links().support?.goal?.usdRate || process.env.USD_CLP || 950);

/** Total donado convertido a pesos (Ko-fi viene en dólares). */
export async function goal() {
  await ensureSchema();
  const g = links().support?.goal || {};
  const since = g.since || '2000-01-01';
  const rows = await sql()`SELECT currency, coalesce(sum(amount),0)::float AS total FROM donations
    WHERE status = 'approved' AND created_at >= ${since} GROUP BY currency`;
  const rate = usdRate();
  const raised = rows.reduce((a, r) => a + (r.currency === 'USD' ? r.total * rate : r.currency === 'CLP' ? r.total : 0), 0);
  return { label: g.label || null, target: Number(g.target) || 0, raised: Math.round(raised) };
}

export async function channelMembers() {
  const r = await tg('getChatMemberCount', { chat_id: '@TopinSaleSwitch' });
  return r.ok ? r.result : null;
}

export async function stats(days) {
  await ensureSchema();
  const q = sql();
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const prevSince = new Date(Date.now() - 2 * days * 864e5).toISOString();

  const [tot] = await q`SELECT
      count(*) FILTER (WHERE type='view' AND target='home')::int AS views,
      count(DISTINCT vid) FILTER (WHERE type='view' AND target='home')::int AS visitors,
      count(*) FILTER (WHERE type='view' AND target='faro')::int AS faro_views,
      count(*) FILTER (WHERE type='view' AND target='zombies')::int AS zombies_views,
      count(*) FILTER (WHERE type='click')::int AS clicks,
      count(*) FILTER (WHERE type='click' AND target = ANY(${SUPPORT}))::int AS support_clicks,
      count(*) FILTER (WHERE type='view' AND mobile)::int AS mobile_views,
      count(*) FILTER (WHERE type='view' AND inapp)::int AS inapp_views
    FROM events WHERE at >= ${since}`;
  const [prev] = await q`SELECT count(DISTINCT vid) FILTER (WHERE type='view' AND target='home')::int AS visitors
    FROM events WHERE at >= ${prevSince} AND at < ${since}`;

  const daily = await q`SELECT to_char(date_trunc('day', at AT TIME ZONE ${TZ}), 'YYYY-MM-DD') AS day,
      count(DISTINCT vid) FILTER (WHERE type='view' AND target='home')::int AS visitors,
      count(*) FILTER (WHERE type='click')::int AS clicks
    FROM events WHERE at >= ${since} GROUP BY 1 ORDER BY 1`;

  const sources = await q`SELECT src,
      count(DISTINCT vid) FILTER (WHERE type='view')::int AS visitors,
      count(*) FILTER (WHERE type='click')::int AS clicks,
      count(*) FILTER (WHERE type='click' AND target = ANY(${SUPPORT}))::int AS support_clicks
    FROM events WHERE at >= ${since} GROUP BY src ORDER BY visitors DESC, clicks DESC LIMIT 12`;

  const targets = await q`SELECT CASE WHEN target LIKE 'tql:%' THEN 'tq-contacto' ELSE target END AS target,
      count(*)::int AS clicks FROM events
    WHERE at >= ${since} AND type='click' GROUP BY 1 ORDER BY clicks DESC`;

  const countries = await q`SELECT coalesce(country,'??') AS country, count(DISTINCT vid)::int AS visitors FROM events
    WHERE at >= ${since} AND type='view' GROUP BY 1 ORDER BY 2 DESC LIMIT 6`;

  const money = await q`SELECT source, currency, count(*)::int AS n, coalesce(sum(amount),0)::float AS total
    FROM donations WHERE status='approved' AND created_at >= ${since} GROUP BY source, currency`;
  const recent = await q`SELECT source, amount::float, currency, donor, note, kind, created_at FROM donations
    WHERE status='approved' ORDER BY created_at DESC LIMIT 8`;

  const claims = await q`SELECT platform, count(*)::int AS n FROM demo_claims WHERE created_at >= ${since} GROUP BY platform`;
  const [claimsAll] = await q`SELECT count(*)::int AS n FROM demo_claims`;

  const series = await q`SELECT to_char(day,'YYYY-MM-DD') AS day, metric, value::float FROM metrics_daily
    WHERE day >= (now() AT TIME ZONE ${TZ})::date - ${days}::int ORDER BY day`;

  const trueque = await truequeStats(q, since);

  const sum = (src, cur) => money.filter((m) => (!src || m.source === src) && m.currency === cur);
  const mpRows = sum('mercadopago', 'CLP');
  const kfRows = sum('kofi', 'USD');

  return {
    days,
    traffic: {
      ...tot,
      prev_visitors: prev.visitors,
      mobile_share: tot.views ? tot.mobile_views / tot.views : null,
      inapp_share: tot.views ? tot.inapp_views / tot.views : null,
    },
    daily, sources, targets, countries,
    money: {
      mp_clp: mpRows.reduce((a, r) => a + r.total, 0),
      mp_count: mpRows.reduce((a, r) => a + r.n, 0),
      kofi_usd: kfRows.reduce((a, r) => a + r.total, 0),
      kofi_count: kfRows.reduce((a, r) => a + r.n, 0),
      usd_rate: usdRate(),
    },
    recent,
    demos: { by_platform: claims, total_all_time: claimsAll.n },
    series,
    trueque,
  };
}

/** Tienda Trueque: visitas, productos más vistos y gente que pidió algo por el bot. */
async function truequeStats(q, since) {
  const [t] = await q`SELECT
      count(DISTINCT vid) FILTER (WHERE type='view' AND (target='trueque' OR target LIKE 'tqp:%'))::int AS visitors,
      count(*) FILTER (WHERE type='view' AND target LIKE 'tqp:%')::int AS product_views,
      count(*) FILTER (WHERE type='click' AND target LIKE 'tql:%')::int AS contact_clicks
    FROM events WHERE at >= ${since}`;
  const [l] = await q`SELECT count(*) FILTER (WHERE kind='want')::int AS wants,
      count(*) FILTER (WHERE kind='ask')::int AS asks, count(DISTINCT tg_user_id)::int AS people
    FROM trueque_leads WHERE created_at >= ${since}`;
  const top = await q`SELECT substr(target, 5) AS id,
      count(*) FILTER (WHERE type='view')::int AS views, count(*) FILTER (WHERE type='click')::int AS contacts
    FROM events WHERE at >= ${since} AND (target LIKE 'tqp:%' OR target LIKE 'tql:%')
    GROUP BY 1 ORDER BY views DESC, contacts DESC LIMIT 6`;
  const recent = await q`SELECT product_name, kind, tg_name, created_at FROM trueque_leads ORDER BY created_at DESC LIMIT 6`;
  const list = top.length ? await tqProducts() : [];
  const names = new Map(list.map((p) => [String(p.id).toLowerCase(), p.name]));
  return {
    ...t, ...l,
    top: top.map((r) => ({ ...r, name: names.get(r.id) || 'Producto ' + r.id.slice(0, 6) })),
    recent,
  };
}
