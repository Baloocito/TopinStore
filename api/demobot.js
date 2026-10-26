// Webhook de @TopinDemoBot: verifica donaciones de Mercado Pago y entrega la demo de Faro Hundido.
// La conversación funciona como una app: un solo "panel" que se edita en su lugar,
// y los mensajes que escribe la persona se borran después de leerlos para que el chat quede limpio.
import {
  tg, say, notifyAdmin, esc, checkPayment, sql, ensureSchema,
  ADMIN_ID, WEBHOOK_SECRET, PLATFORMS, MIN_AMOUNT, MAX_AGE_DAYS, SITE,
} from './_demo.js';

const clp = (n) => '$' + Math.round(n).toLocaleString('es-CL');
const LINKS = {
  game: `${SITE}/faro?src=demobot`,
  support: `${SITE}/?src=demobot`,
  channel: 'https://t.me/TopinSaleSwitch',
  instagram: 'https://www.instagram.com/topingames_',
};

/* ---------- Textos ---------- */

const REASONS = {
  not_found: '🤔 <b>No encontré esa donación.</b>\nRevisa que sea el <b>número de operación</b> del comprobante y que hayas donado desde drpipa.cl.',
  pending: '⏳ <b>Tu pago sigue en proceso.</b>\nCuando Mercado Pago lo apruebe, vuelve a enviarme el número.',
  not_approved: '❌ <b>Ese pago no figura como aprobado</b>, así que no puedo entregar la demo con él.',
  too_low: `💡 <b>La demo se regala desde ${clp(MIN_AMOUNT)}.</b>\nEse pago es de un monto menor.`,
  too_old: `📅 <b>Ese pago tiene más de ${MAX_AGE_DAYS} días.</b>\nSi crees que es un error, escríbeme en Instagram @topingames_.`,
  used: '🔒 <b>Esa donación ya se canjeó.</b>\nCada donación entrega una demo.',
  mp_error: '⚠️ <b>No pude conectarme con Mercado Pago.</b>\nIntenta de nuevo en unos minutos.',
};

const INSTALL = {
  pc: '🖥️ <b>Faro Hundido · Demo para PC</b>\n\n1. Descarga y descomprime el archivo.\n2. Abre el ejecutable del juego.\n' +
    '3. Si Windows avisa, toca <i>Más información</i> → <i>Ejecutar de todas formas</i>.',
  android_apk: '📱 <b>Faro Hundido · Demo para Android</b>\n\n1. Toca el archivo para descargarlo.\n2. Ábrelo y toca <i>Instalar</i>.\n' +
    '3. Si el teléfono lo bloquea, activa <i>Permitir de esta fuente</i> y vuelve a tocar <i>Instalar</i>.',
  android_zip: '📱 <b>Faro Hundido · Demo para Android</b>\n\n1. Descarga el archivo y descomprímelo con tu app de Archivos.\n' +
    '2. Abre el archivo <b>.apk</b> y toca <i>Instalar</i>.\n3. Si el teléfono lo bloquea, activa <i>Permitir de esta fuente</i>.',
};

const btn = (text, data) => ({ text, callback_data: data });
const url = (text, href) => ({ text, url: href });
const BACK = [btn('⬅️ Volver al menú', 'v:menu')];

