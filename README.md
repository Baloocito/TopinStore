# Xiombo × TopinGames — hub

Página link-in-bio que reparte las visitas de Instagram y del QR hacia todos los proyectos de TopinGames.

## Editar contenido
Todo el texto y los enlaces están en `data/links.json`. Cada enlace tiene un `id` único; ese id es el que aparece en las estadísticas.

## Medición
- Cada clic pasa por `/go/<id>?src=<origen>` y queda registrado en los logs de Vercel (`ev: "click"`).
- Cada visita queda como `ev: "view"`.
- Origen: `?src=ig`, `?src=yt`, etc. El QR debe apuntar a `https://<dominio>/qr`.

## Ofertas en vivo
`/api/deal` lee la última publicación del canal público t.me/TopinSaleSwitch (caché de 10 min).
