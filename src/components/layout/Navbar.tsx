'use client' // Lo hacemos client component para manejar estados de menú y rutas activas
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/dashboard')

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-4 border-toon-border p-4 shadow-toon mb-8">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="font-black text-2xl tracking-tighter hover:scale-105 transition-transform"
        >
          TOPIN STORE {isAdmin ? '🛠️ ADMIN' : '🧸'}
        </Link>

        {/* Links */}
        <div className="flex items-center space-x-6 font-bold">
          {isAdmin ? (
            <>
              <Link
                href="/dashboard"
                className={cn(
                  'hover:text-toon-pink',
                  pathname === '/dashboard' && 'text-toon-pink',
                )}
              >
                Stock
              </Link>
              <Link
                href="/"
                className="bg-toon-blue border-2 border-toon-border px-4 py-1 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
              >
                Ver Tienda
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-gray-400 hover:text-toon-border"
              >
                Admin
              </Link>
              <button className="bg-toon-yellow border-2 border-toon-border px-4 py-1 rounded-lg shadow-[4px_4px_0px_0px_rgba(30,30,30,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
                Carrito (0)
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
