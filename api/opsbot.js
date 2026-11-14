// Webhook del bot de mando: aprobar, descartar, cambiar texto u hora y publicar posts.
// GET /api/opsbot?setup=1 lo conecta (seguro de abrir varias veces).
import { sql, ensureSchema, ADMIN_ID, SITE, esc, logError, recentErrors } from './_demo.js';
import { ensureInboxSchema } from './_upload.js';
import { ops, opsSay, OPS_SECRET, card, updateCard, getPost, setStatus, publishOne, when, sync, tick, kick, lastTick } from './_social.js';
import { runRadar, onNewsCallback, listIdeas } from './_news.js';

const TZ = 'America/Santiago';
const DAYS = { dom: 0, lun: 1, mar: 2, mie: 3, mié: 3, jue: 4, vie: 5, sab: 6, sáb: 6 };

/** Fecha y hora "de Chile" → instante real, respetando el horario de verano. */
function chile(y, mo, d, h, mi) {
  const guess = Date.UTC(y, mo, d, h, mi);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date(guess)).map((p) => [p.type, p.value]));
  const asLocal = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return new Date(guess - (asLocal - guess));
}
function todayChile() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month - 1, d: +p.day, wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) };
}
/** "mañana 19:00", "mié 20:30", "28/10 19:00", "19:00" → Date, o null si no es una hora. */
export function parseWhen(text) {
  const t = text.trim().toLowerCase();
  const m = t.match(/^(hoy|mañana|manana|dom|lun|mar|mi[eé]|jue|vie|s[aá]b|(\d{1,2})\/(\d{1,2}))?\s*(?:a las\s*)?(\d{1,2})(?::(\d{2}))?\s*(?:h|hrs)?$/);
  if (!m) return null;
  const [, day, dd, mm, hh, mi = '0'] = m;
  if (+hh > 23 || +mi > 59) return null;
  const now = todayChile();
  let y = now.y, mo = now.m, d = now.d;
  if (dd) { mo = +mm - 1; d = +dd; }
  else if (day === 'mañana' || day === 'manana') d += 1;
  else if (day && day !== 'hoy') {
    const target = DAYS[day.normalize('NFD').replace(/[̀-ͯ]/g, '')] ?? DAYS[day];
    d += ((target - now.wd + 7) % 7) || 7;
  }
  let at = chile(y, mo, d, +hh, +mi);
  if (!day && at < new Date()) at = chile(y, mo, d + 1, +hh, +mi);
  if (dd && at < new Date()) at = chile(y + 1, mo, d, +hh, +mi);
  return at;
}

const HELP =
  '🎛️ <b>Centro de mando · TopinGames</b>\n\n' +
  'Aquí te llegan los posts que preparo. En cada uno puedes:\n' +
  '✅ <b>Aprobar</b>: sale solo a su hora.\n✏️ <b>Cambiar</b>: me envías el texto nuevo, una hora nueva o una nota.\n' +
  '🚀 <b>Publicar ya</b>, o ❌ <b>Descartar</b>.\n\n' +
  '<b>Comandos</b>\n/pendientes: todos los posts pendientes con botones de aprobar/rechazar\n/purgar: marcar expirados los posts vencidos\n/cola: lo que viene\n/estado: si el reloj de publicación está vivo\n/sync: revisar si hay posts nuevos\n/radar: buscar noticias ahora\n/ideas: noticias que guardaste para hacer post\n/cancelar: salir de una edición\n\n' +
  '📡 Cada mañana a las 9:00 te llega el radar con las 5 noticias del día.\n\n' +
  `Panel completo: ${SITE}/panel`;