const VIEWS = {
  menu: () => ({
    text:
      '🔦 <b>FARO HUNDIDO · DEMOS</b>\n\n' +
      'Un roguelike de acción en 32 bits donde tu luz es tu vida, tu vista y tu dinero.\n\n' +
      `🎁 Si donaste <b>${clp(MIN_AMOUNT)} o más</b> con Mercado Pago, canjea aquí tu demo para <b>PC o Android</b>.`,
    keyboard: [
      [btn('🎁 Canjear mi demo', 'v:redeem')],
      [url('🔦 Conocer el juego', LINKS.game), btn('❓ Ayuda', 'v:help')],
      [url('💛 Apoyar el desarrollo', LINKS.support)],
      [url('🎮 Ofertas de Switch', LINKS.channel)],
    ],
  }),
  redeem: (note) => ({
    text: (note ? note + '\n\n' : '') +
      '📩 <b>Envíame el número de operación</b> de tu comprobante de Mercado Pago.\n\n' +
      '<i>Escríbelo aquí abajo, solo los números.</i>',
    keyboard: [[btn('🧾 ¿Dónde está el número?', 'v:where')], BACK],
  }),
  where: () => ({
    text:
      '🧾 <b>¿Dónde está el número de operación?</b>\n\n' +
      '• <b>App de Mercado Pago:</b> Actividad → toca tu donación → <i>Número de operación</i>.\n' +
      '• <b>Correo:</b> en el comprobante que te llegó al pagar.\n\n' +
      'Es un número largo, como <code>123456789012</code>. Cópialo y envíamelo aquí.',
    keyboard: [[btn('📩 Ya lo tengo', 'v:redeem')], BACK],
  }),
  help: () => ({
    text:
      '❓ <b>AYUDA</b>\n\n' +
      `<b>¿Cómo consigo la demo?</b>\nDona ${clp(MIN_AMOUNT)} o más desde drpipa.cl con Mercado Pago y canjea aquí el número de operación.\n\n` +
      '<b>¿Doné desde otro país?</b>\nEn Ko-fi eliges la demo al donar y te llega directo, sin pasar por este bot.\n\n' +
      '<b>Android no deja instalar</b>\nActiva <i>Permitir de esta fuente</i> para la app desde donde abres el archivo.\n\n' +
      '<b>Windows muestra una advertencia</b>\nToca <i>Más información</i> → <i>Ejecutar de todas formas</i>. Pasa con juegos indie sin firma.\n\n' +
      '<b>¿Otro problema?</b> Escríbeme en Instagram @topingames_.',
    keyboard: [[btn('🎁 Canjear mi demo', 'v:redeem')], [url('💬 Instagram @topingames_', LINKS.instagram)], BACK],
  }),
  confirmed: (amount, id) => ({
    text: `✅ <b>¡Donación confirmada!</b> ${clp(amount)}\nGracias por encender el faro.\n\n<b>¿Dónde vas a jugar?</b>`,
    keyboard: [[btn('🖥️ PC', `get:pc:${id}`), btn('📱 Android', `get:android:${id}`)], BACK],
  }),
  delivered: (platform) => ({
    text:
      `🎉 <b>¡Listo! Tu demo de ${PLATFORMS[platform]} está arriba.</b>\n\n` +
      'Cuando la juegues, cuéntame qué te pareció en Instagram @topingames_. Tu opinión da forma al juego.',
    keyboard: [[url('🔦 Ver el juego', LINKS.game), url('🎮 Ofertas de Switch', LINKS.channel)], BACK],
  }),
  waiting: (platform) => ({
    text: `🛠️ <b>Tu canje quedó guardado.</b>\n\nEstoy terminando la versión de ${PLATFORMS[platform]}. Te la envío aquí apenas esté lista.`,
    keyboard: [[url('🔦 Ver el juego', LINKS.game)], BACK],
  }),
};

/* ---------- Panel: un solo mensaje que se va editando ---------- */

async function getSession(user) {
  const [s] = await sql()`SELECT panel_id, mode FROM demo_sessions WHERE tg_user_id = ${user}`;
  return s || { panel_id: null, mode: 'menu' };
}
async function saveSession(user, panelId, mode) {
  await sql()`
    INSERT INTO demo_sessions (tg_user_id, panel_id, mode) VALUES (${user}, ${panelId}, ${mode})
    ON CONFLICT (tg_user_id) DO UPDATE SET panel_id = EXCLUDED.panel_id, mode = EXCLUDED.mode, updated_at = now()`;
}

/** Muestra una vista. Edita el panel existente; si no se puede o se pide `fresh`, lo reemplaza por uno nuevo abajo. */
async function show(chat, view, mode, { fresh = false, session } = {}) {
  const s = session || (await getSession(chat));
  const markup = { inline_keyboard: view.keyboard };
  if (s.panel_id && !fresh) {
    const r = await tg('editMessageText', {
      chat_id: chat, message_id: Number(s.panel_id), text: view.text, parse_mode: 'HTML',
      disable_web_page_preview: true, reply_markup: markup,
    });
    if (r.ok || /not modified/.test(r.description || '')) {
      await saveSession(chat, s.panel_id, mode);
      return;
    }
  }
  if (s.panel_id) await tg('deleteMessage', { chat_id: chat, message_id: Number(s.panel_id) });
  const sent = await say(chat, view.text, { reply_markup: markup });
  await saveSession(chat, sent.ok ? sent.result.message_id : null, mode);
}

const forget = (chat, messageId) => tg('deleteMessage', { chat_id: chat, message_id: messageId });

/* ---------- Entrega ---------- */

