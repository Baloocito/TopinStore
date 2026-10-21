import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../data/links.json', import.meta.url), 'utf8'));

const index = new Map();
index.set(data.featured.id, data.featured.url);
for (const p of data.paths) index.set(p.id, p.url);
for (const s of data.socials) index.set(s.id, s.url);

export const urlFor = (id) => index.get(id);

const SOURCES = /^[a-z0-9_-]{1,24}$/;
export const cleanSrc = (v) => (typeof v === 'string' && SOURCES.test(v) ? v : 'direct');

// Una línea JSON por evento: se lee y filtra en los logs del proyecto en Vercel.
export function logEvent(req, event) {
  const h = req.headers;
  console.log(JSON.stringify({
    ev: event.type,
    id: event.id,
    src: event.src,
    country: h['x-vercel-ip-country'] || null,
    city: h['x-vercel-ip-city'] ? decodeURIComponent(h['x-vercel-ip-city']) : null,
    mobile: /Mobi|Android|iPhone/i.test(h['user-agent'] || ''),
    inapp: /Instagram|FBAN|FBAV|TikTok/i.test(h['user-agent'] || ''),
    at: new Date().toISOString(),
  }));
}
