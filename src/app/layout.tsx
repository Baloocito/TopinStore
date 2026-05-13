import './globals.css'
import type { Metadata } from 'next'
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'
import { extractRouterConfig } from 'uploadthing/server'
import { ourFileRouter } from '@/app/api/uploadthing/core'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: 'Topin Store | Tesoros & Cosas Kawaii',
  description:
    'Desde la feria de las pulgas directamente a tu setup. Arma tu inventario con packs dinámicos y joyas únicas.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  ),
  openGraph: {
    title: 'Topin Store | El Mejor Botín para tu Setup',
    description: 'Explora nuestra nueva colección. Envíos a todo Chile.',
    url: '/',
    siteName: 'Topin Store',
    images: [
      {
        url: '/og-image.png', // 🔥 Esta es la imagen que se verá en WhatsApp/Instagram
        width: 1200,
        height: 630,
        alt: 'Portada de Topin Store',
      },
    ],
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Topin Store | Tesoros Kawaii',
    description: 'Arma tu inventario con nuestros packs dinámicos.',
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <NextSSRPlugin
          /**
           * El routerConfig ayuda a hidratar el estado de UploadThing en el cliente
           */
          routerConfig={extractRouterConfig(ourFileRouter)}
        />
        {children}
        <SpeedInsights /> {/* <-- Aquí es el lugar perfecto */}
      </body>
    </html>
  )
}
