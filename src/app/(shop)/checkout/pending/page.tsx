'use client'

import Link from 'next/link'
import { Clock, Info } from 'lucide-react'

export default function PendingPage() {
  return (
    <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-8">
      <div className="bg-toon-yellow border-4 border-toon-border p-8 rounded-3xl shadow-toon inline-block">
        <Clock
          size={64}
          className="text-toon-border animate-spin-slow"
          strokeWidth={2.5}
        />
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-toon-border">
          Pago en Revisión
        </h1>
        <p className="text-lg font-bold text-gray-500 max-w-md mx-auto">
          Mercado Pago está validando tu oro. No cierres la ventana de tu
          navegador todavía.
        </p>
      </div>

      <div className="bg-blue-50 border-4 border-toon-blue/30 p-6 rounded-2xl flex gap-4 text-left">
        <Info className="text-toon-blue shrink-0" size={24} />
        <p className="text-sm font-bold text-toon-blue">
          Si pagaste por transferencia o efectivo, esto puede tardar unos
          minutos (o hasta 24h). Te enviaremos el pergamino de confirmación
          apenas el dinero llegue al Gremio.
        </p>
      </div>

      <Link
        href="/"
        className="inline-block bg-white border-4 border-toon-border px-10 py-4 rounded-2xl font-black uppercase shadow-toon hover:bg-slate-50 transition-all"
      >
        Volver a la Aldea
      </Link>
    </div>
  )
}
