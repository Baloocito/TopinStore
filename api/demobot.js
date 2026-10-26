// Webhook de @TopinDemoBot: verifica donaciones de Mercado Pago y entrega la demo de Faro Hundido.
import {
  tg, say, notifyAdmin, esc, checkPayment, sql, ensureSchema,
  ADMIN_ID, WEBHOOK_SECRET, PLATFORMS, MIN_AMOUNT, MAX_AGE_DAYS,
} from './_demo.js';

const clp = (n) => '$' + Math.round(n).toLocaleString('es-CL');
const CHANNEL = 'https://t.me/TopinSaleSwitch';

const WELCOME =
  '🔦 <b>Bienvenido al Faro.</b>\n\n' +
  'Gracias por apoyar <b>Faro Hundido</b>. Si donaste ' + clp(MIN_AMOUNT) + ' o más con Mercado Pago, ' +
  'tu demo te espera.\n\n' +
  '📩 Envíame el <b>número de operación</b> de tu comprobante (solo los números).';

const HELP_NUMBER =
  '🧾 <b>¿Dónde está el número de operación?</b>\n\n' +
  '• En la app de Mercado Pago: <i>Actividad</i> → toca tu donación → <b>Número de operación</b>.\n' +
  '• En el correo de comprobante que te llegó al pagar.\n\n' +
  'Es un número largo, por ejemplo <code>123456789012</code>. Cópialo y envíamelo aquí.';

const REASONS = {
  not_found: '🤔 No encontré una donación con ese número. Revisa que sea el <b>número de operación</b> y que hayas donado desde drpipa.cl.',
  pending: '⏳ Tu pago todavía está <b>en proceso</b>. Cuando Mercado Pago lo apruebe, vuelve a enviarme el número.',
  not_approved: '❌ Ese pago no figura como aprobado, así que no puedo entregar la demo con él.',
  too_low: `💡 La demo se regala desde <b>${clp(MIN_AMOUNT)}</b>. Ese pago es de un monto menor.`,
  too_old: `📅 Ese pago tiene más de ${MAX_AGE_DAYS} días. Si crees que es un error, avísame en Instagram @xiombo.`,
  mp_error: '⚠️ No pude conectarme con Mercado Pago. Intenta de nuevo en unos minutos.',
};

const INSTRUCTIONS = {
  pc:
    '🖥️ <b>Faro Hundido · Demo para PC</b>\n\n' +
    '1. Descomprime el archivo.\n2. Abre el ejecutable del juego.\n' +
    '3. Si Windows muestra una advertencia, toca <i>Más información</i> → <i>Ejecutar de todas formas</i>.',
  android:
    '📱 <b>Faro Hundido · Demo para Android</b>\n\n' +
    '1. Toca el archivo para descargarlo.\n2. Ábrelo y toca <i>Instalar</i>.\n' +
    '3. Si tu teléfono lo bloquea, activa <i>Permitir de esta fuente</i> para Telegram y vuelve a tocar <i>Instalar</i>.',
};

const OUTRO =
  '\n\n¿Te gustó? Cuéntame qué te pareció en Instagram <b>@xiombo</b>. ' +
  'Y si buscas juegos baratos de Switch, únete al canal 👇';

/* ---------- Pasos del flujo ---------- */

async function onPaymentNumber(msg, id) {
  const chat = msg.chat.id;
  await tg('sendChatAction', { chat_id: chat, action: 'typing' });
  const r = await checkPayment(id);
  if (!r.ok) return say(chat, REASONS[r.reason] || REASONS.not_found);

  const [claim] = await sql()`SELECT tg_user_id, platform FROM demo_claims WHERE payment_id = ${id}`;
  if (claim && Number(claim.tg_user_id) !== msg.from.id) {
    return say(chat, '🔒 Esa donación ya se usó para canjear una demo. Cada donación entrega una demo.');
  }
  if (claim) {
    return say(chat, `Ya canjeaste esta donación por la demo de <b>${PLATFORMS[claim.platform]}</b>. Te la envío de nuevo 👇`)
      .then(() => sendDemo(chat, claim.platform, id));
  }
  return say(chat,
    `✅ <b>¡Donación confirmada!</b> ${clp(r.payment.amount)}. Gracias por encender el faro.\n\n¿Dónde vas a jugar?`,
    { reply_markup: { inline_keyboard: [[
      { text: '🖥️ PC', callback_data: `get:pc:${id}` },
      { text: '📱 Android', callback_data: `get:android:${id}` },
    ]] } });
}

async function sendDemo(chat, platform, paymentId) {
  const [file] = await sql()`SELECT file_id FROM demo_files WHERE platform = ${platform}`;
  if (!file) {
    await notifyAdmin(`⚠️ Alguien pidió la demo de <b>${PLATFORMS[platform]}</b> y no hay archivo cargado.`);
    return say(chat, '🛠️ Estoy terminando de preparar esta versión. Te aviso apenas esté lista; tu canje queda guardado.');
  }
  const sent = await tg('sendDocument', {
    chat_id: chat, document: file.file_id, caption: INSTRUCTIONS[platform] + OUTRO, parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [[{ text: '🎮 Canal de ofertas de Switch', url: CHANNEL }]] },
  });
  if (sent.ok && paymentId) await sql()`UPDATE demo_claims SET delivered = true WHERE payment_id = ${paymentId}`;
  return sent.ok;
}