async function editing(id) {
  if (id === undefined) {
    const [r] = await sql()`SELECT value FROM settings WHERE key = 'ops_editing'`;
    return r ? r.value : null;
  }
  if (id === null) await sql()`DELETE FROM settings WHERE key = 'ops_editing'`;
  else await sql()`INSERT INTO settings (key, value) VALUES ('ops_editing', ${id})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
  return id;
}

async function onCallback(cb) {
  if (await onNewsCallback(cb)) return;
  const [act, id] = String(cb.data || '').split(/:(.+)/);
  let p = await getPost(id);
  if (!p) return ops('answerCallbackQuery', { callback_query_id: cb.id, text: 'No encontré ese post' });
  // El mensaje con el botón pasa a ser la tarjeta oficial del post.
  if (cb.message && Number(p.tg_message_id) !== cb.message.message_id) {
    await sql()`UPDATE social_posts SET tg_message_id = ${cb.message.message_id} WHERE id = ${id}`;
    p.tg_message_id = cb.message.message_id;
  }
  if (act === 'ok') {
    p = await setStatus(id, 'approved');
    await ops('answerCallbackQuery', { callback_query_id: cb.id, text: `Aprobado · sale ${when(p.scheduled_at)}` });
    if (new Date(p.scheduled_at) <= new Date()) { await updateCard(p); return publishOne(id); }
  } else if (act === 'no') {
    p = await setStatus(id, 'rejected');
    await ops('answerCallbackQuery', { callback_query_id: cb.id, text: 'Descartado' });
  } else if (act === 'back') {
    p = await setStatus(id, 'pending');
    await ops('answerCallbackQuery', { callback_query_id: cb.id });
  } else if (action === 'expire') {
    p = await setStatus(id, 'expired');
    await ops('answerCallbackQuery', { callback_query_id: cb.id, text: 'Marcado como expirado' });
  } else if (act === 'now') {
    await ops('answerCallbackQuery', { callback_query_id: cb.id, text: 'Publicando…' });
    return publishOne(id);
  } else if (act === 'ed') {
    await editing(id);
    await ops('answerCallbackQuery', { callback_query_id: cb.id });
    return opsSay(
      `✏️ Editando <code>${esc(id)}</code>. Envíame:\n\n` +
      '• <b>El texto nuevo completo</b> para reemplazar el actual.\n' +
      '• <b>Una hora</b>: <i>mañana 11:00</i>, <i>vie 10:30</i>, <i>28/10 14:00</i>.\n' +
      '• <b>nota: …</b> si quieres que yo lo rehaga (por ejemplo <i>nota: imagen más oscura</i>).\n\n/cancelar para salir.');
  }
  return updateCard(p);
}

async function onEditText(id, text, messageId) {
  const at = parseWhen(text);
  let p;
  if (at) {
    await sql()`UPDATE social_posts SET scheduled_at = ${at.toISOString()}, updated_at = now() WHERE id = ${id}`;
    p = await getPost(id);
    await opsSay(`🗓️ Nueva hora para <code>${esc(id)}</code>: <b>${esc(when(p.scheduled_at))}</b>`);
  } else if (/^nota\s*:/i.test(text)) {
    p = await setStatus(id, 'changes', { note: text.replace(/^nota\s*:\s*/i, '') });
    await opsSay('📝 Nota guardada. Cuando me escribas en el chat, la tomo y rehago el post.');
  } else {
    await sql()`UPDATE social_posts SET caption = ${text}, status = 'pending', updated_at = now() WHERE id = ${id}`;
    p = await getPost(id);
    await opsSay('✍️ Texto actualizado. Revísalo y apruébalo 👇');
  }
  await editing(null);
  await ops('deleteMessage', { chat_id: ADMIN_ID, message_id: messageId });
  // Tarjeta nueva abajo, para no tener que subir a buscarla.
  if (p.tg_message_id) await ops('deleteMessage', { chat_id: ADMIN_ID, message_id: Number(p.tg_message_id) });
  const sent = await opsSay(card(p).text, { reply_markup: card(p).reply_markup });
  if (sent.ok) await sql()`UPDATE social_posts SET tg_message_id = ${sent.result.message_id} WHERE id = ${id}`;
}

/** Recibe un video, audio o foto enviado directamente al bot y lo guarda en inbox_files. */
async function onMediaMessage(msg) {
  // Telegram puede mandar video, audio, voice, document o photo
  const video     = msg.video;
  const audio     = msg.audio;
  const voice     = msg.voice;
  const document  = msg.document;
  const photos    = msg.photo; // array, tomamos el de mayor resolución

  let file_id, mime, name, size;

  if (video) {
    file_id = video.file_id;
    mime    = video.mime_type || 'video/mp4';
    name    = video.file_name || `video_${Date.now()}.mp4`;
    size    = video.file_size || null;
  } else if (audio) {
    file_id = audio.file_id;
    mime    = audio.mime_type || 'audio/mpeg';
    name    = audio.file_name || `audio_${Date.now()}.mp3`;
    size    = audio.file_size || null;
  } else if (voice) {
    file_id = voice.file_id;
    mime    = 'audio/ogg';
    name    = `voice_${Date.now()}.ogg`;
    size    = voice.file_size || null;
  } else if (document) {
    file_id = document.file_id;
    mime    = document.mime_type || 'application/octet-stream';
    name    = document.file_name || `doc_${Date.now()}`;
    size    = document.file_size || null;
  } else if (photos && photos.length) {
    const p = photos[photos.length - 1]; // mayor resolución
    file_id = p.file_id;
    mime    = 'image/jpeg';
    name    = `photo_${Date.now()}.jpg`;
    size    = p.file_size || null;
  } else {
    return; // tipo no reconocido, ignorar
  }

  const note = msg.caption ? String(msg.caption).slice(0, 500) : null;
  // La URL real se construye con file_id — Claude la descarga via API de Telegram cuando la necesita
  const url  = `tg://file/${file_id}`;

  await ensureInboxSchema();
  const [saved] = await sql()`
    INSERT INTO inbox_files (ut_key, url, name, mime, size_bytes, note)
    VALUES (${file_id}, ${url}, ${name}, ${mime}, ${size}, ${note})
    ON CONFLICT (ut_key) DO NOTHING
    RETURNING id, name`;

  if (saved) {
    const sizeStr = size ? ` · ${(size / 1e6).toFixed(1)} MB` : '';
    await opsSay(`📥 <b>Guardado en inbox</b>\n\n🎬 <code>${esc(name)}</code>${sizeStr}\nID: <code>${saved.id}</code>\n\nSe ve en drpipa.cl/panel → Publicaciones.`);
  } else {
    await opsSay(`⚠️ Este archivo ya estaba en el inbox.`);
  }
}

