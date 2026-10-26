import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { waitUntil } from '@vercel/functions';
import { sql, ensureSchema } from './_demo.js';

const data = JSON.parse(readFileSync(new URL('../data/links.json', import.meta.url), 'utf8'));

const index = new Map();
index.set(data.featured.id, data.featured.url);
for (const p of data.paths) index.set(p.id, p.url);
for (const s of data.socials) index.set(s.id, s.url);
if (data.support) {
  for (const t of data.support.tiers || []) if (t.url) index.set(t.id, t.url);
  if (data.support.intl?.url) index.set(data.support.intl.id, data.support.intl.url);
  if (data.support.proof?.url) index.set(data.support.proof.id, data.support.proof.url);
}

export const urlFor = (id) => index.get(id);

const SOURCES = /^[a-z0-9_-]{1,24}$/;
export const cleanSrc = (v) => (typeof v === 'string' && SOURCES.test(v) ? v : 'direct');

const PAGES = /^[a-z0-9_-]{1,24}$/;
export const cleanPage = (v) => (typeof v === 'string' && PAGES.test(v) ? v : 'home');

// Visitante anónimo: huella diaria de IP + navegador. Sirve para contar personas únicas
// sin guardar la IP, y cambia cada día.
function visitor(h) {
  const ip = String(h['x-forwarded-for'] || h['x-real-ip'] || '').split(',')[0].trim();
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${day}|${ip}|${h['user-agent'] || ''}`).digest('hex').slice(0, 16);
}

/** Registra una visita o un clic en la base de datos (sin demorar la respuesta) y en los logs. */
export function logEvent(req, event) {
  const h = req.headers;
  const row = {
    ev: event.type,
    id: event.id,
    src: event.src,
    country: h['x-vercel-ip-country'] || null,
    city: h['x-vercel-ip-city'] ? decodeURIComponent(h['x-vercel-ip-city']) : null,
    mobile: /Mobi|Android|iPhone/i.test(h['user-agent'] || ''),
    inapp: /Instagram|FBAN|FBAV|TikTok/i.test(h['user-agent'] || ''),
    vid: visitor(h),
  };
  console.log(JSON.stringify({ ...row, at: new Date().toISOString() }));
  if (!process.env.DATABASE_URL) return;
  waitUntil((async () => {
    try {
      await ensureSchema();
      await sql()`INSERT INTO events (type, target, src, country, city, mobile, inapp, vid)
        VALUES (${row.ev}, ${row.id}, ${row.src}, ${row.country}, ${row.city}, ${row.mobile}, ${row.inapp}, ${row.vid})`;
    } catch (e) {
      console.log(JSON.stringify({ event_store_error: String(e && e.message || e) }));
    }
  })());
}
