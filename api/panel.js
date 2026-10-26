// Centro de mando: login con contraseña y datos del panel (/panel).
import { createHmac, timingSafeEqual } from 'node:crypto';
import { stats, goal, channelMembers } from './_stats.js';
import { igToken, igProfile, igAccountInsights, igMedia } from './_ig.js';
import { sql } from './_demo.js';

const COOKIE = 'tg_panel';
const PASS = () => process.env.PANEL_PASSWORD || '';
const sign = (v) => createHmac('sha256', 'topin-panel:' + PASS()).update(v).digest('hex');

function eq(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}
function authed(req) {
  if (!PASS()) return false;
  const c = String(req.headers.cookie || '').split(/;\s*/).find((p) => p.startsWith(COOKIE + '='));
  if (!c) return false;
  const [exp, mac] = c.slice(COOKIE.length + 1).split('.');
  return Number(exp) > Date.now() && mac && eq(mac, sign(exp));
}
const send = (res, code, body) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(code).json(body);
};

export default async function handler(req, res) {
  const action = req.query.action || 'data';

  if (action === 'login' && req.method === 'POST') {
    const pw = (req.body && req.body.password) || '';
    if (!PASS()) return send(res, 503, { error: 'Falta PANEL_PASSWORD en Vercel.' });
    if (!eq(pw, PASS())) {
      await new Promise((r) => setTimeout(r, 600));
      return send(res, 401, { error: 'Contraseña incorrecta.' });
    }
    const exp = String(Date.now() + 30 * 864e5);
    res.setHeader('Set-Cookie', `${COOKIE}=${exp}.${sign(exp)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}`);
    return send(res, 200, { ok: true });
  }
  if (action === 'logout') {
    res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    return send(res, 200, { ok: true });
  }
  if (!authed(req)) return send(res, 401, { error: 'login' });

  if (action === 'ig-token' && req.method === 'POST') {
    const token = String((req.body && req.body.token) || '').trim();
    if (!token) return send(res, 400, { error: 'Pega el token de Instagram.' });
    try {
      const p = await igProfile(token);
      await sql()`INSERT INTO settings (key, value) VALUES ('ig_token', ${token})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
      return send(res, 200, { ok: true, username: p.username });
    } catch (e) {
      return send(res, 400, { error: 'Instagram rechazó el token: ' + e.message });
    }
  }

  const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 7;
  try {
    const [s, g, members] = await Promise.all([stats(days), goal(), channelMembers().catch(() => null)]);
    let instagram = { connected: false };
    const token = await igToken();
    if (token) {
      try {
        const [profile, insights, media] = await Promise.all([
          igProfile(token), igAccountInsights(token, days), igMedia(token, 9),
        ]);
        instagram = { connected: true, profile, insights, media };
      } catch (e) {
        instagram = { connected: false, error: e.message };
      }
    }
    const queue = await sql()`SELECT id, project, type, status, scheduled_at, permalink, note, media->>0 AS thumb
      FROM social_posts WHERE status <> 'rejected' ORDER BY scheduled_at DESC LIMIT 12`;
    return send(res, 200, { ...s, goal: g, channel: { members }, instagram, queue, generated: new Date().toISOString() });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