async function sendDemo(chat, platform, paymentId) {
  const [file] = await sql()`SELECT file_id, file_name FROM demo_files WHERE platform = ${platform}`;
  if (!file) {
    await notifyAdmin(`⚠️ Alguien canjeó la demo de <b>${PLATFORMS[platform]}</b> y no hay archivo cargado.`);
    return false;
  }
  const key = platform === 'android' ? (/\.apk$/i.test(file.file_name || '') ? 'android_apk' : 'android_zip') : 'pc';
  const sent = await tg('sendDocument', { chat_id: chat, document: file.file_id, caption: INSTALL[key], parse_mode: 'HTML' });
  if (sent.ok && paymentId) await sql()`UPDATE demo_claims SET delivered = true WHERE payment_id = ${paymentId}`;
  return sent.ok;
}

/** Envía el archivo y deja el panel debajo, para que el chat termine siempre en el menú. */
async function deliver(chat, platform, paymentId) {
  const ok = await sendDemo(chat, platform, paymentId);
  await show(chat, ok ? VIEWS.delivered(platform) : VIEWS.waiting(platform), 'menu', { fresh: true });
}

/* ---------- Pasos del flujo ---------- */

async function onPaymentNumber(chat, user, id) {
  await tg('sendChatAction', { chat_id: chat, action: 'typing' });
  const r = await checkPayment(id);
  if (!r.ok) return show(chat, VIEWS.redeem(REASONS[r.reason] || REASONS.not_found), 'redeem');

  const [claim] = await sql()`SELECT tg_user_id, platform FROM demo_claims WHERE payment_id = ${id}`;
  if (claim && Number(claim.tg_user_id) !== user) return show(chat, VIEWS.redeem(REASONS.used), 'redeem');
  if (claim) return deliver(chat, claim.platform, id);
  return show(chat, VIEWS.confirmed(r.payment.amount, id), 'choose');
}

async function onChoosePlatform(cb, platform, id) {
  const chat = cb.message.chat.id;
  const u = cb.from;
  await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'Revisando tu donación…' });
  const r = await checkPayment(id); // se vuelve a verificar: el botón pudo quedar viejo
  if (!r.ok) return show(chat, VIEWS.redeem(REASONS[r.reason] || REASONS.not_found), 'redeem');

  const name = [u.first_name, u.last_name].filter(Boolean).join(' ');
  const inserted = await sql()`
    INSERT INTO demo_claims (payment_id, tg_user_id, tg_username, tg_name, platform, amount)
    VALUES (${id}, ${u.id}, ${u.username || null}, ${name || null}, ${platform}, ${r.payment.amount})
    ON CONFLICT (payment_id) DO NOTHING
    RETURNING payment_id`;
  const [claim] = inserted.length ? [{ tg_user_id: u.id, platform }]
    : await sql()`SELECT tg_user_id, platform FROM demo_claims WHERE payment_id = ${id}`;
  if (Number(claim.tg_user_id) !== u.id) return show(chat, VIEWS.redeem(REASONS.used), 'redeem');

  if (inserted.length) {
    await notifyAdmin(
      `🎁 <b>Nuevo canje</b>\n${esc(name || 'Sin nombre')}${u.username ? ' (@' + esc(u.username) + ')' : ''}\n` +
      `${PLATFORMS[platform]} · ${clp(r.payment.amount)} · operación <code>${esc(id)}</code>`);
  }
  return deliver(chat, claim.platform, id);
}

/* ---------- Comandos del admin (no se muestran a nadie más) ---------- */

