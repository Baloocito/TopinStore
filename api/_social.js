// Publicaciones: cola, aprobación por Telegram (@bot de mando) y publicación en Instagram.
import { createHash } from 'node:crypto';
const hashOf = (p) => createHash('sha1').update(JSON.stringify([p.type, p.media, p.caption, p.scheduled_at, p.story || null])).digest('hex');
import { sql, ensureSchema, ADMIN_ID, SITE, esc } from './_demo.js';
import { igToken } from './_ig.js';

const OPS_TOKEN = process.env.TELEGRAM_OPS_BOT_TOKEN || '';
export const OPS_SECRET = OPS_TOKEN
  ? createHash('sha256').update('topin-ops:' + OPS_TOKEN).digest('hex').slice(0, 48) : '';

export async function ops(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${OPS_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!data.ok) console.log(JSON.stringify({ ops_error: method, description: data.description }));
  return data;
}
export const opsSay = (text, extra = {}) =>
  ops('sendMessage', { chat_id: ADMIN_ID, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra });

const TZ = 'America/Santiago';
export const when = (iso) => new Date(iso).toLocaleString('es-CL', {
  timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});
const TYPE = { image: '🖼️ Imagen', carousel: '🗂️ Carrusel', reel: '🎬 Reel' };
const STATUS = {
  pending: '⏳ Esperando tu aprobación', approved: '✅ Aprobado', rejected: '❌ Descartado',
  changes: '✏️ Esperando cambios', published: '🚀 Publicado', failed: '⚠️ Falló', publishing: '📤 Publicando…',
};

/** Texto y botones del mensaje de control de un post. */
export function card(p) {
  const head = `${TYPE[p.type] || p.type} · <b>${esc(p.project || 'topingames')}</b> · <code>${esc(p.id)}</code>`;
  const lines = [
    head,
    `🗓️ ${esc(when(p.scheduled_at))}`,
    `${STATUS[p.status] || p.status}${p.permalink ? ` · <a href="${esc(p.permalink)}">ver post</a>` : ''}`,
  ];
  if (p.story_media) lines.push(p.story_id ? '📲 Historia publicada' : '📲 + historia al publicar');
  if (p.note) lines.push(`📝 <i>${esc(p.note)}</i>`);
  if (p.error) lines.push(`⚠️ ${esc(p.error)}`);
  lines.push('', esc(p.caption).slice(0, 3200));
  const k = [];
  if (['pending', 'changes', 'failed'].includes(p.status)) {
    k.push([{ text: '✅ Aprobar', callback_data: `ok:${p.id}` }, { text: '❌ Descartar', callback_data: `no:${p.id}` }]);
    k.push([{ text: '✏️ Cambiar texto u hora', callback_data: `ed:${p.id}` }, { text: '🚀 Publicar ya', callback_data: `now:${p.id}` }]);
  } else if (p.status === 'approved') {
    k.push([{ text: '🚀 Publicar ya', callback_data: `now:${p.id}` }, { text: '⏸️ Volver a revisar', callback_data: `back:${p.id}` }]);
  }
  return { text: lines.join('\n').slice(0, 4090), reply_markup: { inline_keyboard: k } };
}

export async function updateCard(p) {
  if (!p.tg_message_id) return;
  const c = card(p);
  await ops('editMessageText', {
    chat_id: ADMIN_ID, message_id: Number(p.tg_message_id), parse_mode: 'HTML', disable_web_page_preview: true, ...c,
  });
}

/** Envía la vista previa (imágenes o video) y debajo la tarjeta con los botones. */
export async function sendPreview(p) {
  if (p.type === 'reel') await ops('sendVideo', { chat_id: ADMIN_ID, video: p.media[0], supports_streaming: true });
  else if (p.media.length === 1) await ops('sendPhoto', { chat_id: ADMIN_ID, photo: p.media[0] });
  else await ops('sendMediaGroup', { chat_id: ADMIN_ID, media: p.media.map((u) => ({ type: 'photo', media: u })) });
  if (p.story_media) await ops('sendPhoto', { chat_id: ADMIN_ID, photo: p.story_media, caption: '📲 Historia que sale junto al post' });
  const sent = await opsSay(card(p).text, { reply_markup: card(p).reply_markup });
  if (sent.ok) await sql()`UPDATE social_posts SET tg_message_id = ${sent.result.message_id} WHERE id = ${p.id}`;
}

export async function getPost(id) {
  const [p] = await sql()`SELECT * FROM social_posts WHERE id = ${id}`;
  return p ? { ...p, media: typeof p.media === 'string' ? JSON.parse(p.media) : p.media } : null;
}
export async function setStatus(id, status, extra = {}) {
  await sql()`UPDATE social_posts SET status = ${status}, error = ${extra.error ?? null},
    note = coalesce(${extra.note ?? null}, note), updated_at = now() WHERE id = ${id}`;
  return getPost(id);
}

