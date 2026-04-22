import './globals.css'
import type { Metadata } from 'next'
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'
import { extractRouterConfig } from 'uploadthing/server'
import { ourFileRouter } from '@/app/api/uploadthing/core'

export const metadata: Metadata = {
  title: 'Topin Store | Toon & Low Poly',
  description: 'De la feria de las pulgas a tu casa',
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
      </body>
    </html>
  )
}