async function queueList() {
  const rows = await sql()`SELECT id, status, scheduled_at, type FROM social_posts
    WHERE status IN ('pending','approved','changes','failed') ORDER BY scheduled_at LIMIT 15`;
  if (!rows.length) return opsSay('📭 No hay posts en cola. Pídeme una tanda nueva en el chat.');
  const icon = { pending: '⏳', approved: '✅', changes: '✏️', failed: '⚠️' };
  return opsSay('🗓️ <b>Lo que viene</b>\n\n' + rows.map((r) => `${icon[r.status]} ${esc(when(r.scheduled_at))} · <code>${esc(r.id)}</code>`).join('\n') +
    '\n\n⏳ por aprobar · ✅ aprobado · ✏️ con cambios');
}

async function pendientesList() {
  const rows = await sql()`SELECT id, status, scheduled_at, type, caption FROM social_posts
    WHERE status IN ('pending','changes','failed') ORDER BY scheduled_at`;
  if (!rows.length) return opsSay('✅ No hay posts pendientes de aprobación.');
  const now = new Date();
  const icon = { pending: '⏳', changes: '✏️', failed: '⚠️' };
  for (const r of rows) {
    const vencido = new Date(r.scheduled_at) < now;
    const preview = r.caption ? r.caption.slice(0, 80).replace(/\n/g, ' ') + '…' : '(sin caption)';
    const txt = `${icon[r.status] || '⏳'} <b>${esc(r.id)}</b>\n📅 ${esc(when(r.scheduled_at))}${vencido ? ' · <b>VENCIDO</b>' : ''}\n📝 ${esc(preview)}`;
    await ops('sendMessage', {
      chat_id: ADMIN_ID,
      text: txt,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Aprobar', callback_data: `approve:${r.id}` },
          { text: '❌ Rechazar', callback_data: `reject:${r.id}` },
          { text: '✏️ Cambios', callback_data: `edit:${r.id}` },
        ], vencido ? [{ text: '🗑️ Marcar expirado', callback_data: `expire:${r.id}` }] : []].filter(row => row.length)
      }
    });
  }
  await opsSay(`📋 ${rows.length} post${rows.length > 1 ? 's' : ''} pendiente${rows.length > 1 ? 's' : ''}. Usa los botones para aprobar, rechazar o pedir cambios.`);
}

