import './globals.css'
import type { Metadata } from 'next'

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
      {/* antialiased ayuda a que las fuentes se vean mejor con bordes gruesos */}
      <body className="antialiased selection:bg-toon-yellow">{children}</body>
    </html>
  )
}
