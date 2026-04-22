'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  BarChart3,
  Store,
} from 'lucide-react' // Usaremos iconos limpios

const MENU_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Inventario', href: '/dashboard/products', icon: Package },
  { label: 'Pack Creator', href: '/dashboard/packs', icon: Boxes },
  { label: 'Ventas', href: '/dashboard/sales', icon: ShoppingBag },
  { label: 'Métricas', href: '/dashboard/analytics', icon: BarChart3 },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-72 bg-white border-r-4 border-toon-border h-screen sticky top-0 flex flex-col p-6 space-y-8">
      {/* Header del Admin */}
      <div className="flex flex-col space-y-1">
        <span className="font-black text-3xl tracking-tighter uppercase italic">
          Topin<span className="text-toon-pink">Admin</span>
        </span>
        <div className="h-2 w-20 bg-toon-yellow border-2 border-toon-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 space-y-4">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-4 p-4 rounded-2xl border-4 transition-all group',
                isActive
                  ? 'bg-toon-yellow border-toon-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-1'
                  : 'bg-white border-transparent hover:border-toon-border/20 hover:translate-x-1',
              )}
            >
              <Icon
                className={cn(
                  'w-6 h-6 transition-colors',
                  isActive
                    ? 'text-toon-border'
                    : 'text-gray-400 group-hover:text-toon-border',
                )}
              />
              <span
                className={cn(
                  'font-black uppercase tracking-tight',
                  isActive
                    ? 'text-toon-border'
                    : 'text-gray-400 group-hover:text-toon-border',
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer del Sidebar: Volver a la tienda */}
      <div className="pt-6 border-t-4 border-toon-border/10">
        <Link
          href="/"
          className="flex items-center justify-center space-x-2 w-full py-3 bg-toon-blue border-3 border-toon-border rounded-xl font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all"
        >
          <Store className="w-4 h-4" />
          <span>VER TIENDA PÚBLICA</span>
        </Link>
      </div>
    </aside>
  )
}