/** Trae data/queue.json del sitio publicado y registra los posts nuevos (o los que cambiaste en el repo). */
export async function sync() {
  await ensureSchema();
  const r = await fetch(`${SITE}/data/queue.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) throw new Error('No pude leer la cola: ' + r.status);
  const q = await r.json();
  let added = 0, updated = 0;
  for (const p of q.posts) {
    const cur = await getPost(p.id);
    const h = hashOf(p);
    if (!cur) {
      await sql()`INSERT INTO social_posts (id, project, type, media, caption, scheduled_at, note, source_hash, story_media)
        VALUES (${p.id}, ${p.project}, ${p.type}, ${JSON.stringify(p.media)}, ${p.caption}, ${p.scheduled_at}, ${p.note}, ${h}, ${p.story || null})`;
      await sendPreview(await getPost(p.id));
      added++;
    } else if (cur.source_hash !== h && cur.status !== 'published' && cur.status !== 'publishing') {
      // Lo rehice en el repo: vuelve a revisión con la versión nueva (los cambios hechos desde Telegram
      // no cuentan aquí, porque solo se compara con la versión anterior del repo).
      await sql()`UPDATE social_posts SET type = ${p.type}, media = ${JSON.stringify(p.media)}, caption = ${p.caption},
        scheduled_at = ${p.scheduled_at}, story_media = ${p.story || null}, status = 'pending', error = NULL, note = NULL, source_hash = ${h},
        updated_at = now() WHERE id = ${p.id}`;
      await sendPreview(await getPost(p.id));
      updated++;
    }
  }
  return { version: q.version, total: q.posts.length, added, updated };
}

/* ---------- Instagram ---------- */
const GRAPH = 'https://graph.instagram.com';
async function ig(path, params, token, method = 'POST') {
  const u = new URL(GRAPH + path);
  const body = new URLSearchParams({ ...params, access_token: token });
  const r = method === 'GET'
    ? await fetch(u + '?' + body, { signal: AbortSignal.timeout(15000) })
    : await fetch(u, { method: 'POST', body, signal: AbortSignal.timeout(30000) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error((d.error && (d.error.error_user_msg || d.error.message)) || `instagram ${r.status}`);
  return d;
}
async function waitReady(id, token, tries = 12) {
  for (let i = 0; i < tries; i++) {
    const s = await ig(`/${id}`, { fields: 'status_code' }, token, 'GET');
    if (s.status_code === 'FINISHED') return;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error('Instagram no pudo procesar el archivo');
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error('Instagram tardó demasiado en procesar el archivo; se reintenta en la próxima hora');
}

export async function publish(p) {
  const token = await igToken();
  if (!token) throw new Error('Instagram no está conectado');
  let creation;
  if (p.type === 'image') {
    creation = (await ig('/me/media', { image_url: p.media[0], caption: p.caption }, token)).id;
  } else if (p.type === 'carousel') {
    const children = [];
    for (const url of p.media) children.push((await ig('/me/media', { image_url: url, is_carousel_item: 'true' }, token)).id);
    creation = (await ig('/me/media', { media_type: 'CAROUSEL', children: children.join(','), caption: p.caption }, token)).id;
  } else {
    creation = (await ig('/me/media', { media_type: 'REELS', video_url: p.media[0], caption: p.caption, share_to_feed: 'true' }, token)).id;
  }
  await waitReady(creation, token);
  const done = await ig('/me/media_publish', { creation_id: creation }, token);
  const info = await ig(`/${done.id}`, { fields: 'permalink' }, token, 'GET').catch(() => ({}));
  return { id: done.id, permalink: info.permalink || null };
}

/** Historia con la imagen vertical del post. Si falla, el post ya quedó publicado igual. */
export async function publishStory(p) {
  const token = await igToken();
  const creation = (await ig('/me/media', { media_type: 'STORIES', image_url: p.story_media }, token)).id;
  await waitReady(creation, token, 8);
  return (await ig('/me/media_publish', { creation_id: creation }, token)).id;
}

export async function publishOne(id) {
  const p = await setStatus(id, 'publishing');
  await updateCard(p);
  try {
    const r = await publish(p);
    await sql()`UPDATE social_posts SET status = 'published', ig_media_id = ${r.id}, permalink = ${r.permalink},
      published_at = now(), error = NULL, updated_at = now() WHERE id = ${id}`;
    let storyLine = '';
    if (p.story_media) {
      try {
        const sid = await publishStory(p);
        await sql()`UPDATE social_posts SET story_id = ${sid} WHERE id = ${id}`;
        storyLine = '\n📲 Historia publicada';
      } catch (e) {
        await sql()`UPDATE social_posts SET story_error = ${e.message} WHERE id = ${id}`;
        storyLine = `\n⚠️ La historia no salió: ${esc(e.message)}`;
      }
    }
    const fin = await getPost(id);
    await updateCard(fin);
    await opsSay(`🚀 <b>Publicado en Instagram</b>\n<code>${esc(id)}</code>${r.permalink ? `\n${esc(r.permalink)}` : ''}${storyLine}`);
    return fin;
  } catch (e) {
    if (/tardó demasiado/.test(e.message)) {
      // Videos pesados: se deja aprobado y la próxima hora se intenta de nuevo.
      const back = await setStatus(id, 'approved', { error: e.message });
      await updateCard(back);
      return back;
    }
    const fin = await setStatus(id, 'failed', { error: e.message });
    await updateCard(fin);
    await opsSay(`⚠️ <b>No se pudo publicar</b> <code>${esc(id)}</code>\n${esc(e.message)}`);
    return fin;
  }
}

/** Publica lo aprobado cuya hora ya llegó. */
export async function tick() {
  await ensureSchema();
  const due = await sql()`SELECT id FROM social_posts WHERE status = 'approved' AND scheduled_at <= now() ORDER BY scheduled_at LIMIT 3`;
  const out = [];
  for (const { id } of due) out.push((await publishOne(id)).status);
  return out;
}
