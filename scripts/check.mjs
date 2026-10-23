// Valida data/links.json antes de cada despliegue: si hay un error, el build falla y no se publica.
import { readFileSync, writeFileSync } from 'node:fs';
const d = JSON.parse(readFileSync(new URL('../data/links.json', import.meta.url), 'utf8'));
const sup = d.support ? [...(d.support.tiers || []).filter((t) => t.url), d.support.intl].filter(Boolean) : [];
const items = [d.featured, ...d.paths, ...d.socials, ...sup];
const ids = new Set();
for (const it of items) {
  if (!it.id || !/^[a-z0-9-]+$/.test(it.id)) throw new Error(`id inválido: ${it.id}`);
  if (ids.has(it.id)) throw new Error(`id repetido: ${it.id}`);
  ids.add(it.id);
  new URL(it.url, 'https://drpipa.cl');
}
console.log(`links.json OK · ${items.length} enlaces`);

// Versiona CSS y JS con el commit desplegado para que nadie vea código viejo en caché.
const v = (process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString(36)).slice(0, 8);
const page = new URL('../index.html', import.meta.url);
writeFileSync(page, readFileSync(page, 'utf8').replace(/(hub\.(?:css|js))\?v=[\w-]+/g, `$1?v=${v}`));
console.log(`assets versión ${v}`);