async function onChoosePlatform(cb, platform, id) {
  const chat = cb.message.chat.id;
  const u = cb.from;
  // Se vuelve a verificar: el botón pudo quedar viejo.
  const r = await checkPayment(id);
  if (!r.ok) {
    await tg('answerCallbackQuery', { callback_query_id: cb.id });
    return say(chat, REASONS[r.reason] || REASONS.not_found);
  }
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ');
  const inserted = await sql()`
    INSERT INTO demo_claims (payment_id, tg_user_id, tg_username, tg_name, platform, amount)
    VALUES (${id}, ${u.id}, ${u.username || null}, ${name || null}, ${platform}, ${r.payment.amount})
    ON CONFLICT (payment_id) DO NOTHING
    RETURNING payment_id`;
  const [claim] = inserted.length ? [{ tg_user_id: u.id, platform }]
    : await sql()`SELECT tg_user_id, platform FROM demo_claims WHERE payment_id = ${id}`;

  await tg('answerCallbackQuery', { callback_query_id: cb.id });
  await tg('editMessageReplyMarkup', { chat_id: chat, message_id: cb.message.message_id, reply_markup: { inline_keyboard: [] } });

  if (Number(claim.tg_user_id) !== u.id) {
    return say(chat, '🔒 Esa donación ya se usó para canjear una demo.');
  }
  if (inserted.length) {
    await notifyAdmin(
      `🎁 <b>Nuevo canje</b>\n${esc(name || 'Sin nombre')}${u.username ? ' (@' + esc(u.username) + ')' : ''}\n` +
      `${PLATFORMS[platform]} · ${clp(r.payment.amount)} · operación <code>${esc(id)}</code>`);
  }
  return sendDemo(chat, claim.platform, id);
}

/* ---------- Comandos del admin ---------- */

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
      await say(Number(p.tg_user_id), '🎉 ¡Tu demo ya está lista! Aquí la tienes 👇');
      if (await sendDemo(Number(p.tg_user_id), m[1], p.payment_id)) ok++;
    }
    return say(chat, `✅ Demo de <b>${PLATFORMS[m[1]]}</b> actualizada: ${esc(doc.file_name || 'archivo')}` +
      (pending.length ? `\nEnviada a ${ok} de ${pending.length} personas que la estaban esperando.` : ''));
  }
  if (text.startsWith('/estado')) {
    const files = await sql()`SELECT platform, file_name, updated_at FROM demo_files ORDER BY platform`;
    const stats = await sql()`SELECT platform, count(*)::int AS n, coalesce(sum(amount),0)::int AS total FROM demo_claims GROUP BY platform`;
    const last = await sql()`SELECT tg_name, tg_username, platform, amount, created_at FROM demo_claims ORDER BY created_at DESC LIMIT 5`;
    const total = stats.reduce((a, s) => a + s.total, 0);
    const lines = [
      '📊 <b>Estado del bot</b>', '',
      '<b>Archivos</b>',
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
  if (req.method !== 'POST' || req.headers['x-telegram-bot-api-secret-token'] !== WEBHOOK_SECRET || !WEBHOOK_SECRET) {
    res.statusCode = 401;
    return res.end();
  }
  const update = req.body || {};
  try {
    await ensureSchema();

    if (update.callback_query) {
      const cb = update.callback_query;
      const m = String(cb.data || '').match(/^get:(pc|android):(\d{6,20})$/);
      if (m) await onChoosePlatform(cb, m[1], m[2]);
      else await tg('answerCallbackQuery', { callback_query_id: cb.id });
      if (cb.data === 'help') await say(cb.message.chat.id, HELP_NUMBER);
    }

    const msg = update.message;
    if (msg && msg.chat && msg.chat.type === 'private') {
      const text = String(msg.text || msg.caption || '').trim();
      const isAdmin = ADMIN_ID && msg.from.id === ADMIN_ID;

      if (text === '/id' || text.startsWith('/id@')) {
        await say(msg.chat.id, `Tu ID de Telegram es <code>${msg.from.id}</code>`);
      } else if (isAdmin && text.startsWith('/') && (await onAdmin(msg, text)) !== null) {
        // comando de admin atendido
      } else if (text.startsWith('/start') || text === '/ayuda' || text === '/help') {
        await say(msg.chat.id, WELCOME, {
          reply_markup: { inline_keyboard: [[{ text: '🧾 ¿Dónde encuentro el número?', callback_data: 'help' }]] },
        });
      } else {
        const digits = text.replace(/[\s.\-#]/g, '');
        if (/^\d{8,20}$/.test(digits)) await onPaymentNumber(msg, digits);
        else await say(msg.chat.id, '📩 Envíame solo el <b>número de operación</b> de tu comprobante de Mercado Pago.', {
          reply_markup: { inline_keyboard: [[{ text: '🧾 ¿Dónde lo encuentro?', callback_data: 'help' }]] },
        });
      }
    }
  } catch (e) {
    console.log(JSON.stringify({ demobot_error: String(e && e.message || e) }));
    const chat = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
    if (chat) await say(chat, '⚠️ Algo falló de mi lado. Intenta de nuevo en un momento.');
  }
  res.statusCode = 200;
  res.end('ok');
}
