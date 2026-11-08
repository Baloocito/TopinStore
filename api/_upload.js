// Lógica del inbox de archivos (videos, audios, imágenes) via UploadThing.
// Llamado desde api/panel.js con action=inbox | inbox-delete | inbox-upload
import { sql, ensureSchema, logError } from './_demo.js';

export async function ensureInboxSchema() {
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
  await q`CREATE UNIQUE INDEX IF NOT EXISTS inbox_files_ut_key_idx ON inbox_files (ut_key)`;
}

const ALLOWED = ['video/mp4','video/quicktime','video/webm','audio/mpeg','audio/mp4','audio/wav','audio/ogg','image/jpeg','image/png','image/webp'];
const MAX_MB = 200;

/** GET: lista archivos del inbox */
export async function inboxList() {
  await ensureInboxSchema();
  const files = await sql()`SELECT * FROM inbox_files ORDER BY created_at DESC LIMIT 50`;
  return { files };
}

/** DELETE: borra un archivo por id */
export async function inboxDelete(id) {
  if (!id) throw Object.assign(new Error('Falta id'), { status: 400 });
  await ensureInboxSchema();
  const [row] = await sql()`SELECT ut_key FROM inbox_files WHERE id = ${Number(id)}`;
  if (row) {
    try {
      await fetch('https://api.uploadthing.com/v6/deleteFiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-uploadthing-api-key': process.env.UPLOADTHING_TOKEN || '' },
        body: JSON.stringify({ fileKeys: [row.ut_key] }),
      });
    } catch (_) { /* si falla UT igual borramos de la DB */ }
  }
  await sql()`DELETE FROM inbox_files WHERE id = ${Number(id)}`;
  return { ok: true };
}

/**
 * PASO 1: Genera una URL prefirmada de UploadThing para que el BROWSER suba directo.
 * El archivo NUNCA pasa por Vercel (límite 4.5 MB del body serverless).
 * Devuelve { url, fields, key, fileUrl } para que el cliente haga el POST multipart.
 */
export async function inboxPresign({ name, mime, size }) {
  if (!name || !mime || !size) throw Object.assign(new Error('Faltan campos: name, mime, size.'), { status: 400 });
  if (!ALLOWED.includes(mime)) throw Object.assign(new Error('Tipo no permitido: ' + mime), { status: 400 });
  const sizeMB = size / 1024 / 1024;
  if (sizeMB > MAX_MB) throw Object.assign(new Error(`Demasiado grande (${sizeMB.toFixed(1)} MB, máx ${MAX_MB} MB)`), { status: 400 });

  const token = process.env.UPLOADTHING_TOKEN;
  if (!token) throw Object.assign(new Error('Falta UPLOADTHING_TOKEN en Vercel.'), { status: 503 });

  const presignRes = await fetch('https://api.uploadthing.com/v6/uploadFiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-uploadthing-api-key': token },
    body: JSON.stringify({ files: [{ name, size, type: mime }], acl: 'public-read' }),
  });
  const presign = await presignRes.json();
  if (!presignRes.ok) throw new Error(presign.message || 'Error UploadThing presign');

  const uploadData = presign.data?.[0];
  if (!uploadData) throw new Error('Sin datos de subida de UploadThing');

  return {
    url: uploadData.url,
    fields: uploadData.fields || {},
    key: uploadData.key,
    uploadId: uploadData.uploadId || null,
    fileUrl: `https://utfs.io/f/${uploadData.key}`,
  };
}

/**
 * PASO 2: El browser ya subió el archivo directo a S3.
 * Solo registramos en la DB con el key que UploadThing devolvió.
 */
export async function inboxRegister({ key, name, mime, size, note }) {
  if (!key || !name || !mime) throw Object.assign(new Error('Faltan campos: key, name, mime.'), { status: 400 });
  await ensureInboxSchema();
  const fileUrl = `https://utfs.io/f/${key}`;
  const [saved] = await sql()`
    INSERT INTO inbox_files (ut_key, url, name, mime, size_bytes, note)
    VALUES (${key}, ${fileUrl}, ${name}, ${mime}, ${size || null}, ${note || null})
    RETURNING *`;
  return { ok: true, file: saved };
}
