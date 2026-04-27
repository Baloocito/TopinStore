'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Edit3,
  ExternalLink,
  RotateCcw,
  Crosshair,
  Shield,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProductCard({ product }: { product: any }) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      // 1. REDUCIMOS LA ALTURA TOTAL DE 500px a 400px
      className="group w-full h-[400px] [perspective:1000px] cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={cn(
          'relative w-full h-full transition-all duration-500 [transform-style:preserve-3d]',
          isFlipped ? '[transform:rotateY(180deg)]' : '',
        )}
      >
        {/* ==========================================
            CARA FRONTAL
            ========================================== */}
        <div className="absolute inset-0 w-full h-full bg-white border-4 border-toon-border rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden [backface-visibility:hidden]">
          {/* 2. REDUCIMOS LA ALTURA DE LA IMAGEN DE h-52 a h-40 */}
          <div className="h-40 w-full bg-toon-blue/10 border-b-4 border-toon-border relative flex items-center justify-center shrink-0">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-5xl">📦</span>
            )}
            <span className="absolute top-2 right-2 bg-toon-yellow border-2 border-toon-border px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {product.category?.name || 'General'}
            </span>
          </div>

          {/* 3. AJUSTAMOS PADDINGS INTERNOS (p-4 en vez de p-5) */}
          <div className="p-4 flex-1 flex flex-col relative">
            <div className="absolute top-3 right-3 text-gray-300 group-hover:animate-spin-slow">
              <RotateCcw size={18} strokeWidth={3} />
            </div>

            <h3 className="font-black uppercase text-lg leading-tight line-clamp-1 pr-6">
              {product.name}
            </h3>
            <p className="font-mono text-[10px] text-gray-400 mt-0.5 mb-3">
              {product.sku}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4 mt-auto">
              <div className="bg-slate-50 border-3 border-toon-border rounded-xl py-2 flex flex-col items-center justify-center shadow-inner">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                  Stock
                </span>
                <span className="font-black text-base leading-none">
                  {product.stock}
                </span>
              </div>
              <div className="bg-slate-50 border-3 border-toon-border rounded-xl py-2 flex flex-col items-center justify-center shadow-inner">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                  Precio
                </span>
                <span className="font-black text-base text-toon-lime drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] leading-none">
                  ${Number(product.price).toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            <div className="flex gap-2" onClick={handleActionClick}>
              <Link
                href={`/dashboard/products?edit=${product.slug}`}
                className="flex-1 bg-toon-pink border-3 border-toon-border py-2.5 rounded-xl text-center font-black text-xs hover:bg-pink-400 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 flex items-center justify-center gap-2"
              >
                <Edit3 size={14} /> EDITAR
              </Link>
              <Link
                href={`/products/${product.slug}`}
                target="_blank"
                className="p-2.5 bg-white border-3 border-toon-border rounded-xl hover:bg-slate-100 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 flex items-center justify-center"
              >
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* ==========================================
            CARA TRASERA (BATTLE STATS)
            ========================================== */}
        <div className="absolute inset-0 w-full h-full bg-white text-toon-border border-4 border-toon-border rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="p-4 border-b-4 border-toon-border bg-toon-yellow relative">
            <div className="absolute top-3 right-3 text-toon-border">
              <RotateCcw size={18} strokeWidth={3} />
            </div>
            <h3 className="font-black uppercase text-xl tracking-tighter">
              BATTLE STATS
            </h3>
            <p className="font-mono text-[9px] font-bold text-toon-border/70 uppercase">
              Rendimiento Histórico
            </p>
          </div>

          {/* Reducimos gap-4 a gap-3 y p-6 a p-4 para que quepa perfecto en 400px */}
          <div className="p-4 flex-1 flex flex-col gap-3 justify-center bg-slate-50">
            <div className="bg-white border-3 border-toon-border rounded-2xl p-3 flex items-center gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="p-2.5 bg-toon-lime border-2 border-toon-border rounded-xl">
                <Crosshair size={18} className="text-toon-border" />
              </div>
              <div>
                <p className="font-black text-[9px] text-gray-500 uppercase tracking-widest">
                  Impactos (Ventas)
                </p>
                <p className="font-black text-xl leading-none mt-0.5">
                  42 Und.
                </p>
              </div>
            </div>

            <div className="bg-white border-3 border-toon-border rounded-2xl p-3 flex items-center gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="p-2.5 bg-toon-blue border-2 border-toon-border rounded-xl">
                <Shield size={18} className="text-toon-border" />
              </div>
              <div>
                <p className="font-black text-[9px] text-gray-500 uppercase tracking-widest">
                  Defensa (Vistas)
                </p>
                <p className="font-black text-xl leading-none mt-0.5">1,240</p>
              </div>
            </div>

            <div className="bg-white border-3 border-toon-border rounded-2xl p-3 flex items-center gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="p-2.5 bg-toon-pink border-2 border-toon-border rounded-xl">
                <Zap size={18} className="text-toon-border" />
              </div>
              <div>
                <p className="font-black text-[9px] text-gray-500 uppercase tracking-widest">
                  Magia (Conversión)
                </p>
                <p className="font-black text-xl leading-none mt-0.5">3.4%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
