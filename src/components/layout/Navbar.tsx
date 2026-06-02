'use client' // Lo hacemos client component para manejar estados de menú y rutas activas
import Link from 'next/link'
import Image from 'next/image' // 👈 Importamos el componente de optimización de imágenes
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/dashboard')

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-4 border-toon-border p-4 shadow-toon mb-8">
      <div className="container mx-auto flex justify-between items-center">
        {/* 🔥 Logo + Isotipo Integrado */}
        <Link
          href="/"
          className="flex items-center gap-3 group transition-transform active:translate-y-0.5"
        >
          {/* Contenedor del icono/sticker del logo */}
          <div className="relative w-10 h-10 bg-toon-yellow border-3 border-toon-border rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-0.5 group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden flex items-center justify-center shrink-0">
            <Image
              src="/logo.png" // 👈 Recuerda tirar tu logo generado por IA con este nombre exacto en la carpeta /public
              alt="Topin Store Logo"
              width={32}
              height={32}
              className="object-contain p-0.5"
              priority // Fuerza la carga rápida del logo por estar en el viewport principal
            />
          </div>

          {/* Texto de la Marca original con tus condiciones de Dashboard */}
          <span className="font-black text-2xl tracking-tighter uppercase text-toon-border">
            TOPIN STORE{' '}
            {isAdmin && (
              <span className="text-toon-pink text-sm ml-1 bg-slate-100 border-2 border-toon-border px-1.5 py-0.5 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                🛠️ ADMIN
              </span>
            )}
          </span>
        </Link>

        {/* Links (Se mantienen exactamente igual a tus condiciones originales) */}
        <div className="flex items-center space-x-6 font-bold">
          {isAdmin ? (
            <>
              <Link
                href="/dashboard"
                className={cn(
                  'hover:text-toon-pink text-toon-border transition-colors',
                  pathname === '/dashboard' && 'text-toon-pink',
                )}
              >
                Stock
              </Link>
              <Link
                href="/"
                className="bg-toon-blue border-2 border-toon-border px-4 py-1 rounded-lg font-bold text-toon-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
              >
                Ver Tienda
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-gray-400 hover:text-toon-border transition-colors"
              >
                Admin
              </Link>
              <button className="bg-toon-yellow border-2 border-toon-border px-4 py-1 rounded-lg font-bold text-toon-border shadow-[4px_4px_0px_0px_rgba(30,30,30,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all">
                Carrito (0)
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
