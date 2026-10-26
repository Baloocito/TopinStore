// Conecta @TopinDemoBot con este sitio. Es seguro abrirlo varias veces: siempre apunta al mismo lugar.
import { tg, WEBHOOK_SECRET, SITE, ADMIN_ID, sql, ensureSchema } from './_demo.js';

export default async function handler(req, res) {
  const out = { bot: null, webhook: null, commands: null, database: null, mercadopago: null, admin: Boolean(ADMIN_ID) };
  if (!WEBHOOK_SECRET) {
    res.status(500).json({ error: 'Falta TELEGRAM_DEMO_BOT_TOKEN en Vercel' });
    return;
  }
  const me = await tg('getMe', {});
  out.bot = me.ok ? '@' + me.result.username : me.description;

  const hook = await tg('setWebhook', {
    url: `${SITE}/api/demobot`,
    secret_token: WEBHOOK_SECRET,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: false,
  });
  out.webhook = hook.ok ? 'ok' : hook.description;

  const cmds = await tg('setMyCommands', {
    commands: [
      { command: 'start', description: 'Menú de Faro Hundido' },
    ],
  });
  await tg('setMyDescription', {
    description: '🔦 Bot oficial de Faro Hundido, el roguelike de TopinGames.\n\n🎁 ¿Donaste desde $1.500 con Mercado Pago? Canjea aquí tu demo para PC o Android en segundos.\n\nToca Iniciar para comenzar.',
  });
  await tg('setMyShortDescription', { short_description: 'Recibe la demo de Faro Hundido por tu donación.' });
  out.commands = cmds.ok ? 'ok' : cmds.description;

  try {
    await ensureSchema();
    const [{ n }] = await sql()`SELECT count(*)::int AS n FROM demo_claims`;
    out.database = `ok (${n} canjes)`;
  } catch (e) {
    out.database = 'error: ' + e.message;
  }

  try {
    const r = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN || ''}` },
    });
    const u = await r.json();
    out.mercadopago = r.ok ? `ok (${u.nickname || u.id})` : `error ${r.status}`;
    if (r.ok && String(process.env.MP_ACCESS_TOKEN || '').startsWith('TEST-')) out.mercadopago += ' · OJO: es un token de PRUEBA';
  } catch (e) {
    out.mercadopago = 'error: ' + e.message;
  }

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(out);
}
