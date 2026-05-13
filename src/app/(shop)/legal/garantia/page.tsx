import { ShieldCheck, RotateCcw, AlertTriangle } from 'lucide-react'

export default function WarrantyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-10 border-b-8 border-toon-border pb-6">
        <div className="p-4 bg-toon-lime border-4 border-toon-border rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <ShieldCheck
            size={40}
            className="text-toon-border"
            strokeWidth={2.5}
          />
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-toon-border">
            Garantía y Devoluciones
          </h1>
          <p className="font-bold text-gray-500 text-lg flex items-center gap-2 mt-2">
            Tu oro y tus productos están protegidos.
          </p>
        </div>
      </div>

      <div className="bg-white border-4 border-toon-border rounded-3xl p-6 md:p-10 shadow-toon space-y-10">
        <section className="space-y-3">
          <h2 className="text-2xl font-black uppercase text-toon-lime bg-toon-lime/10 inline-block px-3 py-1 rounded-lg border-2 border-toon-lime">
            1. Garantía Legal (6 Meses)
          </h2>
          <p className="font-bold text-gray-600 text-lg leading-relaxed">
            Siguiendo la Ley Pro Consumidor, si tu producto presenta fallas de
            fábrica, tienes derecho a la garantía de{' '}
            <span className="text-toon-border font-black">6 meses</span>. Puedes
            elegir entre el cambio, la reparación o la devolución del dinero.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-black uppercase text-toon-pink bg-toon-pink/10 inline-block px-3 py-1 rounded-lg border-2 border-toon-pink">
            2. Derecho a Retracto
          </h2>
          <p className="font-bold text-gray-600 text-lg leading-relaxed">
            ¿Te arrepentiste? Tienes{' '}
            <span className="text-toon-border font-black">
              10 días corridos
            </span>{' '}
            desde que recibes el paquete para solicitar la devolución, siempre
            que el producto esté sellado y con su empaque original intacto.
          </p>
        </section>

        <div className="p-6 bg-slate-50 border-4 border-dashed border-toon-border rounded-2xl flex gap-4 items-start">
          <AlertTriangle
            className="text-toon-yellow shrink-0"
            size={32}
            strokeWidth={3}
          />
          <div>
            <h4 className="font-black uppercase text-sm mb-1">
              Nota del Maestro de Forja:
            </h4>
            <p className="font-bold text-xs text-gray-500 leading-tight">
              No se aceptarán devoluciones de productos que hayan sido abiertos
              o utilizados, a menos que presenten una falla técnica cubierta por
              la garantía legal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
