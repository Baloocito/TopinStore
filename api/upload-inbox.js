// Sube archivos al inbox de TopinGames (videos, audios, imágenes) via UploadThing.
// Auth: cookie del panel (igual que api/panel.js).
// Guarda la referencia en la tabla inbox_files de la DB.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { sql, ensureSchema } from './_demo.js';

const COOKIE = 'tg_panel';
const PASS = () => process.env.PANEL_PASSWORD || '';
const sign = (v) => createHmac('sha256', 'topin-panel:' + PASS()).update(v).digest('hex');

function authed(req) {
  if (!PASS()) return false;
  const c = String(req.headers.cookie || '').split(/;\s*/).find((p) => p.startsWith(COOKIE + '='));
  if (!c) return false;
  const [exp, mac] = c.slice(COOKIE.length + 1).split('.');
  return Number(exp) > Date.now() && mac && timingSafeEqual(Buffer.from(String(mac)), Buffer.from(sign(exp)));
}

const send = (res, code, body) => { res.setHeader('Cache-Control', 'no-store'); res.status(code).json(body); };

const ALLOWED = ['video/mp4', 'video/quicktime', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 200;

async function ensureInboxSchema() {
  await ensureSchema();
  const q = sql();
  await q`CREATE TABLE IF NOT EXISTS inbox_files (
    id          bigserial PRIMARY KEY,
    ut_key      text NOT NULL,
    url         text NOT NULL,
    name        text NOT NULL,
    mime        text NOT NULL,
    size_bytes  bigint,
    note        text,
    status      text NOT NULL DEFAULT 'pending',
    created_at  timestamptz NOT NULL DEFAULT now()
  )`;
  await q`ALTER TABLE inbox_files ADD COLUMN IF NOT EXISTS note text`;
}

export default async function handler(req, res) {
  if (!authed(req)) return send(res, 401, { error: 'login' });

  // GET: listar archivos del inbox
  if (req.method === 'GET') {
    await ensureInboxSchema();
    const files = await sql()`SELECT * FROM inbox_files ORDER BY created_at DESC LIMIT 50`;
    return send(res, 200, { files });
  }

  // DELETE: borrar un archivo
  if (req.method === 'DELETE') {
    const id = Number(req.query.id);
    if (!id) return send(res, 400, { error: 'Falta ?id=' });
    await ensureInboxSchema();
    // Borrar de UploadThing también
    const [row] = await sql()`SELECT ut_key FROM inbox_files WHERE id = ${id}`;
    if (row) {
      try {
        await fetch('https://api.uploadthing.com/v6/deleteFiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-uploadthing-api-key': process.env.UPLOADTHING_TOKEN || '' },
          body: JSON.stringify({ fileKeys: [row.ut_key] }),
        });
      } catch (_) { /* si falla UT igual borramos de la DB */ }
    }
    await sql()`DELETE FROM inbox_files WHERE id = ${id}`;
    return send(res, 200, { ok: true });
  }

  // POST: subir archivo (base64 o multipart simulado con base64)
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });

  await ensureInboxSchema();

  const { file, name, mime, note } = req.body || {};
  if (!file || !name || !mime) return send(res, 400, { error: 'Faltan campos: file (base64), name, mime.' });
  if (!ALLOWED.includes(mime)) return send(res, 400, { error: 'Tipo no permitido: ' + mime } );

  const buffer = Buffer.from(file, 'base64');
  const sizeMB = buffer.byteLength / 1024 / 1024;
  if (sizeMB > MAX_MB) return send(res, 400, { error: `Demasiado grande (${sizeMB.toFixed(1)} MB, máx ${MAX_MB} MB)` });

  const token = process.env.UPLOADTHING_TOKEN;
  if (!token) return send(res, 503, { error: 'Falta UPLOADTHING_TOKEN en Vercel.' });

  try {
    // 1. Pedir URL de subida a UploadThing
    const presignRes = await fetch('https://api.uploadthing.com/v6/uploadFiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-uploadthing-api-key': token },
      body: JSON.stringify({ files: [{ name, size: buffer.byteLength, type: mime }], acl: 'public-read' }),
    });
    const presign = await presignRes.json();
    if (!presignRes.ok) throw new Error(presign.message || 'Error UploadThing presign');

    const uploadData = presign.data?.[0];
    if (!uploadData) throw new Error('Sin datos de subida');

    // 2. Subir el archivo a S3 via la URL firmada
    const formData = new FormData();
    for (const [k, v] of Object.entries(uploadData.fields || {})) formData.append(k, v);
    formData.append('file', new Blob([buffer], { type: mime }), name);
    const s3Res = await fetch(uploadData.url, { method: 'POST', body: formData });
    if (!s3Res.ok) throw new Error('Error subiendo a S3: ' + s3Res.status);

    // 3. Confirmar la subida
    await fetch('https://api.uploadthing.com/v6/completeMultipartUpload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-uploadthing-api-key': token },
      body: JSON.stringify({ fileKey: uploadData.key, uploadId: uploadData.uploadId }),
    }).catch(() => null); // no crítico

    const fileUrl = `https://utfs.io/f/${uploadData.key}`;

    // 4. Guardar en DB
    const [saved] = await sql()`
      INSERT INTO inbox_files (ut_key, url, name, mime, size_bytes, note)
      VALUES (${uploadData.key}, ${fileUrl}, ${name}, ${mime}, ${buffer.byteLength}, ${note || null})
      RETURNING *`;

    return send(res, 200, { ok: true, file: saved });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
