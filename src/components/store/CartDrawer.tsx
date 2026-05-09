'use client'

import { useCartStore } from '@/store/cartStore'
import {
  X,
  Trash2,
  Plus,
  Minus,
  Backpack,
  Coins,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, updateQuantity, getTotal } =
    useCartStore()

  // Truco para evitar errores de hidratación (Hydration Mismatch) al usar localStorage
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  if (!isOpen || !isMounted) return null

  return (
    <>
      {/* FONDO OSCURO CON BLUR (Detiene el tiempo visualmente) */}
      <div
        className="fixed inset-0 bg-toon-border/50 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
        onClick={closeCart}
      />

      {/* LA MOCHILA (DRAWER) */}
      <div className="fixed right-0 top-0 h-[100dvh] w-full max-w-md bg-[#fffdf5] border-l-8 border-toon-border z-[110] shadow-[-10px_0px_0px_0px_rgba(0,0,0,0.15)] flex flex-col animate-in slide-in-from-right duration-300">
        {/* HEADER DE LA MOCHILA */}
        <div className="p-6 border-b-4 border-toon-border bg-toon-yellow flex justify-between items-center shrink-0 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] z-10 relative">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white border-3 border-toon-border rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Backpack
                size={24}
                className="text-toon-border"
                strokeWidth={2.5}
              />
            </div>
            <div>
              <h2 className="font-black text-2xl uppercase tracking-tighter text-toon-border leading-none">
                Tu Mochila
              </h2>
              <span className="font-bold text-[10px] uppercase tracking-widest text-toon-border/70">
                {items.length}{' '}
                {items.length === 1 ? 'Slot ocupado' : 'Slots ocupados'}
              </span>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="p-2 bg-white border-3 border-toon-border rounded-xl hover:bg-toon-red hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all group"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* CONTENIDO (SLOTS DEL INVENTARIO) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[url('/grid-pattern.svg')]">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <span className="text-8xl mb-4 grayscale">🎒</span>
              <h3 className="font-black text-xl uppercase text-toon-border mb-2">
                Mochila Vacía
              </h3>
              <p className="font-bold text-sm text-gray-500 max-w-[200px]">
                Aún no has recolectado ningún botín en tu aventura.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.cartItemId}
                className="bg-white border-4 border-toon-border rounded-2xl p-3 flex gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group hover:-translate-y-1 transition-transform"
              >
                {/* Imagen del Item */}
                <div className="w-20 h-20 bg-slate-100 border-3 border-toon-border rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-3xl relative">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : item.type === 'pack' ? (
                    '📦'
                  ) : (
                    '✨'
                  )}
                  {/* Tag si es pack */}
                  {item.type === 'pack' && (
                    <div className="absolute -bottom-1 -right-1 bg-toon-pink border-2 border-toon-border text-white text-[8px] font-black uppercase px-1 rounded shadow-sm">
                      PACK
                    </div>
                  )}
                </div>

                {/* Info y Controles */}
                <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-black text-sm uppercase text-toon-border truncate leading-tight">
                      {item.name}
                    </h4>
                    <button
                      onClick={() => removeItem(item.cartItemId)}
                      className="text-gray-400 hover:text-toon-red transition-colors shrink-0"
                    >
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Controles de Cantidad */}
                    <div className="flex items-center gap-2 bg-slate-50 border-2 border-toon-border rounded-lg p-0.5">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.cartItemId,
                            Math.max(1, item.quantity - 1),
                          )
                        }
                        className="w-6 h-6 flex items-center justify-center bg-white border-2 border-toon-border rounded hover:bg-toon-red hover:text-white transition-colors"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </button>
                      <span className="font-black text-xs w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.cartItemId,
                            Math.min(item.maxStock, item.quantity + 1),
                          )
                        }
                        disabled={item.quantity >= item.maxStock}
                        className="w-6 h-6 flex items-center justify-center bg-white border-2 border-toon-border rounded hover:bg-toon-lime transition-colors disabled:opacity-30"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>

                    {/* Precio Total del Slot */}
                    <span className="font-black text-lg text-toon-lime drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                      ${(item.price * item.quantity).toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER (PAGO AL MERCADER) */}
        {items.length > 0 && (
          <div className="p-6 border-t-4 border-toon-border bg-white shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.05)] z-10 relative">
            <div className="flex justify-between items-end mb-4">
              <span className="font-black text-sm uppercase text-gray-400 tracking-widest">
                Botín Total
              </span>
              <div className="flex items-center gap-2 text-toon-yellow">
                <Coins
                  size={24}
                  className="fill-toon-yellow text-toon-border"
                  strokeWidth={2}
                />
                <span className="font-black text-4xl text-toon-border drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)] leading-none">
                  ${getTotal().toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            {/* AHORA ES UN LINK HACIA EL CHECKOUT */}
            <Link
              href="/checkout"
              onClick={closeCart} // Cerramos la mochila al cambiar de página
              className="w-full bg-toon-lime border-4 border-toon-border text-toon-border font-black text-xl uppercase py-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-400 transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 group overflow-hidden relative block text-center"
            >
              <span className="relative z-10 flex items-center gap-2">
                Ir al Mercader{' '}
                <ArrowRight
                  strokeWidth={3}
                  className="group-hover:translate-x-2 transition-transform"
                />
              </span>
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
