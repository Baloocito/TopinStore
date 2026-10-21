// Valida data/links.json antes de cada despliegue: si hay un error, el build falla y no se publica.
import { readFileSync } from 'node:fs';
const d = JSON.parse(readFileSync(new URL('../data/links.json', import.meta.url), 'utf8'));
const items = [d.featured, ...d.paths, ...d.socials];
const ids = new Set();
for (const it of items) {
  if (!it.id || !/^[a-z0-9-]+$/.test(it.id)) throw new Error(`id inválido: ${it.id}`);
  if (ids.has(it.id)) throw new Error(`id repetido: ${it.id}`);
  ids.add(it.id);
  new URL(it.url);
}
console.log(`links.json OK · ${items.length} enlaces`);
