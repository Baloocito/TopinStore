'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// 1. Separamos el contenido que usa la URL (searchParams)
function SuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order') || 'ORDEN-DESCONOCIDA'

  return (
    <div className="max-w-2xl mx-auto py-20 text-center space-y-8">
      <div className="bg-toon-lime border-4 border-toon-border p-8 rounded-3xl shadow-toon animate-bounce-slow inline-block">
        <span className="text-7xl">🎁</span>
      </div>

      <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
        ¡Misión Cumplida!
      </h1>

      <div className="bg-white border-4 border-toon-border p-6 rounded-2xl shadow-toon text-left">
        <p className="font-black text-xs uppercase text-gray-400 mb-4">
          Comprobante de Gremio
        </p>
        <div className="flex justify-between border-b-2 border-dashed border-gray-200 pb-2">
          <span className="font-bold">Nro. de Orden:</span>
          <span className="font-black text-toon-blue">{orderNumber}</span>
        </div>
        <p className="mt-4 text-sm font-bold text-gray-500">
          Te hemos enviado un pergamino (correo) con el detalle de tu botín y
          los pasos para el seguimiento.
        </p>
      </div>

      <div className="flex gap-4 justify-center flex-wrap">
        {/* Este es el botón que Vercel no entendía sin el 'use client' */}
        <button
          onClick={() => window.print()}
          className="bg-white border-3 border-toon-border px-6 py-2 rounded-xl font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all"
        >
          Descargar PDF
        </button>
        <Link
          href="/"
          className="bg-toon-yellow border-3 border-toon-border px-6 py-2 rounded-xl font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all"
        >
          Volver a la Tienda
        </Link>
      </div>
    </div>
  )
}

// 2. Exportamos la página envuelta en Suspense (Requisito de Next.js para usar useSearchParams)
export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center font-black text-2xl animate-pulse text-toon-border">
          Preparando el botín...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