async function purgeExpired() {
  const now = new Date();
  const rows = await sql()`SELECT id FROM social_posts
    WHERE status IN ('pending','changes') AND scheduled_at < now() - interval '2 hours'`;
  if (!rows.length) return opsSay('✅ No hay posts vencidos para purgar.');
  for (const r of rows) await setStatus(r.id, 'expired');
  await opsSay(`🗑️ ${rows.length} post${rows.length > 1 ? 's' : ''} marcado${rows.length > 1 ? 's' : ''} como expirado${rows.length > 1 ? 's' : ''}.`);
}

async function statusReport() {
  const last = await lastTick();
  const mins = last ? Math.round((Date.now() - last.getTime()) / 60000) : null;
  const next = await sql()`SELECT id, status, scheduled_at FROM social_posts WHERE status IN ('approved','publishing','failed')
    ORDER BY scheduled_at LIMIT 5`;
  const late = next.filter((r) => r.status === 'approved' && new Date(r.scheduled_at) < new Date());
  let t = `🩺 <b>Estado de publicaciones</b>\n\n⏱️ Último chequeo del reloj: ${last ? (mins < 1 ? 'hace menos de 1 min' : `hace ${mins} min`) : 'nunca'}\n`;
  t += mins !== null && mins <= 15 ? '🟢 Reloj activo.\n' : '🔴 El reloj externo (cron-job.org) no está corriendo. Respaldo activo: salen igual con visitas al sitio o cuando me escribes aquí, pero pueden atrasarse.\n';
  t += next.length ? '\n' + next.map((r) => `${{ approved: '✅', publishing: '📤', failed: '⚠️' }[r.status]} ${esc(when(r.scheduled_at))} · <code>${esc(r.id)}</code>${new Date(r.scheduled_at) < new Date() && r.status === 'approved' ? ' · ¡atrasado!' : ''}`).join('\n') : '\nNo hay posts aprobados esperando.';
  await opsSay(t);
  // Escribirme aquí también mueve el reloj: si había algo atrasado, sale ahora.
  if (late.length) await tick('kick');
}

