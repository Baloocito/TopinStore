'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Minus, ShoppingCart, Sparkles, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ==========================================
// TIPOS (Basados en nuestro esquema de Drizzle)
// ==========================================
type ProductIngredient = {
  id: number
  name: string
  price: number
  stock: number
  images: string[]
}

type BundleComponent = {
  minQuantity: number
  maxQuantity: number
  product: ProductIngredient
}

type PackData = {
  id: number
  name: string
  price: number // Precio Base (Envase)
  images: string[]
  description: string | null
  tier1Discount: number
  tier2Discount: number
  tier3Discount: number
  bundleComponents: BundleComponent[]
}

// ==========================================
// EL COMPONENTE PRINCIPAL
// ==========================================
export default function PackBuilder({ pack }: { pack: PackData }) {
  // Estado para llevar la cuenta de qué ingredientes ha elegido el cliente
  // Llave: ID del producto ingrediente, Valor: Cantidad seleccionada
  const [selections, setSelections] = useState<Record<number, number>>({})

  // 1. INICIALIZAR EL CARRITO CON LOS MÍNIMOS OBLIGATORIOS
  useEffect(() => {
    const initialSelections: Record<number, number> = {}
    pack.bundleComponents.forEach((comp) => {
      // Forzamos al cliente a empezar con el mínimo que dictaste en el Grimorio
      initialSelections[comp.product.id] = comp.minQuantity
    })
    setSelections(initialSelections)
  }, [pack])

  // ==========================================
  // MATEMÁTICAS DEL JUEGO
  // ==========================================
  const basePrice = Number(pack.price)

  // A. Calcular el Valor Máximo Posible (La meta del nivel 100)
  const maxIngredientsValue = pack.bundleComponents.reduce(
    (acc, comp) => acc + Number(comp.product.price) * comp.maxQuantity,
    0,
  )
  const maxTotalValue = basePrice + maxIngredientsValue

  // B. Calcular el Valor Actual (Lo que lleva armado el cliente)
  const currentIngredientsValue = pack.bundleComponents.reduce((acc, comp) => {
    const qty = selections[comp.product.id] || 0
    return acc + Number(comp.product.price) * qty
  }, 0)
  const currentValue = basePrice + currentIngredientsValue

  // C. Calcular la Barra de Progreso (0% a 100%)
  const progressPercent =
    maxTotalValue > 0 ? (currentValue / maxTotalValue) * 100 : 0

  // D. Determinar qué Nivel de Descuento (Tier) ha desbloqueado
  let activeDiscount = 0
  let currentTierText = 'Sin Descuento'

  if (progressPercent >= 100) {
    activeDiscount = pack.tier3Discount
    currentTierText = '¡NIVEL MÁXIMO DESBLOQUEADO!'
  } else if (progressPercent >= 66) {
    activeDiscount = pack.tier2Discount
    currentTierText = '¡NIVEL PLATA DESBLOQUEADO!'
  } else if (progressPercent >= 33) {
    activeDiscount = pack.tier1Discount
    currentTierText = '¡NIVEL BRONCE DESBLOQUEADO!'
  }

  // E. Calcular Precio Final a Pagar
  const discountAmount = Math.round(currentValue * (activeDiscount / 100))
  const finalPrice = currentValue - discountAmount

  // ==========================================
  // CONTROLES DEL JUGADOR
  // ==========================================
  const handleQuantityChange = (
    productId: number,
    delta: number,
    min: number,
    max: number,
    stock: number,
  ) => {
    setSelections((prev) => {
      const current = prev[productId] || 0
      let next = current + delta

      // Reglas de colisión: No puede bajar del mínimo ni subir del máximo (o del stock físico)
      if (next < min) next = min
      const absoluteMax = Math.min(max, stock)
      if (next > absoluteMax) next = absoluteMax

      return { ...prev, [productId]: next }
    })
  }

  // Comprobar si al menos cumplió con algún mínimo global para dejarlo comprar
  // (Por si tu base de datos permitía un pack donde TODO es opcional)
  const isCartEmpty = currentIngredientsValue === 0

  const handleAddToCart = () => {
    // Aquí conectarías con tu contexto de carrito (Zustand, Context API, etc.)
    console.log('Agregando al carrito:', {
      packId: pack.id,
      finalPrice,
      ingredients: selections,
    })
    alert('¡Botín agregado al carrito!')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      {/* ==========================================
          COLUMNA IZQUIERDA: EL PRODUCTO Y LA BARRA DE XP
          ========================================== */}
      <div className="lg:col-span-5 flex flex-col gap-6 sticky top-8">
        {/* FOTO PRINCIPAL */}
        <div className="bg-toon-pink/10 border-4 border-toon-border rounded-3xl p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative aspect-square">
          <Image
            src={pack.images[0] || '/placeholder.png'}
            alt={pack.name}
            fill
            className="object-cover rounded-2xl"
          />
          <div className="absolute top-4 left-4 bg-toon-yellow border-3 border-toon-border px-3 py-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-[-5deg]">
            <span className="font-black text-sm uppercase text-toon-border">
              Pack Dinámico
            </span>
          </div>
        </div>

        {/* INFO Y PRECIO */}
        <div className="bg-white border-4 border-toon-border rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="font-black text-3xl lg:text-4xl uppercase tracking-tighter text-toon-border mb-2 leading-none">
            {pack.name}
          </h1>
          <p className="font-bold text-gray-500 text-sm mb-6">
            {pack.description ||
              'Arma este pack a tu medida. ¡Mientras más agregues, más descuento ganas!'}
          </p>

          {/* LA BARRA DE EXPERIENCIA (TIERS) */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <span className="font-black text-[10px] uppercase tracking-widest text-toon-blue">
                Progreso del Botín
              </span>
              <span className="font-black text-xs text-toon-border">
                {Math.round(progressPercent)}%
              </span>
            </div>

            {/* Contenedor de la barra */}
            <div className="h-6 w-full bg-slate-200 border-3 border-toon-border rounded-full relative overflow-hidden">
              {/* Relleno dinámico */}
              <div
                className="h-full bg-toon-lime transition-all duration-500 ease-out border-r-3 border-toon-border"
                style={{ width: `${progressPercent}%` }}
              />

              {/* Marcas de los Tiers (33%, 66%) */}
              <div className="absolute top-0 left-1/3 w-1 h-full bg-toon-border/20" />
              <div className="absolute top-0 left-2/3 w-1 h-full bg-toon-border/20" />
            </div>

            {/* Leyenda de Tiers */}
            <div className="flex justify-between mt-2 px-1">
              <span
                className={cn(
                  'text-[9px] font-black uppercase transition-colors',
                  progressPercent >= 33 ? 'text-toon-lime' : 'text-gray-400',
                )}
              >
                33% (-{pack.tier1Discount}%)
              </span>
              <span
                className={cn(
                  'text-[9px] font-black uppercase transition-colors',
                  progressPercent >= 66 ? 'text-toon-lime' : 'text-gray-400',
                )}
              >
                66% (-{pack.tier2Discount}%)
              </span>
              <span
                className={cn(
                  'text-[9px] font-black uppercase transition-colors',
                  progressPercent >= 100 ? 'text-toon-yellow' : 'text-gray-400',
                )}
              >
                FULL (-{pack.tier3Discount}%)
              </span>
            </div>
          </div>

          {/* MATEMÁTICAS DEL CLIENTE */}
          <div className="bg-slate-50 border-3 border-dashed border-toon-border/30 rounded-2xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-xs text-gray-500">
                Valor Envase:
              </span>
              <span className="font-black text-sm text-gray-400">
                ${basePrice.toLocaleString('es-CL')}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-xs text-gray-500">
                Valor Ingredientes:
              </span>
              <span className="font-black text-sm text-gray-400">
                ${currentIngredientsValue.toLocaleString('es-CL')}
              </span>
            </div>

            {activeDiscount > 0 && (
              <div className="flex justify-between items-center mb-2 text-toon-pink animate-in slide-in-from-left-2">
                <span className="font-black text-xs uppercase">
                  {currentTierText}:
                </span>
                <span className="font-black text-sm">
                  -${discountAmount.toLocaleString('es-CL')}
                </span>
              </div>
            )}

            <div className="h-1 w-full bg-toon-border/10 rounded-full my-3" />

            <div className="flex justify-between items-end">
              <span className="font-black text-sm uppercase text-toon-border">
                Total a pagar:
              </span>
              <div className="text-right">
                {activeDiscount > 0 && (
                  <span className="block text-xs font-bold text-gray-400 line-through decoration-toon-red decoration-2">
                    ${currentValue.toLocaleString('es-CL')}
                  </span>
                )}
                <span className="block font-black text-4xl text-toon-border tracking-tighter">
                  ${finalPrice.toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          </div>

          {/* BOTÓN DE COMPRA */}
          <button
            onClick={handleAddToCart}
            disabled={isCartEmpty && basePrice === 0}
            className="w-full flex items-center justify-center gap-2 bg-toon-yellow border-4 border-toon-border text-toon-border font-black uppercase text-xl py-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
          >
            <ShoppingCart strokeWidth={3} />
            Agregar al Carrito
          </button>
        </div>
      </div>

      {/* ==========================================
          COLUMNA DERECHA: LOS INGREDIENTES
          ========================================== */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <h2 className="font-black text-2xl uppercase tracking-tight flex items-center gap-2 mb-2">
          <Sparkles className="text-toon-pink" />
          Elige tu Contenido
        </h2>

        {pack.bundleComponents.map((comp) => {
          const product = comp.product
          const currentQty = selections[product.id] || 0
          const maxAllowed = Math.min(comp.maxQuantity, product.stock)
          const isAtMax = currentQty >= maxAllowed
          const isAtMin = currentQty <= comp.minQuantity
          const isRequired = comp.minQuantity > 0

          return (
            <div
              key={product.id}
              className={cn(
                'flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border-4 p-4 rounded-3xl transition-all gap-4',
                currentQty > 0
                  ? 'border-toon-lime shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                  : 'border-toon-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-80 hover:opacity-100',
              )}
            >
              {/* INFO DEL INGREDIENTE */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 border-3 border-toon-border rounded-xl relative overflow-hidden shrink-0">
                  <Image
                    src={product.images[0] || '/placeholder.png'}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm md:text-base uppercase leading-tight">
                      {product.name}
                    </span>
                    {isRequired && (
                      <span className="bg-toon-pink text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full border-2 border-toon-border">
                        Fijo x{comp.minQuantity}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-gray-500 text-xs">
                    +${Number(product.price).toLocaleString('es-CL')} c/u
                  </span>

                  {/* Etiqueta de Stock Crítico */}
                  {product.stock > 0 && product.stock <= 5 && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-toon-red mt-1">
                      <AlertCircle size={10} /> ¡Quedan solo {product.stock}!
                    </span>
                  )}
                  {product.stock === 0 && (
                    <span className="text-[10px] font-black uppercase text-toon-red mt-1">
                      Agotado temporalmente
                    </span>
                  )}
                </div>
              </div>

              {/* CONTROLES DE CANTIDAD */}
              <div className="flex flex-col items-end shrink-0 w-full sm:w-auto">
                <div className="flex items-center bg-slate-50 border-3 border-toon-border rounded-xl p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    onClick={() =>
                      handleQuantityChange(
                        product.id,
                        -1,
                        comp.minQuantity,
                        comp.maxQuantity,
                        product.stock,
                      )
                    }
                    disabled={isAtMin}
                    className="w-10 h-10 flex items-center justify-center bg-white border-2 border-toon-border rounded-lg hover:bg-slate-100 active:translate-y-0.5 disabled:opacity-30 disabled:hover:bg-white transition-all"
                  >
                    <Minus size={18} strokeWidth={3} />
                  </button>

                  <span className="w-12 text-center font-black text-xl text-toon-border">
                    {currentQty}
                  </span>

                  <button
                    onClick={() =>
                      handleQuantityChange(
                        product.id,
                        1,
                        comp.minQuantity,
                        comp.maxQuantity,
                        product.stock,
                      )
                    }
                    disabled={isAtMax}
                    className="w-10 h-10 flex items-center justify-center bg-toon-lime border-2 border-toon-border rounded-lg hover:brightness-110 active:translate-y-0.5 disabled:opacity-30 disabled:hover:brightness-100 transition-all"
                  >
                    <Plus size={18} strokeWidth={3} />
                  </button>
                </div>

                <span className="text-[9px] font-bold text-gray-400 mt-2 uppercase text-right w-full">
                  Máximo permitido: {comp.maxQuantity}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
