// Lógica del inbox de archivos (videos, audios, imágenes) via UploadThing.
// Llamado desde api/panel.js con action=inbox | inbox-delete | inbox-upload
import { sql, ensureSchema } from './_demo.js';

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

/** POST: sube un archivo (base64) a UploadThing y lo registra en DB */
export async function inboxUpload({ file, name, mime, note }) {
  if (!file || !name || !mime) throw Object.assign(new Error('Faltan campos: file (base64), name, mime.'), { status: 400 });
  if (!ALLOWED.includes(mime)) throw Object.assign(new Error('Tipo no permitido: ' + mime), { status: 400 });

  const buffer = Buffer.from(file, 'base64');
  const sizeMB = buffer.byteLength / 1024 / 1024;
  if (sizeMB > MAX_MB) throw Object.assign(new Error(`Demasiado grande (${sizeMB.toFixed(1)} MB, máx ${MAX_MB} MB)`), { status: 400 });

  const token = process.env.UPLOADTHING_TOKEN;
  if (!token) throw Object.assign(new Error('Falta UPLOADTHING_TOKEN en Vercel.'), { status: 503 });

  await ensureInboxSchema();

  const presignRes = await fetch('https://api.uploadthing.com/v6/uploadFiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-uploadthing-api-key': token },
    body: JSON.stringify({ files: [{ name, size: buffer.byteLength, type: mime }], acl: 'public-read' }),
  });
  const presign = await presignRes.json();
  if (!presignRes.ok) throw new Error(presign.message || 'Error UploadThing presign');

  const uploadData = presign.data?.[0];
  if (!uploadData) throw new Error('Sin datos de subida');

  const formData = new FormData();
  for (const [k, v] of Object.entries(uploadData.fields || {})) formData.append(k, v);
  formData.append('file', new Blob([buffer], { type: mime }), name);
  const s3Res = await fetch(uploadData.url, { method: 'POST', body: formData });
  if (!s3Res.ok) throw new Error('Error subiendo a S3: ' + s3Res.status);

  await fetch('https://api.uploadthing.com/v6/completeMultipartUpload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-uploadthing-api-key': token },
    body: JSON.stringify({ fileKey: uploadData.key, uploadId: uploadData.uploadId }),
  }).catch(() => null);

  const fileUrl = `https://utfs.io/f/${uploadData.key}`;
  const [saved] = await sql()`
    INSERT INTO inbox_files (ut_key, url, name, mime, size_bytes, note)
    VALUES (${uploadData.key}, ${fileUrl}, ${name}, ${mime}, ${buffer.byteLength}, ${note || null})
    RETURNING *`;

  return { ok: true, file: saved };
}
