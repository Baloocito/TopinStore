// Instagram (API con inicio de sesión de Instagram). El token vive en la base de datos y se renueva solo.
import { sql, ensureSchema } from './_demo.js';

const GRAPH = 'https://graph.instagram.com';

export async function igToken() {
  await ensureSchema();
  const [row] = await sql()`SELECT value FROM settings WHERE key = 'ig_token'`;
  return (row && row.value) || process.env.IG_ACCESS_TOKEN || null;
}

async function get(path, params, token) {
  const u = new URL(GRAPH + path);
  for (const [k, v] of Object.entries(params || {})) u.searchParams.set(k, v);
  u.searchParams.set('access_token', token);
  const r = await fetch(u, { signal: AbortSignal.timeout(8000) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error((data.error && data.error.message) || `instagram ${r.status}`);
  return data;
}

export async function igProfile(token) {
  return get('/me', { fields: 'user_id,username,name,followers_count,follows_count,media_count,profile_picture_url' }, token);
}

/** Métricas de la cuenta (alcance, vistas, etc.) de los últimos `days` días. Cada métrica se pide por separado:
 *  si Meta cambia o retira alguna, las demás siguen funcionando. */
export async function igAccountInsights(token, days) {
  const until = Math.floor(Date.now() / 1000);
  const since = until - Math.min(days, 30) * 86400;
  const out = {};
  for (const metric of ['reach', 'views', 'profile_views', 'accounts_engaged', 'website_clicks', 'follows_and_unfollows']) {
    try {
      const d = await get('/me/insights', { metric, period: 'day', metric_type: 'total_value', since, until }, token);
      const m = d.data && d.data[0];
      out[metric] = m && m.total_value ? m.total_value.value : null;
    } catch (_) { out[metric] = null; }
  }
  return out;
}

export async function igMedia(token, limit = 9) {
  const d = await get('/me/media', {
    fields: 'id,caption,media_type,media_product_type,thumbnail_url,media_url,permalink,timestamp,like_count,comments_count',
    limit,
  }, token);
  const items = d.data || [];
  await Promise.all(items.map(async (m) => {
    for (const metrics of ['reach,views,saved,shares', 'reach,saved', 'reach']) {
      try {
        const ins = await get(`/${m.id}/insights`, { metric: metrics }, token);
        m.insights = Object.fromEntries((ins.data || []).map((x) => [x.name, x.values && x.values[0] ? x.values[0].value : x.total_value?.value]));
        break;
      } catch (_) { /* se intenta con menos métricas */ }
    }
  }));
  return items.map((m) => ({
    id: m.id,
    type: m.media_product_type === 'REELS' ? 'reel' : m.media_type === 'CAROUSEL_ALBUM' ? 'carrusel' : m.media_type === 'VIDEO' ? 'video' : 'foto',
    caption: (m.caption || '').slice(0, 140),
    image: m.thumbnail_url || m.media_url || null,
    url: m.permalink,
    at: m.timestamp,
    likes: m.like_count ?? null,
    comments: m.comments_count ?? null,
    reach: m.insights?.reach ?? null,
    views: m.insights?.views ?? null,
    saved: m.insights?.saved ?? null,
    shares: m.insights?.shares ?? null,
  }));
}

/** Los tokens de larga duración duran 60 días: se renuevan cuando tienen más de 20. */
export async function igRefreshIfNeeded() {
  const token = await igToken();
  if (!token) return 'sin token';
  const [row] = await sql()`SELECT updated_at FROM settings WHERE key = 'ig_token'`;
  const age = row ? (Date.now() - new Date(row.updated_at).getTime()) / 864e5 : Infinity;
  if (age < 20) return 'vigente';
  const d = await get('/refresh_access_token', { grant_type: 'ig_refresh_token' }, token);
  await sql()`INSERT INTO settings (key, value) VALUES ('ig_token', ${d.access_token})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
  return 'renovado';
}
