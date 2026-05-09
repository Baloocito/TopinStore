import { getProductBySlug } from '@/lib/data'
import { notFound } from 'next/navigation'
import { recordProductView } from '@/app/actions/tracking'
import { ArrowLeft, ShieldCheck, Truck, CreditCard, Info } from 'lucide-react'
import Link from 'next/link'
import PackBuilder from '@/components/store/PackBuilder'
import ProductGallery from '@/components/store/ProductGallery'
import AddToCartButton from '@/components/store/AddToCartButton'
import { cn } from '@/lib/utils'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params
  const product = await getProductBySlug(resolvedParams.slug)

  if (!product) {
    return notFound()
  }

  recordProductView(product.id)

  // Parseo seguro de Specs
  const parsedSpecs = Array.isArray(product.specs)
    ? product.specs
    : typeof product.specs === 'string'
      ? JSON.parse(product.specs)
      : []

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pt-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 font-black uppercase text-xs hover:text-toon-pink transition-colors"
      >
        <ArrowLeft size={16} strokeWidth={3} /> Volver a la Tienda
      </Link>

      <div className="bg-white border-4 border-toon-border rounded-3xl p-6 md:p-8 shadow-toon flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* LADO IZQUIERDO: GALERÍA */}
        <ProductGallery
          images={product.images || []}
          type={product.type}
          name={product.name}
        />

        {/* LADO DERECHO: INFO Y COMPRA */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="mb-6">
            <span className="text-xs font-black uppercase text-toon-purple tracking-widest block mb-2">
              {product.category?.name || 'Tesoro General'}
            </span>
            <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter text-toon-border leading-none mb-4">
              {product.name}
            </h1>
            <p className="font-bold text-gray-500 text-sm md:text-base leading-snug whitespace-pre-wrap mb-6">
              {product.description ||
                'Un objeto misterioso y lleno de magia sin descripción conocida.'}
            </p>

            {/* ESPECIFICACIONES (SPECS) */}
            {parsedSpecs.length > 0 && (
              <div className="bg-slate-50 border-3 border-toon-border rounded-2xl p-4 mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-black text-xs uppercase text-toon-border mb-3 flex items-center gap-2">
                  <Info size={16} className="text-toon-blue" /> Ficha Técnica
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {parsedSpecs.map((spec: any, i: number) => (
                    <div
                      key={i}
                      className="flex flex-col bg-white border-2 border-toon-border/20 rounded-lg p-2"
                    >
                      <span className="text-[9px] font-black uppercase text-gray-400">
                        {spec.label}
                      </span>
                      <span className="font-bold text-sm text-toon-border truncate">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto">
            {product.type === 'pack' ? (
              <PackBuilder pack={product} />
            ) : (
              <div className="bg-slate-50 border-4 border-toon-border p-5 md:p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6">
                {/* ZONA DE PRECIO Y STOCK RESPONSIVA */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b-4 border-dashed border-toon-border/20 pb-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                      Inversión requerida
                    </span>
                    <span className="font-black text-4xl text-toon-lime drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] leading-none">
                      ${Number(product.price).toLocaleString('es-CL')}
                    </span>
                  </div>

                  {/* El Badge de Stock ahora es flexible */}
                  <div className="shrink-0">
                    <span
                      className={cn(
                        'font-black uppercase text-[10px] md:text-xs px-3 py-1.5 rounded-lg border-2 border-toon-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block',
                        product.stock > 0
                          ? 'bg-white text-toon-blue'
                          : 'bg-toon-red text-white',
                      )}
                    >
                      {product.stock > 0
                        ? `${product.stock} DISPONIBLES`
                        : 'AGOTADO'}
                    </span>
                  </div>
                </div>

                {/* BOTÓN CON SELECTOR Y LÓGICA DE INVENTARIO */}
                <AddToCartButton product={product} />

                {/* TRUST BADGES (ESCUDOS DE CONFIANZA) */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="flex flex-col items-center text-center gap-1">
                    <ShieldCheck
                      size={24}
                      className="text-toon-lime"
                      strokeWidth={2.5}
                    />
                    <span className="font-black text-[9px] uppercase text-gray-500 leading-tight">
                      Compra
                      <br />
                      Segura
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-1">
                    <Truck
                      size={24}
                      className="text-toon-blue"
                      strokeWidth={2.5}
                    />
                    <span className="font-black text-[9px] uppercase text-gray-500 leading-tight">
                      Envío a todo
                      <br />
                      Chile
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-1">
                    <CreditCard
                      size={24}
                      className="text-toon-purple"
                      strokeWidth={2.5}
                    />
                    <span className="font-black text-[9px] uppercase text-gray-500 leading-tight">
                      Múltiples
                      <br />
                      Pagos
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
