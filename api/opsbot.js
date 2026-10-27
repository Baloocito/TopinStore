// Webhook del bot de mando: aprobar, descartar, cambiar texto u hora y publicar posts.
// GET /api/opsbot?setup=1 lo conecta (seguro de abrir varias veces).
import { sql, ensureSchema, ADMIN_ID, SITE, esc } from './_demo.js';
import { ops, opsSay, OPS_SECRET, card, updateCard, getPost, setStatus, publishOne, when, sync } from './_social.js';

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
  '<b>Comandos</b>\n/cola: lo que viene\n/sync: revisar si hay posts nuevos\n/cancelar: salir de una edición\n\n' +
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

async function queueList() {
  const rows = await sql()`SELECT id, status, scheduled_at, type FROM social_posts
    WHERE status IN ('pending','approved','changes','failed') ORDER BY scheduled_at LIMIT 15`;
  if (!rows.length) return opsSay('📭 No hay posts en cola. Pídeme una tanda nueva en el chat.');
  const icon = { pending: '⏳', approved: '✅', changes: '✏️', failed: '⚠️' };
  return opsSay('🗓️ <b>Lo que viene</b>\n\n' + rows.map((r) => `${icon[r.status]} ${esc(when(r.scheduled_at))} · <code>${esc(r.id)}</code>`).join('\n') +
    '\n\n⏳ por aprobar · ✅ aprobado · ✏️ con cambios');
}

export default async function handler(req, res) {
  if (req.method === 'GET' && req.query.setup) {
    if (!OPS_SECRET) return res.status(500).json({ error: 'Falta TELEGRAM_OPS_BOT_TOKEN en Vercel' });
    const me = await ops('getMe', {});
    const hook = await ops('setWebhook', { url: `${SITE}/api/opsbot`, secret_token: OPS_SECRET, allowed_updates: ['message', 'callback_query'] });
    await ops('setMyCommands', { commands: [
      { command: 'cola', description: 'Lo que viene' }, { command: 'sync', description: 'Revisar posts nuevos' },
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
    } else if (u.message) {
      const text = String(u.message.text || '').trim();
      const editId = await editing();
      if (text === '/cancelar') { await editing(null); await opsSay('Listo, sin cambios.'); }
      else if (text.startsWith('/cola')) await queueList();
      else if (text.startsWith('/sync')) {
        const r = await sync();
        await opsSay(`🔄 Cola revisada: ${r.added} nuevos, ${r.updated} actualizados (${r.total} en total).`);
      } else if (text.startsWith('/start') || text.startsWith('/ayuda')) await opsSay(HELP);
      else if (editId && text) await onEditText(editId, text, u.message.message_id);
      else await opsSay('Toca ✏️ <b>Cambiar</b> en un post para editarlo, o usa /cola.');
    }
  } catch (e) {
    console.log(JSON.stringify({ opsbot_error: String((e && e.message) || e) }));
    if (ADMIN_ID) await opsSay('⚠️ Algo falló: ' + esc(e.message));
  }
  res.statusCode = 200;
  res.end('ok');
}