export default async function handler(req, res) {
  if (req.method === 'GET' && req.query.setup) {
    if (!OPS_SECRET) return res.status(500).json({ error: 'Falta TELEGRAM_OPS_BOT_TOKEN en Vercel' });
    const me = await ops('getMe', {});
    const hook = await ops('setWebhook', { url: `${SITE}/api/opsbot`, secret_token: OPS_SECRET, allowed_updates: ['message', 'callback_query'] });
    await ops('setMyCommands', { commands: [
      { command: 'pendientes', description: 'Ver todos los posts por aprobar con botones' }, { command: 'purgar', description: 'Marcar expirados los posts vencidos' },
      { command: 'cola', description: 'Lo que viene (próximos 15)' }, { command: 'estado', description: 'Estado del reloj de publicación' }, { command: 'sync', description: 'Revisar posts nuevos' },
      { command: 'radar', description: 'Buscar noticias ahora' }, { command: 'ideas', description: 'Ideas guardadas del radar' },
      { command: 'errores', description: 'Errores de las últimas 24h' },
      { command: 'cancelar', description: 'Salir de una edición' }, { command: 'ayuda', description: 'Cómo funciona' },
    ] });
    await ensureSchema();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ bot: me.ok ? '@' + me.result.username : me.description, webhook: hook.ok ? 'ok' : hook.description, admin: Boolean(ADMIN_ID) });
  }
  if (!OPS_SECRET || req.method !== 'POST' || req.headers['x-telegram-bot-api-secret-token'] !== OPS_SECRET) {
    res.statusCode = 401;
    return res.end();
  }
  const u = req.body || {};
  try {
    await ensureSchema();
    const from = (u.callback_query || u.message || {}).from || {};
    if (!ADMIN_ID || from.id !== ADMIN_ID) {
      if (u.message) await ops('sendMessage', { chat_id: u.message.chat.id, text: '🔒 Este es un bot privado de TopinGames.' });
    } else if (u.callback_query) {
      await onCallback(u.callback_query);
      await kick();
    } else if (u.message) {
      await kick();
      // Si el mensaje trae un archivo (video, audio, foto, documento) → inbox
      if (u.message.video || u.message.audio || u.message.voice || u.message.document || u.message.photo) {
        await onMediaMessage(u.message);
      } else {
      const text = String(u.message.text || '').trim();
      const editId = await editing();
      if (text === '/cancelar') { await editing(null); await opsSay('Listo, sin cambios.'); }
      else if (text.startsWith('/pendientes')) await pendientesList();
      else if (text.startsWith('/purgar')) await purgeExpired();
      else if (text.startsWith('/cola')) await queueList();
      else if (text.startsWith('/estado')) await statusReport();
      else if (text.startsWith('/radar')) {
        await opsSay('📡 Buscando noticias…');
        await runRadar();
      } else if (text.startsWith('/ideas')) await listIdeas();
      else if (text.startsWith('/sync')) {
        const r = await sync();
        await opsSay(`🔄 Cola revisada: ${r.added} nuevos, ${r.updated} actualizados (${r.total} en total).`);
      } else if (text.startsWith('/errores')) {
        const hrs = parseInt(text.split(' ')[1]) || 24;
        const errs = await recentErrors(hrs, 15);
        if (!errs.length) { await opsSay(`✅ Sin errores en las últimas ${hrs}h.`); }
        else {
          const lines = errs.map((e) => {
            const t = new Date(e.created_at).toLocaleString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit' });
            const ctx = e.ctx && Object.keys(e.ctx).length ? ' · ' + JSON.stringify(e.ctx) : '';
            return `⚠️ <code>${esc(e.fn)}</code> ${t}\n   ${esc(e.message)}${ctx}`;
          });
          await opsSay(`🪵 <b>${errs.length} error${errs.length > 1 ? 'es' : ''} (últimas ${hrs}h)</b>\n\n${lines.join('\n\n')}`);
        }
      } else if (text.startsWith('/start') || text.startsWith('/ayuda')) await opsSay(HELP);
      else if (editId && text) await onEditText(editId, text, u.message.message_id);
      else await opsSay('Toca ✏️ <b>Cambiar</b> en un post para editarlo, o usa /cola.');
      } // end else (no es archivo)
    }
  } catch (e) {
    console.log(JSON.stringify({ opsbot_error: String((e && e.message) || e) }));
    await logError('opsbot', e, { update_id: u.update_id });
    if (ADMIN_ID) await opsSay('⚠️ Algo falló: ' + esc(e.message));
  }
  res.statusCode = 200;
  res.end('ok');
}

