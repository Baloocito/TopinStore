'use client'

import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { Backpack, Menu, Search } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import CartDrawer from '@/components/store/CartDrawer'
import CategorySidebar from '@/components/store/CategorySidebar'
import Link from 'next/link'

export default function ShopLayoutClient({
  children,
  categories,
}: {
  children: React.ReactNode
  categories: any[]
}) {
  const { openCart, items } = useCartStore()
  const [isMounted, setIsMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => setIsMounted(true), [])

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className="min-h-screen bg-toon-bg">
      <nav className="sticky top-0 z-50 bg-white border-b-4 border-toon-border p-3 md:p-4 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] w-full">
        <div className="container mx-auto flex justify-between items-center gap-2">
          {/* LOGO - Ahora con Link real */}
          <Link
            href="/"
            className="font-black text-xl md:text-2xl tracking-tighter cursor-pointer hover:-translate-y-0.5 transition-transform shrink-0"
          >
            TOPIN STORE 🧸
          </Link>

          <div className="flex items-center gap-2 md:gap-4 font-bold shrink-0">
            {/* ESCRITORIO: Botón para ir a Explorar */}
            <Link
              href="/explore"
              className="hidden md:flex items-center gap-2 bg-slate-50 border-2 border-toon-border px-4 py-1.5 rounded-lg hover:bg-toon-pink hover:text-white transition-all uppercase text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
            >
              <Search size={16} strokeWidth={3} />
              Explorar Botín
            </Link>

            {/* MÓVIL: Hamburguesa para el Sidebar */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2 border-2 border-toon-border rounded-lg bg-slate-50 active:translate-y-1 active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <Menu size={20} strokeWidth={3} />
            </button>

            {/* BOTÓN MOCHILA */}
            <button
              onClick={openCart}
              className="bg-toon-yellow border-2 border-toon-border px-3 py-1.5 md:px-4 rounded-lg shadow-[3px_3px_0px_0px_rgba(30,30,30,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all uppercase text-xs md:text-sm font-black flex items-center gap-1 md:gap-2 group"
            >
              <Backpack
                size={18}
                strokeWidth={2.5}
                className="group-hover:-rotate-12 transition-transform"
              />
              <span className="hidden sm:inline">Mochila</span>
              {isMounted && totalItems > 0 && (
                <span className="bg-toon-pink text-white text-[10px] px-1.5 py-0.5 rounded-md border-2 border-toon-border drop-shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pb-20">{children}</main>

      {/* SIDEBAR CON DATA REAL */}
      <CategorySidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        categories={categories}
      />

      <CartDrawer />
      <Toaster position="bottom-right" />
    </div>
  )
}
