// Piezas compartidas del bot de demos: Telegram, Mercado Pago y la base de datos (Neon).
import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

export const MIN_AMOUNT = 1500;            // CLP mínimos para recibir la demo
export const MAX_AGE_DAYS = 60;            // un pago más antiguo que esto ya no se canjea
export const PLATFORMS = { pc: 'PC', android: 'Android' };
export const SITE = 'https://www.drpipa.cl';

const BOT_TOKEN = process.env.TELEGRAM_DEMO_BOT_TOKEN || '';
export const ADMIN_ID = Number(process.env.TELEGRAM_ADMIN_ID || 0);

// Secreto que Telegram manda en cada llamada al webhook. Se deriva del token: no hace falta otra variable.
export const WEBHOOK_SECRET = BOT_TOKEN
  ? createHash('sha256').update('topin-demo:' + BOT_TOKEN).digest('hex').slice(0, 48)
  : '';

/* ---------- Telegram ---------- */
export async function tg(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!data.ok) console.log(JSON.stringify({ tg_error: method, description: data.description }));
  return data;
}
export const say = (chat_id, text, extra = {}) =>
  tg('sendMessage', { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra });
export const notifyAdmin = (text) => (ADMIN_ID ? say(ADMIN_ID, text) : null);
export const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/* ---------- Mercado Pago ---------- */
const MP = 'https://api.mercadopago.com';
const mpHeaders = () => ({ Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN || ''}` });

let myId = null;
async function sellerId() {
  if (myId) return myId;
  const r = await fetch(`${MP}/users/me`, { headers: mpHeaders() });
  if (!r.ok) throw new Error(`mp users/me ${r.status}`);
  myId = (await r.json()).id;
  return myId;
}

/** Revisa un pago y devuelve { ok, reason, payment }. reason explica al usuario por qué no sirve. */
export async function checkPayment(paymentId) {
  const r = await fetch(`${MP}/v1/payments/${encodeURIComponent(paymentId)}`, { headers: mpHeaders() });
  if (r.status === 404 || r.status === 400) return { ok: false, reason: 'not_found' };
  if (!r.ok) return { ok: false, reason: 'mp_error' };
  const p = await r.json();
  const payment = {
    id: String(p.id),
    status: p.status,
    amount: Number(p.transaction_amount || 0),
    currency: p.currency_id,
    approvedAt: p.date_approved,
    payer: p.payer && p.payer.email,
  };
  // Solo cuentan los pagos que RECIBISTE tú (no los que tú hiciste a otros).
  if (String(p.collector_id) !== String(await sellerId())) return { ok: false, reason: 'not_found', payment };
  if (p.status !== 'approved') return { ok: false, reason: p.status === 'pending' || p.status === 'in_process' ? 'pending' : 'not_approved', payment };
  if (payment.currency !== 'CLP' || payment.amount < MIN_AMOUNT) return { ok: false, reason: 'too_low', payment };
  const age = (Date.now() - new Date(p.date_approved || p.date_created).getTime()) / 864e5;
  if (age > MAX_AGE_DAYS) return { ok: false, reason: 'too_old', payment };
  return { ok: true, payment };
}

/* ---------- Base de datos ---------- */
let _sql = null;
let _ready = null;
export function sql() {
  if (!_sql) _sql = globalThis.__TEST_SQL || neon(process.env.DATABASE_URL);
  return _sql;
}
export function ensureSchema() {
  if (!_ready) {
    const q = sql();
    _ready = (async () => {
      await q`CREATE TABLE IF NOT EXISTS demo_claims (
        payment_id   text PRIMARY KEY,
        tg_user_id   bigint NOT NULL,
        tg_username  text,
        tg_name      text,
        platform     text NOT NULL,
        amount       numeric NOT NULL,
        delivered    boolean NOT NULL DEFAULT false,
        created_at   timestamptz NOT NULL DEFAULT now()
      )`;
      await q`ALTER TABLE demo_claims ADD COLUMN IF NOT EXISTS delivered boolean NOT NULL DEFAULT false`;
      await q`CREATE TABLE IF NOT EXISTS demo_files (
        platform    text PRIMARY KEY,
        file_id     text NOT NULL,
        file_name   text,
        updated_at  timestamptz NOT NULL DEFAULT now()
      )`;
      await q`CREATE TABLE IF NOT EXISTS demo_sessions (
        tg_user_id  bigint PRIMARY KEY,
        panel_id    bigint,
        mode        text NOT NULL DEFAULT 'menu',
        updated_at  timestamptz NOT NULL DEFAULT now()
      )`;
      await q`CREATE TABLE IF NOT EXISTS donations (
        payment_id  text PRIMARY KEY,
        source      text NOT NULL,
        amount      numeric NOT NULL,
        currency    text NOT NULL,
        status      text NOT NULL,
        created_at  timestamptz NOT NULL DEFAULT now()
      )`;
      await q`ALTER TABLE donations ADD COLUMN IF NOT EXISTS donor text`;
      await q`ALTER TABLE donations ADD COLUMN IF NOT EXISTS note text`;
      await q`ALTER TABLE donations ADD COLUMN IF NOT EXISTS kind text`;
      await q`CREATE TABLE IF NOT EXISTS events (
        id       bigserial PRIMARY KEY,
        at       timestamptz NOT NULL DEFAULT now(),
        type     text NOT NULL,
        target   text NOT NULL,
        src      text NOT NULL,
        country  text,
        city     text,
        mobile   boolean,
        inapp    boolean,
        vid      text
      )`;
      await q`CREATE INDEX IF NOT EXISTS events_at_idx ON events (at)`;
      await q`CREATE TABLE IF NOT EXISTS metrics_daily (
        day     date NOT NULL,
        metric  text NOT NULL,
        value   numeric NOT NULL,
        PRIMARY KEY (day, metric)
      )`;
      await q`CREATE TABLE IF NOT EXISTS social_posts (
        id            text PRIMARY KEY,
        project       text,
        type          text NOT NULL,
        media         jsonb NOT NULL,
        caption       text NOT NULL,
        scheduled_at  timestamptz NOT NULL,
        status        text NOT NULL DEFAULT 'pending',
        note          text,
        tg_message_id bigint,
        ig_media_id   text,
        permalink     text,
        error         text,
        published_at  timestamptz,
        updated_at    timestamptz NOT NULL DEFAULT now()
      )`;
      await q`ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS source_hash text`;
      await q`CREATE TABLE IF NOT EXISTS trueque_leads (
        id            bigserial PRIMARY KEY,
        product_id    text NOT NULL,
        product_name  text,
        price         numeric,
        kind          text NOT NULL,
        tg_user_id    bigint NOT NULL,
        tg_username   text,
        tg_name       text,
        created_at    timestamptz NOT NULL DEFAULT now()
      )`;
      await q`CREATE TABLE IF NOT EXISTS trueque_chats (
        tg_user_id    bigint PRIMARY KEY,
        product_id    text,
        product_name  text,
        updated_at    timestamptz NOT NULL DEFAULT now()
      )`;
      await q`CREATE TABLE IF NOT EXISTS trueque_relay (
        admin_msg_id  bigint PRIMARY KEY,
        tg_user_id    bigint NOT NULL,
        created_at    timestamptz NOT NULL DEFAULT now()
      )`;
      await q`CREATE TABLE IF NOT EXISTS settings (
        key         text PRIMARY KEY,
        value       text NOT NULL,
        updated_at  timestamptz NOT NULL DEFAULT now()
      )`;
    })().catch((e) => { _ready = null; throw e; });
  }
  return _ready;
}
