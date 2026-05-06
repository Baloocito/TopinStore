'use client'

import { useState } from 'react'
import { Minus, Plus, ShoppingCart, Sparkles, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
// 1. IMPORTAMOS EL CEREBRO DEL INVENTARIO
import { useCartStore } from '@/store/cartStore'

export default function PackBuilder({ pack }: { pack: any }) {
  // Conectamos con Zustand
  const { addItem, openCart } = useCartStore()

  // 1. INICIALIZAR ESTADOS (Arrancamos con las cantidades mínimas exigidas)
  const [quantities, setQuantities] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {}
    pack.bundleComponents?.forEach((comp: any) => {
      initial[comp.product.id] = comp.minQuantity || 0
    })
    return initial
  })

  // 2. MATEMÁTICAS DEL CALDERO
  const basePrice = Number(pack.price) || 0

  // Calculamos el valor MÁXIMO posible (para saber cuál es el 100% de la barra)
  const maxIngredientsValue =
    pack.bundleComponents?.reduce((acc: number, comp: any) => {
      return acc + Number(comp.product.price) * comp.maxQuantity
    }, 0) || 0
  const maxTotalValue = basePrice + maxIngredientsValue

  // Calculamos el valor ACTUAL según lo que el usuario ha seleccionado
  const currentIngredientsValue =
    pack.bundleComponents?.reduce((acc: number, comp: any) => {
      const qty = quantities[comp.product.id] || 0
      return acc + Number(comp.product.price) * qty
    }, 0) || 0
  const currentTotalValue = basePrice + currentIngredientsValue

  // 3. MOTOR DE TIERS Y DESCUENTOS
  const capacityRatio =
    maxTotalValue > 0 ? currentTotalValue / maxTotalValue : 0
  const capacityPercent = Math.min(capacityRatio * 100, 100)

  let discountPercent = 0
  let activeTier = 0

  if (capacityRatio >= 1) {
    discountPercent = pack.tier3Discount || 0
    activeTier = 3
  } else if (capacityRatio >= 0.66) {
    discountPercent = pack.tier2Discount || 0
    activeTier = 2
  } else if (capacityRatio >= 0.33) {
    discountPercent = pack.tier1Discount || 0
    activeTier = 1
  }

  const discountAmount = Math.round(currentTotalValue * (discountPercent / 100))
  const finalPrice = currentTotalValue - discountAmount

  // 4. HANDLERS
  const updateQuantity = (
    id: number,
    delta: number,
    min: number,
    max: number,
    stock: number,
  ) => {
    setQuantities((prev) => {
      const current = prev[id] || 0
      const next = current + delta
      const actualMax = Math.min(max, stock) // Nunca dejar que compren más del stock real

      if (next >= min && next <= actualMax) {
        return { ...prev, [id]: next }
      }
      return prev
    })
  }

  const handleAddToCart = () => {
    // A. PREPARAMOS LA RECETA (Solo los ítems que el usuario seleccionó con cantidad > 0)
    const selectedIngredients = pack.bundleComponents
      ?.map((comp: any) => ({
        id: comp.product.id,
        name: comp.product.name,
        qty: quantities[comp.product.id] || 0,
      }))
      .filter((item: any) => item.qty > 0)

    // B. AÑADIMOS A LA MOCHILA
    addItem({
      // Usamos Date.now() para que pueda agregar varios packs iguales pero con distintas configuraciones
      cartItemId: `pack-${pack.id}-${Date.now()}`,
      productId: pack.id,
      name: pack.name,
      price: finalPrice, // El precio final ya con el descuento aplicado
      quantity: 1, // Añadimos 1 pack armado
      image: pack.images?.[0] || '',
      type: 'pack',
      maxStock: pack.stock, // Depende del stock maestro del pack
      packConfig: { items: selectedIngredients }, // Guardamos la receta
    })

    // C. ABRIMOS LA MOCHILA
    openCart()

    // 🧰 EL COFRE ÉPICO
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
              ¡Receta Forjada!
            </h3>
            <p className="font-bold text-xs md:text-sm text-gray-500 uppercase tracking-widest">
              Pack añadido a tu cofre
            </p>
          </div>
        </div>
      ),
      { duration: 3000 },
    )
  }

  return (
    <div className="bg-slate-50 border-4 border-toon-border p-4 md:p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6">
      {/* HEADER DE CRAFTEO */}
      <div className="flex items-center gap-2 border-b-4 border-toon-border/10 pb-4">
        <Sparkles className="text-toon-pink" size={24} />
        <div>
          <h2 className="font-black text-xl uppercase text-toon-border tracking-tighter">
            Forjar Pack
          </h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Añade ítems para desbloquear descuentos
          </p>
        </div>
      </div>

      {/* BARRA DE PROGRESO DE DESCUENTOS (XP BAR) */}
      <div className="bg-white border-3 border-toon-border rounded-2xl p-4 shadow-inner">
        <div className="flex justify-between items-end mb-2">
          <span className="font-black text-xs uppercase text-gray-500">
            Progreso de Descuento
          </span>
          <span className="font-black text-sm text-toon-pink">
            {discountPercent}% OFF
          </span>
        </div>

        <div className="h-6 w-full bg-slate-100 border-2 border-toon-border rounded-full relative overflow-hidden flex">
          <div
            className={cn(
              'h-full bg-toon-pink transition-all duration-500 relative',
              capacityPercent < 100 ? 'border-r-2 border-toon-border' : '',
            )}
            style={{ width: `${capacityPercent}%` }}
          >
            <div className="absolute top-0 left-0 right-0 h-2 bg-white/30" />
          </div>

          {/* Marcadores de Tiers */}
          <div className="absolute left-[33%] top-0 bottom-0 border-l-2 border-toon-border border-dashed z-10 flex items-center justify-center -ml-[1px]">
            {activeTier >= 1 && (
              <div className="absolute -top-6 text-[10px] font-black bg-toon-border text-white px-1 rounded">
                T1
              </div>
            )}
          </div>
          <div className="absolute left-[66%] top-0 bottom-0 border-l-2 border-toon-border border-dashed z-10 flex items-center justify-center -ml-[1px]">
            {activeTier >= 2 && (
              <div className="absolute -top-6 text-[10px] font-black bg-toon-border text-white px-1 rounded">
                T2
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LISTA DE INGREDIENTES */}
      <div className="space-y-3">
        {pack.bundleComponents?.map((comp: any) => {
          const item = comp.product
          const qty = quantities[item.id] || 0
          const actualMax = Math.min(comp.maxQuantity, item.stock)

          return (
            <div
              key={item.id}
              className="flex items-center justify-between bg-white border-3 border-toon-border p-3 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] gap-2"
            >
              {/* Info Ítem */}
              <div className="flex-1 min-w-0 pr-2">
                <span className="font-black text-sm uppercase text-toon-border truncate block">
                  {item.name}
                </span>
                <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                  + ${Number(item.price).toLocaleString('es-CL')} c/u
                </span>
              </div>

              {/* Controles de Cantidad */}
              <div className="flex items-center gap-3 shrink-0 bg-slate-50 border-2 border-toon-border rounded-lg p-1">
                <button
                  onClick={() =>
                    updateQuantity(
                      item.id,
                      -1,
                      comp.minQuantity,
                      comp.maxQuantity,
                      item.stock,
                    )
                  }
                  disabled={qty <= comp.minQuantity}
                  className="w-8 h-8 flex items-center justify-center bg-white border-2 border-toon-border rounded hover:bg-toon-red hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-colors"
                >
                  <Minus size={16} strokeWidth={3} />
                </button>

                <span className="font-black text-sm w-4 text-center">
                  {qty}
                </span>

                <button
                  onClick={() =>
                    updateQuantity(
                      item.id,
                      1,
                      comp.minQuantity,
                      comp.maxQuantity,
                      item.stock,
                    )
                  }
                  disabled={qty >= actualMax}
                  className="w-8 h-8 flex items-center justify-center bg-white border-2 border-toon-border rounded hover:bg-toon-lime transition-colors disabled:opacity-30 disabled:hover:bg-white"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* RESUMEN FINAL Y BOTÓN DE COMPRA */}
      <div className="pt-4 border-t-4 border-dashed border-toon-border/20 space-y-4">
        <div className="flex justify-between items-center text-gray-500 font-bold text-sm">
          <span>Envase Base</span>
          <span>${basePrice.toLocaleString('es-CL')}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between items-center text-toon-red font-black text-sm bg-toon-red/10 p-2 rounded-lg border-2 border-toon-red/30">
            <span className="flex items-center gap-1">
              <TrendingDown size={16} /> Ahorro (Tier {activeTier})
            </span>
            <span>- ${discountAmount.toLocaleString('es-CL')}</span>
          </div>
        )}

        <div className="flex justify-between items-end pt-2">
          <span className="font-black text-xs uppercase text-gray-400 tracking-widest">
            Total Forjado
          </span>
          <div className="text-right">
            {discountAmount > 0 && (
              <span className="block text-sm font-bold text-gray-400 line-through decoration-toon-red decoration-2 mb-1">
                ${currentTotalValue.toLocaleString('es-CL')}
              </span>
            )}
            <span className="block font-black text-3xl md:text-4xl text-toon-border drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)] leading-none">
              ${finalPrice.toLocaleString('es-CL')}
            </span>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full bg-toon-lime border-4 border-toon-border text-toon-border font-black text-xl uppercase py-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-400 transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 group"
        >
          <ShoppingCart
            strokeWidth={3}
            className="group-hover:-rotate-12 transition-transform"
          />
          Añadir al Cofre
        </button>
      </div>
    </div>
  )
}
