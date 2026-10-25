// Devuelve la última oferta publicada en el canal público de Telegram, ya separada en partes
// (juego, precio, precio anterior, descuento, tienda) para mostrarla en la portada.
const CHANNEL = 'TopinSaleSwitch';

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };
const decode = (s) => s
  .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, k) => ENT[k])
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));

// Telegram envuelve cada emoji en <i class="emoji"><b>💣</b></i>: lo dejamos como texto plano.
const unEmoji = (html) => html.replace(/<i class="emoji"[^>]*>(?:<b>)?([\s\S]*?)(?:<\/b>)?<\/i>/g, '$1');
const plain = (html) => decode(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
// Quita emojis y símbolos del inicio de una línea ("🥇 Zelda" -> "Zelda").
const clean = (s) => s.replace(/^[^\p{L}\p{N}$]+/u, '').trim();

export function parsePost(html) {
  const lines = unEmoji(html).split(/<br\s*\/?>/i).map((h) => ({ h, t: plain(h) }));
  const header = lines.find((l) => l.t);
  const kind = header ? clean(header.t).replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F]/gu, '').replace(/\s*·\s*/g, ' · ').replace(/\s{2,}/g, ' ').trim() : '';

  // La línea del precio es la que trae el precio anterior tachado o el porcentaje.
  const pi = lines.findIndex((l) => /<(s|del|strike)>/i.test(l.h) || /[−-]\s?\d+\s?%/.test(l.t));
  if (pi === -1) {
    const rest = lines.filter((l) => l.t && l !== header).map((l) => clean(l.t));
    return { kind, name: rest[0] || kind, detail: rest.slice(1, 3).join(' · ') };
  }

  const line = lines[pi];
  const oldM = line.h.match(/<(?:s|del|strike)>([\s\S]*?)<\/(?:s|del|strike)>/i);
  const old = oldM ? plain(oldM[1]) : null;
  const withoutOld = oldM ? plain(line.h.replace(oldM[0], ' ')) : line.t;
  const price = (withoutOld.match(/\$\s?[\d.]+/) || [null])[0];
  const pctM = withoutOld.match(/[−-]\s?(\d+)\s?%/);
  const where = (withoutOld.match(/%\s*en\s+(.+?)(?:\s+·|$)/) || [null, null])[1];

  let name = '';
  for (let i = pi - 1; i >= 0 && !name; i--) {
    const t = clean(lines[i].t);
    if (t && lines[i] !== header) name = t;
  }
  name = name.replace(/\s*\(S2\)$/, ' · Switch 2');

  const verdictLine = lines.slice(pi + 1).find((l) => l.t.startsWith('👉'));
  return {
    kind,
    name: name || kind,
    price,
    old,
    pct: pctM ? Number(pctM[1]) : null,
    where,
    verdict: verdictLine ? clean(verdictLine.t) : null,
  };
}

export default async function handler(req, res) {
  try {
    const r = await fetch(`https://t.me/s/${CHANNEL}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TopinHub/1.1)' },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) throw new Error(`telegram ${r.status}`);
    const html = await r.text();

    const blocks = html.split('tgme_widget_message_wrap').slice(1);
    let post = null;
    for (let i = blocks.length - 1; i >= 0 && !post; i--) {
      const b = blocks[i];
      const text = b.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      if (!text) continue;
      const link = b.match(/class="tgme_widget_message_date" href="([^"]+)"/);
      const time = b.match(/<time[^>]*datetime="([^"]+)"/);
      const img = b.match(/(?:link_preview_image|message_photo_wrap)[^>]*background-image:url\('([^']+)'\)/);
      post = {
        ...parsePost(text[1]),
        image: img ? img[1] : null,
        url: link ? link[1] : `https://t.me/${CHANNEL}`,
        at: time ? time[1] : null,
      };
    }
    if (!post || !post.name) throw new Error('sin publicaciones');

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    res.status(200).json(post);
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=60');
    res.status(200).json(null);
  }
}
