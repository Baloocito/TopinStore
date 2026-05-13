'use client'

import Link from 'next/link'
import { XCircle, AlertCircle, ShoppingCart } from 'lucide-react'

export default function ErrorPage() {
  return (
    <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-8">
      <div className="bg-toon-red border-4 border-toon-border p-8 rounded-3xl shadow-toon inline-block">
        <XCircle size={64} className="text-white" strokeWidth={2.5} />
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-toon-border">
          ¡La Magia Falló!
        </h1>
        <p className="text-lg font-bold text-gray-500 max-w-md mx-auto">
          Hubo un problema procesando tu pago. Puede ser un error de la tarjeta
          o un fallo en la red.
        </p>
      </div>

      <div className="bg-red-50 border-4 border-toon-red/20 p-6 rounded-2xl space-y-3">
        <h3 className="font-black text-toon-red uppercase flex items-center justify-center gap-2">
          <AlertCircle size={18} /> ¿Qué pudo pasar?
        </h3>
        <ul className="text-sm font-bold text-gray-600 space-y-1">
          <li>• Fondos insuficientes en tu cofre.</li>
          <li>• La tarjeta no está autorizada para compras online.</li>
          <li>• El banco rechazó la transacción por seguridad.</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/checkout"
          className="bg-toon-lime border-4 border-toon-border px-10 py-4 rounded-2xl font-black uppercase shadow-toon hover:bg-green-400 transition-all flex items-center justify-center gap-2"
        >
          <ShoppingCart size={20} strokeWidth={3} /> Reintentar Pago
        </Link>
        <Link
          href="/"
          className="bg-white border-4 border-toon-border px-10 py-4 rounded-2xl font-black uppercase shadow-toon hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  )
}