async function onAdmin(msg, text) {
  const chat = msg.chat.id;
  const doc = msg.document || (msg.reply_to_message && msg.reply_to_message.document);
  const m = text.match(/^\/demo_(pc|android)\b/);
  if (m) {
    if (!doc) return say(chat, `Envíame el archivo con el texto <code>/demo_${m[1]}</code>, o responde al archivo con ese comando.`);
    await sql()`
      INSERT INTO demo_files (platform, file_id, file_name) VALUES (${m[1]}, ${doc.file_id}, ${doc.file_name || null})
      ON CONFLICT (platform) DO UPDATE SET file_id = EXCLUDED.file_id, file_name = EXCLUDED.file_name, updated_at = now()`;
    const pending = await sql()`SELECT payment_id, tg_user_id FROM demo_claims WHERE platform = ${m[1]} AND delivered = false`;
    let ok = 0;
    for (const p of pending) {
      const chatId = Number(p.tg_user_id);
      if (await sendDemo(chatId, m[1], p.payment_id)) {
        ok++;
        await show(chatId, VIEWS.delivered(m[1]), 'menu', { fresh: true });
      }
    }
    return say(chat, `✅ Demo de <b>${PLATFORMS[m[1]]}</b> actualizada: ${esc(doc.file_name || 'archivo')}` +
      (pending.length ? `\nEnviada a ${ok} de ${pending.length} personas que la estaban esperando.` : ''));
  }
  if (text.startsWith('/estado')) {
    const files = await sql()`SELECT platform, file_name FROM demo_files ORDER BY platform`;
    const stats = await sql()`SELECT platform, count(*)::int AS n, coalesce(sum(amount),0)::int AS total FROM demo_claims GROUP BY platform`;
    const last = await sql()`SELECT tg_name, tg_username, platform, amount FROM demo_claims ORDER BY created_at DESC LIMIT 5`;
    const total = stats.reduce((a, s) => a + s.total, 0);
    const lines = [
      '📊 <b>Estado del bot</b>', '', '<b>Archivos</b>',
      ...Object.keys(PLATFORMS).map((p) => {
        const f = files.find((x) => x.platform === p);
        return `${PLATFORMS[p]}: ${f ? '✅ ' + esc(f.file_name || 'cargado') : '❌ falta (envíalo con /demo_' + p + ')'}`;
      }),
      '', '<b>Canjes</b>',
      ...Object.keys(PLATFORMS).map((p) => `${PLATFORMS[p]}: ${(stats.find((s) => s.platform === p) || { n: 0 }).n}`),
      `Total donado por canjes: ${clp(total)}`,
    ];
    if (last.length) {
      lines.push('', '<b>Últimos</b>');
      for (const l of last) lines.push(`• ${esc(l.tg_name || l.tg_username || '—')} · ${PLATFORMS[l.platform]} · ${clp(l.amount)}`);
    }
    return say(chat, lines.join('\n'));
  }
  return null;
}

/* ---------- Entrada ---------- */

export default async function handler(req, res) {
  if (!WEBHOOK_SECRET || req.method !== 'POST' || req.headers['x-telegram-bot-api-secret-token'] !== WEBHOOK_SECRET) {
    res.statusCode = 401;
    return res.end();
  }
  const update = req.body || {};
  try {
    await ensureSchema();

    if (update.callback_query) {
      const cb = update.callback_query;
      const chat = cb.message && cb.message.chat.id;
      const data = String(cb.data || '');
      const get = data.match(/^get:(pc|android):(\d{6,20})$/);
      if (get) {
        await onChoosePlatform(cb, get[1], get[2]);
      } else {
        await tg('answerCallbackQuery', { callback_query_id: cb.id });
        const v = data === 'help' ? 'where' : data.replace(/^v:/, '');
        if (chat && VIEWS[v] && ['menu', 'redeem', 'where', 'help'].includes(v)) {
          // El botón pertenece a este mensaje: lo usamos como panel aunque sea antiguo.
          await show(chat, VIEWS[v](), v === 'where' ? 'redeem' : v, { session: { panel_id: cb.message.message_id } });
        }
      }
    }

    const msg = update.message;
    if (msg && msg.chat && msg.chat.type === 'private') {
      const chat = msg.chat.id;
      const text = String(msg.text || msg.caption || '').trim();
      const isAdmin = ADMIN_ID && msg.from.id === ADMIN_ID;

      if (isAdmin && (text === '/id' || (text.startsWith('/') && !text.startsWith('/start') && !text.startsWith('/ayuda')))) {
        if (text === '/id') await say(chat, `Tu ID de Telegram es <code>${msg.from.id}</code>`);
        else await onAdmin(msg, text);
      } else if (text === '/id') {
        await say(chat, `Tu ID de Telegram es <code>${msg.from.id}</code>`);
      } else {
        // Todo lo que escribe la persona se borra: el chat queda solo con el panel y sus demos.
        await forget(chat, msg.message_id);
        const session = await getSession(chat);
        if (text.startsWith('/start')) {
          const fromHub = /\b(hub|demo)\b/.test(text);
          await show(chat, fromHub ? VIEWS.redeem() : VIEWS.menu(), fromHub ? 'redeem' : 'menu', { fresh: true, session });
        } else if (text.startsWith('/ayuda') || text.startsWith('/help')) {
          await show(chat, VIEWS.help(), 'help', { session });
        } else {
          const digits = text.replace(/[\s.\-#]/g, '');
          if (/^\d{8,20}$/.test(digits)) await onPaymentNumber(chat, msg.from.id, digits);
          else await show(chat, VIEWS.redeem(text ? '🙈 Eso no parece un número de operación.' : ''), 'redeem', { session });
        }
      }
    }
  } catch (e) {
    console.log(JSON.stringify({ demobot_error: String((e && e.message) || e) }));
    const chat = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
    if (chat) await say(chat, '⚠️ Algo falló de mi lado. Toca /start para volver al menú.');
  }
  res.statusCode = 200;
  res.end('ok');
}
