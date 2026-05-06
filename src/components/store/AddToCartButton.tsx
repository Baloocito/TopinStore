'use client'

import { useState } from 'react'
import { ShoppingCart, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '@/store/cartStore' // <-- EL CEREBRO DE LA MOCHILA

export default function AddToCartButton({
  product,
}: {
  product: any // Recibimos el producto completo de la base de datos
}) {
  const [qty, setQty] = useState(1)

  // Extraemos las funciones de Zustand
  const { addItem, openCart } = useCartStore()

  const decrement = () => setQty((prev) => Math.max(1, prev - 1))
  const increment = () => setQty((prev) => Math.min(product.stock, prev + 1))

  const handleAdd = () => {
    // 1. AÑADIR A LA BASE DE DATOS LOCAL (ZUSTAND)
    addItem({
      cartItemId: `normal-${product.id}`, // ID único para que se apile si es el mismo ítem
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: qty,
      image: product.images?.[0] || '', // Tomamos la primera imagen
      type: 'normal',
      maxStock: product.stock,
    })

    // 2. ABRIMOS LA MOCHILA PARA QUE EL JUGADOR VEA SU LOOT
    openCart()

    // 3. 🧰 EL COFRE ÉPICO
    toast.custom(
      (t) => (
        <div className="w-full bg-[#fffdf5] border-4 border-toon-border rounded-2xl p-4 md:p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 relative overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="absolute -right-4 -top-4 opacity-10 text-8xl pointer-events-none rotate-12">
            🧰
          </div>
          <div className="text-5xl animate-bounce relative z-10 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            🧰
          </div>
          <div className="relative z-10">
            <h3 className="font-black text-lg md:text-xl uppercase text-toon-border tracking-tighter leading-none mb-1">
              ¡Botín Asegurado!
            </h3>
            <p className="font-bold text-xs md:text-sm text-gray-500 uppercase tracking-widest">
              {qty}x {product.name} al cofre
            </p>
          </div>
        </div>
      ),
      { duration: 3000 },
    )

    // (Opcional) Reseteamos el contador a 1 después de añadir
    setQty(1)
  }

  return (
    <div className="space-y-4">
      {/* SELECTOR DE CANTIDAD */}
      <div className="flex items-center justify-between bg-white border-3 border-toon-border rounded-xl p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <span className="font-black text-xs uppercase text-gray-400 pl-2">
          Unidades:
        </span>
        <div className="flex items-center gap-3 bg-slate-50 border-2 border-toon-border rounded-lg p-1">
          <button
            onClick={decrement}
            disabled={qty <= 1}
            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-toon-border rounded-md hover:bg-toon-red hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-colors"
          >
            <Minus size={16} strokeWidth={3} />
          </button>

          <span className="font-black text-lg w-6 text-center">{qty}</span>

          <button
            onClick={increment}
            disabled={qty >= product.stock}
            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-toon-border rounded-md hover:bg-toon-lime transition-colors disabled:opacity-30 disabled:hover:bg-white"
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* BOTÓN DE COMPRA */}
      <button
        onClick={handleAdd}
        disabled={product.stock === 0}
        className="w-full bg-toon-yellow border-4 border-toon-border text-toon-border font-black text-xl md:text-2xl uppercase py-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 disabled:opacity-50 disabled:grayscale transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 group"
      >
        <ShoppingCart
          strokeWidth={3}
          className="group-hover:-rotate-12 transition-transform"
        />
        Añadir al Cofre
      </button>
    </div>
  )
}
