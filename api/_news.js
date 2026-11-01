// Radar de noticias: cada mañana revisa fuentes RSS de gaming, tecnología, IA y desarrollo,
// elige las mejores y las manda al bot de mando con un botón "💡 Hacer post".
// Las ideas guardadas se ven con /ideas; los posts se arman después en el chat con Claude.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { sql, ensureSchema, esc } from './_demo.js';
import { ops, opsSay } from './_social.js';

const CFG = () => JSON.parse(readFileSync(new URL('../data/news.json', import.meta.url), 'utf8'));
const TOPIC = { gaming: '🎮', tech: '💻', ia: '🤖', dev: '🛠️' };
const PICK = 5;
const MAX_AGE_H = 48;

export async function newsSchema() {
  await ensureSchema();
  await sql()`CREATE TABLE IF NOT EXISTS news_items (
    id          text PRIMARY KEY,
    title       text NOT NULL,
    url         text NOT NULL,
    source      text,
    topic       text,
    published   timestamptz,
    status      text NOT NULL DEFAULT 'sent',
    created_at  timestamptz NOT NULL DEFAULT now()
  )`;
}

/* ---------- Lectura de RSS / Atom sin dependencias ---------- */
const decode = (s) => String(s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();
const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1] : '';
};

export function parseFeed(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks) {
    const title = decode(tag(b, 'title'));
    let url = decode(tag(b, 'link'));
    if (!/^https?:/.test(url)) {
      const alt = b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) || b.match(/<link[^>]*href=["']([^"']+)["']/i);
      url = alt ? alt[1].replace(/&amp;/g, '&') : '';
    }
    const date = decode(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date'));
    const summary = decode(tag(b, 'description') || tag(b, 'summary') || tag(b, 'content')).slice(0, 400);
    if (title && /^https?:/.test(url)) items.push({ title, url, published: date ? new Date(date) : null, summary });
  }
  return items;
}

