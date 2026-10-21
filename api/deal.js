// Devuelve la última publicación del canal público de Telegram, para mostrarla en vivo en la portada.
const CHANNEL = 'TopinSaleSwitch';

const decode = (s) => s
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

export default async function handler(req, res) {
  try {
    const r = await fetch(`https://t.me/s/${CHANNEL}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TopinHub/1.0)' },
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
      const lines = decode(text[1]).split('\n').map((l) => l.trim()).filter(Boolean);
      post = {
        title: (lines[0] || '').slice(0, 90),
        detail: lines.slice(1, 3).join(' · ').slice(0, 120),
        url: link ? link[1] : `https://t.me/${CHANNEL}`,
        at: time ? time[1] : null,
      };
    }
    if (!post) throw new Error('sin publicaciones');

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    res.status(200).json(post);
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=60');
    res.status(200).json(null);
  }
}
