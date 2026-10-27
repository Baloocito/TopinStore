// Piezas del bot de Trueque: Telegram, lectura de productos desde la tienda y textos.
import { createHash } from 'node:crypto';
import { SITE } from './_demo.js';

const TOKEN = process.env.TELEGRAM_TRUEQUE_BOT_TOKEN || '';
export const TQ_SECRET = TOKEN
  ? createHash('sha256').update('topin-trueque:' + TOKEN).digest('hex').slice(0, 48) : '';
export const STORE = `${SITE}/trueque`;
// API pública de la tienda (proyecto trueque-app). Solo devuelve datos públicos.
const API = process.env.TRUEQUE_API || 'https://trueque-app.vercel.app/api';
// Si el bot aún no está creado, "Lo quiero" lleva a los mensajes de Instagram.
export const FALLBACK = 'https://ig.me/m/topingames_';

export async function tq(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!data.ok) console.log(JSON.stringify({ tq_error: method, description: data.description }));
  return data;
}
export const tqSay = (chat_id, text, extra = {}) =>
  tq('sendMessage', { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra });

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function product(id) {
  if (!UUID.test(String(id))) return null;
  try {
    const r = await fetch(`${API}/products?id=${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(6000) });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}
export async function products() {
  try {
    const r = await fetch(`${API}/products`, { signal: AbortSignal.timeout(6000) });
    return r.ok ? await r.json() : [];
  } catch { return []; }
}

export const price = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CL');
export const CONDITION = { nuevo: 'Nuevo', como_nuevo: 'Como nuevo', buen_estado: 'Buen estado', usado: 'Usado' };
export const productUrl = (id) => `${STORE}/producto/${id}`;
