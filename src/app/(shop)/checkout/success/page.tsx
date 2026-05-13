'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { PartyPopper, Truck, Mail, Printer, ShoppingBag } from 'lucide-react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order') || 'TOPIN-XXXXXX'

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 text-center space-y-10 animate-in fade-in zoom-in duration-500">
      {/* Icono Animado */}
      <div className="relative inline-block">
        <div className="bg-toon-lime border-4 border-toon-border p-8 rounded-3xl shadow-toon animate-bounce-slow relative z-10">
          <PartyPopper
            size={64}
            className="text-toon-border"
            strokeWidth={2.5}
          />
        </div>
        <div className="absolute -top-4 -right-4 bg-toon-yellow border-2 border-toon-border p-2 rounded-full shadow-sm animate-pulse">
          <span className="text-xl">✨</span>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-toon-border italic">
          ¡Misión Cumplida!
        </h1>
        <p className="text-xl font-bold text-gray-500">
          Tu botín ha sido asegurado con éxito.
        </p>
      </div>

      <div className="bg-white border-4 border-toon-border p-8 rounded-3xl shadow-toon text-left relative overflow-hidden">
        {/* Marca de agua decorativa */}
        <div className="absolute -right-8 -bottom-8 opacity-5 rotate-12">
          <ShoppingBag size={150} />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-center border-b-4 border-dashed border-slate-100 pb-4">
            <span className="font-black text-sm uppercase text-gray-400">
              Código de Misión
            </span>
            <span className="font-black text-2xl text-toon-blue tracking-widest">
              {orderNumber}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="bg-toon-blue/10 p-3 rounded-xl h-fit">
                <Mail className="text-toon-blue" size={24} />
              </div>
              <div>
                <p className="font-black text-sm uppercase">
                  Pergamino en camino
                </p>
                <p className="text-xs font-bold text-gray-500 leading-tight mt-1">
                  Revisa tu correo (y el SPAM). Ahí está el detalle de tu
                  compra.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-toon-lime/10 p-3 rounded-xl h-fit">
                <Truck className="text-toon-lime" size={24} />
              </div>
              <div>
                <p className="font-black text-sm uppercase">
                  Preparando Carreta
                </p>
                <p className="text-xs font-bold text-gray-500 leading-tight mt-1">
                  En un máximo de 48h hábiles tu pedido saldrá de la forja hacia
                  tu destino.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 justify-center flex-wrap">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-white border-4 border-toon-border px-8 py-4 rounded-2xl font-black uppercase text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all"
        >
          <Printer size={20} strokeWidth={3} /> Guardar Comprobante
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 bg-toon-yellow border-4 border-toon-border px-8 py-4 rounded-2xl font-black uppercase text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all"
        >
          <ShoppingBag size={20} strokeWidth={3} /> Seguir Comprando
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center font-black text-2xl animate-pulse">
          Preparando el botín...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
