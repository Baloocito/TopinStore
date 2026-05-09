'use client'

import { useState } from 'react'
import { ShoppingCart, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '@/store/cartStore'

export default function AddToCartButton({ product }: { product: any }) {
  const [qty, setQty] = useState(1)
  const { addItem, openCart } = useCartStore()

  const decrement = () => setQty((prev) => Math.max(1, prev - 1))
  const increment = () => setQty((prev) => Math.min(product.stock, prev + 1))

  const handleAdd = () => {
    addItem({
      cartItemId: `normal-${product.id}`,
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: qty,
      image: product.images?.[0] || '',
      type: 'normal',
      maxStock: product.stock,
    })

    openCart()

    toast.custom(
      (t) => (
        <div className="w-full bg-[#fffdf5] border-4 border-toon-border rounded-2xl p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 relative overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="absolute -right-4 -top-4 opacity-10 text-7xl pointer-events-none rotate-12">
            🧰
          </div>
          <div className="text-4xl animate-bounce relative z-10 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            🧰
          </div>
          <div className="relative z-10">
            <h3 className="font-black text-base uppercase text-toon-border tracking-tighter leading-none mb-1">
              ¡Botín Asegurado!
            </h3>
            <p className="font-bold text-[10px] text-gray-500 uppercase">
              {qty}x {product.name}
            </p>
          </div>
        </div>
      ),
      { duration: 3000 },
    )
    setQty(1)
  }

  return (
    <div className="space-y-4">
      {/* SELECTOR DE CANTIDAD MEJORADO PARA MÓVIL */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border-3 border-toon-border rounded-xl p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <span className="font-black text-[10px] uppercase text-gray-400 pl-1">
          Unidades
        </span>
        <div className="flex items-center gap-2 bg-slate-50 border-2 border-toon-border rounded-lg p-1">
          <button
            onClick={decrement}
            disabled={qty <= 1}
            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-toon-border rounded-md hover:bg-toon-red hover:text-white disabled:opacity-30 transition-colors"
          >
            <Minus size={14} strokeWidth={3} />
          </button>

          <span className="font-black text-base w-6 text-center">{qty}</span>

          <button
            onClick={increment}
            disabled={qty >= product.stock}
            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-toon-border rounded-md hover:bg-toon-lime transition-colors disabled:opacity-30"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* BOTÓN DE COMPRA RESPONSIVO */}
      <button
        onClick={handleAdd}
        disabled={product.stock === 0}
        className="w-full bg-toon-yellow border-4 border-toon-border text-toon-border font-black text-lg md:text-xl uppercase py-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 disabled:opacity-50 disabled:grayscale transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 group"
      >
        <ShoppingCart
          strokeWidth={3}
          className="w-5 h-5 group-hover:-rotate-12 transition-transform"
        />
        <span className="truncate">Añadir al Cofre</span>
      </button>
    </div>
  )
}
