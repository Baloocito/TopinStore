// Arma data/queue.json con los posts de content/posts/<id>/post.json.
// Cada post vive en su carpeta junto a sus imágenes; al desplegar quedan públicos en drpipa.cl/content/...
// Si un post tiene errores, el build falla y no se publica nada roto.
//
// Horarios (hora de Chile): posts e imágenes entre 10:00 y 12:00; reels a las 14:00.
// La publicación corre cada hora a los :07, así que un post de las 11:00 sale cerca de las 11:07.
// "story": "story.jpg" (1080×1920, opcional) se sube como historia apenas sale el post.
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const SITE = 'https://www.drpipa.cl';
const DIR = new URL('content/posts/', ROOT);

export function buildQueue() {
  const posts = [];
  if (existsSync(DIR)) {
    for (const id of readdirSync(DIR).sort()) {
      const folder = new URL(id + '/', DIR);
      if (!statSync(folder).isDirectory()) continue;
      const file = new URL('post.json', folder);
      if (!existsSync(file)) continue;
      const p = JSON.parse(readFileSync(file, 'utf8'));
      const where = `content/posts/${id}`;
      if (!/^[a-z0-9-]{3,60}$/.test(id)) throw new Error(`${where}: el nombre de la carpeta solo admite a-z, 0-9 y guiones`);
      if (!['image', 'carousel', 'reel'].includes(p.type)) throw new Error(`${where}: type debe ser image, carousel o reel`);
      const media = p.media || [];
      if (!media.length) throw new Error(`${where}: falta media`);
      if (p.type === 'image' && media.length !== 1) throw new Error(`${where}: image lleva 1 archivo`);
      if (p.type === 'carousel' && (media.length < 2 || media.length > 10)) throw new Error(`${where}: carrusel de 2 a 10 archivos`);
      for (const m of media) {
        if (!existsSync(new URL(m, folder))) throw new Error(`${where}: no existe ${m}`);
        const ok = p.type === 'reel' ? /\.mp4$/i.test(m) : /\.jpe?g$/i.test(m);
        if (!ok) throw new Error(`${where}: ${m} debe ser ${p.type === 'reel' ? '.mp4' : '.jpg'} (lo exige Instagram)`);
      }
      if (p.story && (!/\.jpe?g$/i.test(p.story) || !existsSync(new URL(p.story, folder)))) {
        throw new Error(`${where}: story debe ser un .jpg que exista en la carpeta`);
      }
      const caption = String(p.caption || '');
      if (caption.length > 2200) throw new Error(`${where}: el texto supera 2.200 caracteres`);
      if ((caption.match(/#[\p{L}\p{N}_]+/gu) || []).length > 30) throw new Error(`${where}: más de 30 hashtags`);
      const at = new Date(p.scheduled_at);
      if (isNaN(at)) throw new Error(`${where}: scheduled_at inválido (usa 2026-10-28T19:00:00-03:00)`);
      posts.push({
        id,
        project: p.project || 'topingames',
        type: p.type,
        media: media.map((m) => `${SITE}/${where}/${m}`),
        story: p.story ? `${SITE}/${where}/${p.story}` : null,
        caption,
        scheduled_at: at.toISOString(),
        note: p.note || null,
      });
    }
  }
  const version = (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 40);
  writeFileSync(new URL('data/queue.json', ROOT), JSON.stringify({ version, posts }, null, 2) + '\n');
  return posts;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const posts = buildQueue();
  console.log(`cola OK · ${posts.length} posts`);
}
