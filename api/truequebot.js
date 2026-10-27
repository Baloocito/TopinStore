// Bot de TopinStore (@TopinStoreBot): el comprador toca "Lo quiero", el bot le muestra el producto y le avisa a Xiombo.
// Los mensajes van y vienen a través del bot, así que nadie ve el número ni el usuario del otro.
// GET /api/truequebot?setup=1 lo conecta (seguro de abrir varias veces).
import { sql, ensureSchema, ADMIN_ID, esc, SITE } from './_demo.js';
import { tq, tqSay, TQ_SECRET, STORE, product, price, CONDITION, productUrl } from './_tq.js';

const storeBtn = { text: '🛍️ Ver toda la tienda', url: STORE };
const nameOf = (u) => [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Alguien';
const who = (u) => `${esc(nameOf(u))}${u.username ? ' (@' + esc(u.username) + ')' : ''}`;

async function remember(adminMsgId, userId) {
  if (!adminMsgId) return;
  await sql()`INSERT INTO trueque_relay (admin_msg_id, tg_user_id) VALUES (${adminMsgId}, ${userId})
    ON CONFLICT (admin_msg_id) DO NOTHING`;
}
async function setChat(userId, p) {
  await sql()`INSERT INTO trueque_chats (tg_user_id, product_id, product_name) VALUES (${userId}, ${p.id}, ${p.name})
    ON CONFLICT (tg_user_id) DO UPDATE SET product_id = EXCLUDED.product_id, product_name = EXCLUDED.product_name, updated_at = now()`;
}
async function getChat(userId) {
  const [r] = await sql()`SELECT product_id, product_name FROM trueque_chats WHERE tg_user_id = ${userId}`;
  return r || null;
}

/* ---------- Comprador ---------- */
async function showProduct(chatId, user, id) {
  const p = await product(id);
  if (!p || p.status === 'en_reparacion') {
    return tqSay(chatId, 'No encontré ese producto 🤔 Puede que ya no esté publicado. Mira lo que hay ahora en la tienda 👇',
      { reply_markup: { inline_keyboard: [[storeBtn]] } });
  }
  await setChat(user.id, p);
  const desc = String(p.description || '').trim();
  const lines = [
    `<b>${esc(p.name)}</b>`,
    `💰 <b>${price(p.sale_price)}</b> · ${esc(CONDITION[p.condition] || p.condition)}`,
  ];
  if (desc) lines.push('', esc(desc.length > 350 ? desc.slice(0, 347) + '…' : desc));
  let rows;
  if (p.status === 'vendido') {
    lines.push('', '😢 <b>Este ya se vendió.</b> Pero siempre llegan cosas nuevas.');
    rows = [[storeBtn]];
  } else if (p.status === 'reservado') {
    lines.push('', '⏳ <b>Está reservado.</b> Si se libera, te aviso primero.');
    rows = [[{ text: '🔔 Avísame si se libera', callback_data: 'want:' + p.id }], [storeBtn]];
  } else {
    rows = [
      [{ text: '🙋 Lo quiero', callback_data: 'want:' + p.id }],
      [{ text: '❓ Tengo una pregunta', callback_data: 'ask:' + p.id }],
      [{ text: '🔎 Ver fotos y detalles', url: productUrl(p.id) }],
    ];
  }
  const caption = lines.join('\n');
  const photo = (p.images || [])[0];
  if (photo && caption.length <= 1024) {
    const r = await tq('sendPhoto', { chat_id: chatId, photo, caption, parse_mode: 'HTML', reply_markup: { inline_keyboard: rows } });
    if (r.ok) return r;
  }
  return tqSay(chatId, caption, { reply_markup: { inline_keyboard: rows } });
}

async function onBuyerCallback(cb) {
  const [act, id] = String(cb.data || '').split(':');
  const user = cb.from;
  const p = await product(id);
  if (!p) return tq('answerCallbackQuery', { callback_query_id: cb.id, text: 'Ese producto ya no está publicado', show_alert: true });
  await setChat(user.id, p);
  if (act === 'ask') {
    await tq('answerCallbackQuery', { callback_query_id: cb.id });
    return tqSay(user.id, `Escríbeme tu pregunta sobre <b>${esc(p.name)}</b> y se la paso a Xiombo 👇`);
  }
  if (act !== 'want') return tq('answerCallbackQuery', { callback_query_id: cb.id });
  // Un mismo comprador no avisa dos veces por el mismo producto en el día.
  const [dup] = await sql()`SELECT 1 FROM trueque_leads WHERE tg_user_id = ${user.id} AND product_id = ${p.id}
    AND kind = 'want' AND created_at > now() - interval '1 day'`;
  await tq('answerCallbackQuery', { callback_query_id: cb.id, text: dup ? 'Ya le avisé 👌' : '¡Listo!' });
  if (dup) return;
  await sql()`INSERT INTO trueque_leads (product_id, product_name, price, kind, tg_user_id, tg_username, tg_name)
    VALUES (${p.id}, ${p.name}, ${p.sale_price}, 'want', ${user.id}, ${user.username || null}, ${nameOf(user)})`;
  const reserved = p.status === 'reservado';
  await tqSay(user.id, reserved
    ? '🔔 Anotado. Le avisé a Xiombo que te interesa por si se libera.\n\nSi quieres agregar algo, escríbelo aquí.'
    : '🙌 <b>¡Le avisé a Xiombo!</b> Te va a responder por aquí mismo.\n\nMientras, si quieres, cuéntale cómo prefieres recibirlo (retiro o envío) o cualquier duda.');
  if (!ADMIN_ID) return;
  const sent = await tqSay(ADMIN_ID,
    `${reserved ? '🔔 <b>Interesado en un reservado</b>' : '🛍️ <b>¡Alguien lo quiere!</b>'}\n\n` +
    `📦 ${esc(p.name)} · <b>${price(p.sale_price)}</b>\n👤 ${who(user)}\n\n` +
    '↩️ <i>Responde a este mensaje para hablarle. Nadie ve tu número.</i>',
    { reply_markup: { inline_keyboard: [[{ text: '🔎 Ver producto', url: productUrl(p.id) }]] } });
  if (sent.ok) await remember(sent.result.message_id, user.id);
}

async function onBuyerMessage(m) {
  const user = m.from;
  const text = String(m.text || '').trim();
  if (text.startsWith('/start')) {
    const arg = text.split(/\s+/)[1] || '';
    if (arg.startsWith('p_')) return showProduct(m.chat.id, user, arg.slice(2));
    return tqSay(m.chat.id,
      '👋 ¡Hola! Soy el bot de <b>TopinStore</b>, la tienda de usados y gadgets de Xiombo × TopinGames.\n\n' +
      'Elige algo en la tienda y toca <b>Lo quiero</b>: te traigo aquí con el producto listo y le aviso a Xiombo.',
      { reply_markup: { inline_keyboard: [[storeBtn]] } });
  }
  const chat = await getChat(user.id);
  const header = await tqSay(ADMIN_ID,
    `💬 ${who(user)}${chat ? ` · sobre <b>${esc(chat.product_name)}</b>` : ''}\n<i>↩️ Responde para contestarle</i>`);
  const copy = await tq('copyMessage', { chat_id: ADMIN_ID, from_chat_id: m.chat.id, message_id: m.message_id });
  if (header.ok) await remember(header.result.message_id, user.id);
  if (copy.ok) await remember(copy.result.message_id, user.id);
  if (chat && !(await sql()`SELECT 1 FROM trueque_leads WHERE tg_user_id = ${user.id} AND product_id = ${chat.product_id}
      AND created_at > now() - interval '1 day'`).length) {
    await sql()`INSERT INTO trueque_leads (product_id, product_name, kind, tg_user_id, tg_username, tg_name)
      VALUES (${chat.product_id}, ${chat.product_name}, 'ask', ${user.id}, ${user.username || null}, ${nameOf(user)})`;
  }
  await tq('setMessageReaction', { chat_id: m.chat.id, message_id: m.message_id, reaction: [{ type: 'emoji', emoji: '👀' }] });
}

/* ---------- Xiombo ---------- */
const ADMIN_HELP =
  '🛍️ <b>Bot de TopinStore · modo dueño</b>\n\n' +
  'Cuando alguien toca <b>Lo quiero</b> o escribe una pregunta, te llega aquí.\n' +
  '↩️ <b>Responde</b> (desliza) a su mensaje y le llega a esa persona: texto, fotos, audios o ubicación.\n\n' +
  '/interesados: los últimos interesados\n\n' +
  `Tienda: ${STORE}\nPanel: ${STORE}/admin`;

async function onAdminMessage(m) {
  const text = String(m.text || '').trim();
  const reply = m.reply_to_message;
  if (reply) {
    const [r] = await sql()`SELECT tg_user_id FROM trueque_relay WHERE admin_msg_id = ${reply.message_id}`;
    if (!r) return tqSay(ADMIN_ID, 'No sé a quién va eso 🤔 Responde directamente al mensaje del comprador.');
    const sent = await tq('copyMessage', { chat_id: Number(r.tg_user_id), from_chat_id: m.chat.id, message_id: m.message_id });
    if (sent.ok) {
      await remember(m.message_id, Number(r.tg_user_id));
      return tq('setMessageReaction', { chat_id: m.chat.id, message_id: m.message_id, reaction: [{ type: 'emoji', emoji: '👍' }] });
    }
    return tqSay(ADMIN_ID, '⚠️ No le llegó: puede que haya bloqueado el bot.');
  }
  if (text.startsWith('/interesados')) {
    const rows = await sql()`SELECT product_name, kind, tg_name, tg_username, created_at FROM trueque_leads
      ORDER BY created_at DESC LIMIT 10`;
    if (!rows.length) return tqSay(ADMIN_ID, 'Todavía no hay interesados. Comparte un producto y aparecerán aquí.');
    return tqSay(ADMIN_ID, '🛍️ <b>Últimos interesados</b>\n\n' + rows.map((r) =>
      `${r.kind === 'want' ? '🙋' : '❓'} ${esc(r.product_name)} · ${esc(r.tg_name)}${r.tg_username ? ' @' + esc(r.tg_username) : ''} · ` +
      new Date(r.created_at).toLocaleDateString('es-CL', { timeZone: 'America/Santiago', day: 'numeric', month: 'short' })).join('\n'));
  }
  if (text.startsWith('/start')) {
    const arg = text.split(/\s+/)[1] || '';
    if (arg.startsWith('p_')) return showProduct(m.chat.id, m.from, arg.slice(2));
  }
  return tqSay(ADMIN_ID, ADMIN_HELP);
}

export default async function handler(req, res) {
  if (req.method === 'GET' && req.query.setup) {
    if (!TQ_SECRET) return res.status(500).json({ error: 'Falta TELEGRAM_TRUEQUE_BOT_TOKEN en Vercel' });
    const me = await tq('getMe', {});
    const hook = await tq('setWebhook', {
      url: `${SITE}/api/truequebot`, secret_token: TQ_SECRET,
      allowed_updates: ['message', 'callback_query'],
    });
    await tq('setMyCommands', { commands: [{ command: 'start', description: 'Inicio' }] });
    await tq('setMyDescription', { description: 'TopinStore: usados con historia y gadgets de Xiombo × TopinGames. Toca "Lo quiero" en la tienda y te atiendo por aquí, sin compartir números.' });
    await tq('setMyShortDescription', { short_description: 'Tienda de usados y gadgets · drpipa.cl/tienda' });
    await ensureSchema();
    if (me.ok) await sql()`INSERT INTO settings (key, value) VALUES ('tq_bot_username', ${me.result.username})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ bot: me.ok ? '@' + me.result.username : me.description, webhook: hook.ok ? 'ok' : hook.description, admin: Boolean(ADMIN_ID) });
  }
  if (!TQ_SECRET || req.method !== 'POST' || req.headers['x-telegram-bot-api-secret-token'] !== TQ_SECRET) {
    res.statusCode = 401;
    return res.end();
  }
  const u = req.body || {};
  try {
    await ensureSchema();
    const from = (u.callback_query || u.message || {}).from || {};
    const isAdmin = ADMIN_ID && from.id === ADMIN_ID;
    if (u.callback_query) await onBuyerCallback(u.callback_query);
    else if (u.message && u.message.chat.type === 'private') {
      if (isAdmin) await onAdminMessage(u.message);
      else await onBuyerMessage(u.message);
    }
  } catch (e) {
    console.log(JSON.stringify({ truequebot_error: String((e && e.message) || e) }));
  }
  res.statusCode = 200;
  res.end('ok');
}
