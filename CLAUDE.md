# drpipa.cl — Hub Xiombo × TopinGames

Lee esto antes de tocar nada. Mantenlo corto y actualízalo cuando cambie algo importante.

## Qué es
Hub link-in-bio (index.html), páginas de juegos (/faro, /zombies), panel (/panel), bots de Telegram y el pipeline de Instagram. Vercel (Hobby) + Neon Postgres. La tienda /tienda es OTRO repo (Baloocito/trueque-app), proxiada por rewrite en vercel.json.

## Reglas que no se rompen
- Secretos solo en Vercel/GitHub. Nunca pedirlos en el chat ni escribirlos en el repo.
- Nunca publicar en Instagram sin aprobación de Xiombo en @TopinMandoBot.
- Nunca revelar el final secreto de Faro Hundido (ni pistas). Público: "4 biomas, 4 jefes, 3 finales".
- Sin CTA de donación en /faro ni /zombies. Meta única: US$1.500 (1.500.000 CLP) para el arte final de los dos juegos.
- Sin arte oficial de Nintendo ni personajes con licencia (pack PSX pendiente de licencia).
- No exponer el WhatsApp personal. Contacto de la tienda = @TopinStoreBot.
- Todo gratis por ahora: nada de APIs de pago.

## Límites técnicos
- Vercel Hobby: máximo 12 funciones en api/ (hoy hay 12). Archivos `_algo.js` NO cuentan: agrega lógica ahí y enruta con rewrites/`?action=`.
- Cron de Vercel solo 1 vez al día: api/cron/daily.js 9:00 Chile (métricas, limpieza de donaciones MP, radar, token IG, reporte del lunes).
- Reloj de publicación: cron-job.org cada 5 min → GET /api/social?action=tick (sin clave; solo publica lo aprobado). Respaldo: visitas al hub y mensajes al bot. /estado en el bot muestra si está vivo.

## Mapa
- api/_demo.js: sql(), ensureSchema() (todas las tablas), checkPayment (MP).
- api/_social.js: cola, tarjetas, publicar post + historia, tick/kick, aviso 5 min.
- api/opsbot.js: @TopinMandoBot (/cola /estado /sync /radar /ideas). Setup: GET /api/opsbot?setup=1.
- api/_news.js + data/news.json: radar de noticias (fuentes, boost, calendario semanal).
- api/truequebot.js, _tq.js, _tqgo.js: @TopinStoreBot. api/demobot.js: @TopinDemoBot.
- data/links.json: botones del hub, meta, donaciones. scripts/check.mjs valida y genera data/queue.json.

## Posts de Instagram
Carpeta `content/posts/AAAA-MM-DD-slug/` con `post.json` (project, type image|carousel|reel, media[], story, scheduled_at con -03:00, caption) + imágenes 1080×1350 (story 1080×1920).
- Horario: posts 10:00–12:00 Chile, reels 14:00. Cada post lleva historia.
- Cierre del caption: CTA a drpipa.cl o al canal t.me/TopinSaleSwitch + hashtags.
- Al hacer push a main, GitHub Actions sincroniza y llegan al bot para aprobar.

## Flujo de trabajo
- Rama `hub`; publicar con `git push origin hub hub:main`. Commits como Xiombo <xiombbo@gmail.com>.
- Build: `node scripts/check.mjs` reescribe index.html (versiones de assets): respalda y restaura index.html si no quieres ese cambio.
- Probar funciones con PGlite + fetch simulado antes de subir (el sandbox no llega a drpipa.cl ni Telegram).
