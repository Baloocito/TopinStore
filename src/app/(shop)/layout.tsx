'use client'

import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { Backpack } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import CartDrawer from '@/components/store/CartDrawer'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Conectamos el cerebro del inventario (Zustand)
  const { openCart, items } = useCartStore()

  // Seguro contra errores de hidratación de Next.js (ya que usamos localStorage)
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  // Calculamos el total de ítems guardados en la mochila
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className="min-h-screen bg-toon-bg">
      {/* Navbar con estilo Neobrutalista - Sombra corregida */}
      <nav className="sticky top-0 z-50 bg-white border-b-4 border-toon-border p-4 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] mb-8 w-full">
        <div className="container mx-auto flex justify-between items-center">
          <span className="font-black text-2xl tracking-tighter cursor-pointer hover:-translate-y-0.5 transition-transform">
            TOPIN STORE 🧸
          </span>
          <div className="space-x-4 font-bold flex items-center">
            <button className="hover:text-toon-pink transition-colors uppercase text-sm">
              Categorías
            </button>

            {/* BOTÓN DE LA MOCHILA */}
            <button
              onClick={openCart}
              className="bg-toon-yellow border-2 border-toon-border px-4 py-1.5 rounded-lg shadow-[3px_3px_0px_0px_rgba(30,30,30,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all uppercase text-sm font-black flex items-center gap-2 group"
            >
              <Backpack
                size={18}
                strokeWidth={2.5}
                className="group-hover:-rotate-12 transition-transform"
              />
              Mochila
              {/* Contador de Ítems tipo RPG */}
              {isMounted && totalItems > 0 && (
                <span className="bg-toon-pink text-white text-[10px] px-1.5 py-0.5 rounded-md border-2 border-toon-border drop-shadow-sm ml-1">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pb-20">{children}</main>

      {/* INYECTAMOS EL INVENTARIO Y LAS NOTIFICACIONES (Se dibujan por encima de todo) */}
      <CartDrawer />
      <Toaster position="bottom-right" />
    </div>
  )
}
