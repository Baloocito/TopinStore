import { Scale, FileText, Gavel } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-10 border-b-8 border-toon-border pb-6">
        <div className="p-4 bg-toon-yellow border-4 border-toon-border rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Scale size={40} className="text-toon-border" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-toon-border">
            Términos y Condiciones
          </h1>
          <p className="font-bold text-gray-500 text-lg mt-2">
            Las reglas del juego en Topin Store.
          </p>
        </div>
      </div>

      <div className="bg-white border-4 border-toon-border rounded-3xl p-6 md:p-10 shadow-toon space-y-10">
        <section className="space-y-3">
          <h2 className="text-2xl font-black uppercase text-toon-blue bg-toon-blue/10 inline-block px-3 py-1 rounded-lg border-2 border-toon-blue">
            <Gavel size={20} className="inline mr-2 mb-1" /> Propiedad del
            Gremio
          </h2>
          <p className="font-bold text-gray-600 text-lg leading-relaxed">
            Este sitio es operado por Topin Store SpA. Todo el contenido,
            imágenes y diseños neo-brutalistas son propiedad intelectual de
            nuestro gremio y no pueden ser usados sin permiso.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-black uppercase text-toon-pink bg-toon-pink/10 inline-block px-3 py-1 rounded-lg border-2 border-toon-pink">
            <FileText size={20} className="inline mr-2 mb-1" /> Exactitud de
            Precios
          </h2>
          <p className="font-bold text-gray-600 text-lg leading-relaxed">
            Aunque nuestros duendes revisan todo, si un producto aparece con un
            precio de $0 por error técnico, nos reservamos el derecho de
            cancelar la misión y devolver el oro pagado.
          </p>
        </section>

        <section className="space-y-4 pt-4 border-t-2 border-dashed border-slate-100">
          <p className="text-sm font-bold text-gray-400 italic">
            Al realizar una compra en Topin Store, declaras haber leído y
            aceptado estos términos, así como las políticas de envío y garantía.
          </p>
        </section>
      </div>
    </div>
  )
}
