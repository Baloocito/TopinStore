import { Truck, ShieldCheck } from 'lucide-react'

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      {/* HEADER LEGAL */}
      <div className="flex items-center gap-4 mb-10 border-b-8 border-toon-border pb-6">
        <div className="p-4 bg-toon-blue border-4 border-toon-border rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Truck size={40} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-toon-border">
            Políticas de Envío
          </h1>
          <p className="font-bold text-gray-500 text-lg flex items-center gap-2 mt-2">
            <ShieldCheck size={18} /> Reglas claras, botines seguros.
          </p>
        </div>
      </div>

      {/* CONTENIDO TIPO PERGAMINO */}
      <div className="bg-white border-4 border-toon-border rounded-3xl p-6 md:p-10 shadow-toon space-y-8">
        <section className="space-y-3">
          <h2 className="text-2xl font-black uppercase text-toon-pink bg-toon-pink/10 inline-block px-3 py-1 rounded-lg border-2 border-toon-pink">
            1. Preparación de la Carreta
          </h2>
          <p className="font-bold text-gray-600 text-lg leading-relaxed">
            Todos los botines de Topin Store se procesan y empaquetan en nuestra
            forja dentro de las siguientes{' '}
            <span className="text-toon-border font-black bg-toon-yellow px-1 border-2 border-toon-border rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              48 horas hábiles
            </span>{' '}
            después de confirmado el pago.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-black uppercase text-toon-lime bg-toon-lime/10 inline-block px-3 py-1 rounded-lg border-2 border-toon-lime">
            2. Rutas y Tiempos
          </h2>
          <p className="font-bold text-gray-600 text-lg leading-relaxed">
            Utilizamos couriers establecidos (Starken, Chilexpress). Los tiempos
            de entrega dependen exclusivamente de ellos. Por lo general, dentro
            de la Región Metropolitana tardan entre 1 a 3 días hábiles, y a
            regiones entre 3 a 7 días hábiles.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-black uppercase text-toon-blue bg-toon-blue/10 inline-block px-3 py-1 rounded-lg border-2 border-toon-blue">
            3. Pérdidas en el Camino
          </h2>
          <p className="font-bold text-gray-600 text-lg leading-relaxed">
            Si la empresa de transporte pierde tu paquete, nosotros nos hacemos
            cargo de la batalla con ellos. Te enviaremos un reemplazo o te
            devolveremos el oro, según prefieras, una vez que el courier declare
            el paquete como extraviado oficialmente.
          </p>
        </section>
      </div>
    </div>
  )
}