async function fetchSource(s) {
  const r = await fetch(s.url, {
    headers: { 'User-Agent': 'TopinGamesRadar/1.0 (+https://www.drpipa.cl)', Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const items = parseFeed(await r.text());
  if (!items.length) throw new Error('sin noticias legibles');
  return items.map((i) => ({ ...i, source: s.name, topic: s.topic }));
}

/** Puntaje: palabras clave que te importan + qué tan reciente es + el tema que toca hoy. */
export function score(item, cfg, todayTopics, now = Date.now()) {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  let s = 0;
  for (const [k, w] of Object.entries(cfg.boost)) if (text.includes(k)) s += w;
  const ageH = item.published && !isNaN(item.published) ? (now - item.published.getTime()) / 36e5 : 24;
  s += Math.max(0, 4 - ageH / 8);
  if (todayTopics.includes(item.topic)) s += 3;
  return s;
}

const chileDay = () => new Date().toLocaleDateString('en-US', { timeZone: 'America/Santiago', weekday: 'short' });
const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Revisa las fuentes, elige las mejores y las manda al bot de mando. */
export async function runRadar({ silentIfEmpty = false } = {}) {
  await newsSchema();
  const cfg = CFG();
  const today = cfg.calendar[String(DOW[chileDay()])] || { emoji: '📅', label: '', topics: [] };
  const results = await Promise.allSettled(cfg.sources.map(fetchSource));
  const failed = cfg.sources.filter((_, i) => results[i].status === 'rejected').map((s) => s.name);
  const now = Date.now();
  let all = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .filter((i) => !cfg.skip.some((k) => i.title.toLowerCase().includes(k)))
    .filter((i) => !i.published || isNaN(i.published) || now - i.published.getTime() < MAX_AGE_H * 36e5)
    .map((i) => ({ ...i, id: createHash('sha1').update(i.url.split('?')[0]).digest('hex').slice(0, 16) }));

  // Fuera lo que ya te mandé antes.
  const ids = all.map((i) => i.id);
  const seen = ids.length ? new Set((await sql()`SELECT id FROM news_items WHERE id = ANY(${ids})`).map((r) => r.id)) : new Set();
  all = all.filter((i) => !seen.has(i.id));
  const unique = [...new Map(all.map((i) => [i.title.toLowerCase().slice(0, 60), i])).values()];

  // Las mejores, con máximo 2 por tema para que haya variedad.
  const ranked = unique.map((i) => ({ ...i, s: score(i, cfg, today.topics, now) })).sort((a, b) => b.s - a.s);
  const pick = [];
  const perTopic = {};
  for (const i of ranked) {
    if (pick.length >= PICK) break;
    if ((perTopic[i.topic] || 0) >= 2) continue;
    perTopic[i.topic] = (perTopic[i.topic] || 0) + 1;
    pick.push(i);
  }

  if (!pick.length) {
    if (!silentIfEmpty) await opsSay('📡 Radar: hoy no encontré noticias nuevas.' + (failed.length ? `\n⚠️ No respondieron: ${esc(failed.join(', '))}` : ''));
    return { sent: 0, failed };
  }
  for (const i of pick) {
    await sql()`INSERT INTO news_items (id, title, url, source, topic, published) VALUES
      (${i.id}, ${i.title}, ${i.url}, ${i.source}, ${i.topic}, ${i.published && !isNaN(i.published) ? i.published.toISOString() : null})
      ON CONFLICT (id) DO NOTHING`;
  }
  const head = `📡 <b>Radar del día</b>${today.label ? `\nHoy toca: ${today.emoji} <b>${esc(today.label)}</b>` : ''}`;
  const body = pick.map((i, n) => `${n + 1}. ${TOPIC[i.topic] || '•'} <a href="${esc(i.url)}">${esc(i.title)}</a>\n    <i>${esc(i.source)}</i>`).join('\n\n');
  const foot = '\n\n💡 Toca el número para guardarla como idea. Después me la traes al chat y armamos el post.' +
    (failed.length ? `\n\n⚠️ No respondieron: ${esc(failed.join(', '))} (cámbialas en data/news.json)` : '');
  await opsSay(`${head}\n\n${body}${foot}`, {
    reply_markup: { inline_keyboard: [pick.map((i, n) => ({ text: `💡 ${n + 1}`, callback_data: `nw:${i.id}` }))] },
  });
  return { sent: pick.length, failed };
}

/** Botones del radar y de /ideas. Devuelve true si el callback era del radar. */
export async function onNewsCallback(cb) {
  const [act, id] = String(cb.data || '').split(':');
  if (!['nw', 'nd', 'nx'].includes(act)) return false;
  await newsSchema();
  const [n] = await sql()`SELECT * FROM news_items WHERE id = ${id}`;
  if (!n) {
    await ops('answerCallbackQuery', { callback_query_id: cb.id, text: 'Ya no tengo esa noticia' });
    return true;
  }
  if (act === 'nw') {
    await sql()`UPDATE news_items SET status = 'idea' WHERE id = ${id}`;
    await ops('answerCallbackQuery', { callback_query_id: cb.id, text: '💡 Guardada en /ideas' });
  } else {
    await sql()`UPDATE news_items SET status = ${act === 'nd' ? 'done' : 'dropped'} WHERE id = ${id}`;
    await ops('answerCallbackQuery', { callback_query_id: cb.id, text: act === 'nd' ? '✅ Marcada como hecha' : 'Descartada' });
    if (cb.message) await ops('deleteMessage', { chat_id: cb.message.chat.id, message_id: cb.message.message_id });
  }
  return true;
}

/** /ideas: lo que guardaste del radar y aún no se convierte en post. */
export async function listIdeas() {
  await newsSchema();
  const rows = await sql()`SELECT * FROM news_items WHERE status = 'idea' ORDER BY created_at DESC LIMIT 10`;
  if (!rows.length) return opsSay('💡 No tienes ideas guardadas. Toca 💡 en el radar de la mañana o usa /radar para buscar ahora.');
  await opsSay(`💡 <b>Tus ideas</b> (${rows.length})\nCópialas o reenvíamelas en el chat con Claude y armamos el post.`);
  for (const r of rows) {
    await opsSay(`${TOPIC[r.topic] || '•'} <b>${esc(r.title)}</b>\n<i>${esc(r.source)}</i> · ${esc(r.url)}`, {
      reply_markup: { inline_keyboard: [[{ text: '✅ Ya hice el post', callback_data: `nd:${r.id}` }, { text: '🗑️ Descartar', callback_data: `nx:${r.id}` }]] },
    });
  }
}
