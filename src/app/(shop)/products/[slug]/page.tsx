import { getProductBySlug } from '@/lib/data'
import { notFound } from 'next/navigation'
import { cn } from '@/lib/utils'

// Tipos
interface Props {
  params: Promise<{ slug: string }>
}

interface ProductSpec {
  label: string
  value: string
}

export default async function ProductPage({ params }: Props) {
  // 1. En Next.js 15, debemos esperar los params
  const { slug } = await params

  // 2. Llamamos a la base de datos real
  const product = await getProductBySlug(slug)

  // 3. Si no existe, disparamos el 404 de Next.js
  if (!product) {
    notFound()
  }

  // 4. Casting seguro de specs que vienen del JSONB
  const realSpecs = (product.specs as ProductSpec[]) || []

  // 5. Combinar con datos calculados
  const displaySpecs: ProductSpec[] = [
    {
      label: 'Estado',
      value: product.stock === 1 ? '¡Pieza Única!' : 'Stock Disponible',
    },
    { label: 'Categoría', value: product.category?.name || 'General' },
    { label: 'SKU', value: product.sku },
    ...realSpecs, // Inyectamos las specs de la DB
  ]

  // 6. Datos temporales para la galería (agregar real image column en DB después)
  const tempImages = ['✨', '📦', '🎁']

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
      {/* Columna Izquierda: Galería */}
      <div className="space-y-4">
        <div className="aspect-square bg-white border-4 border-toon-border rounded-3xl shadow-toon flex items-center justify-center text-9xl">
          {product.type === 'pack' ? '📦' : '✨'}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {tempImages.map((img, i) => (
            <div
              key={i}
              className="aspect-square bg-white border-4 border-toon-border rounded-xl shadow-[4px_4px_0px_0px_rgba(30,30,30,1)] flex items-center justify-center text-4xl hover:translate-y-1 transition-transform cursor-pointer"
            >
              {img}
            </div>
          ))}
        </div>
      </div>

      {/* Columna Derecha: Info Real */}
      <div className="flex flex-col space-y-6">
        <header>
          <span className="bg-toon-blue border-2 border-toon-border px-3 py-1 rounded-full font-black text-sm uppercase">
            {product.category?.name || 'General'}
          </span>
          <h1 className="text-5xl font-black tracking-tighter uppercase mt-2 leading-none">
            {product.name}
          </h1>
        </header>

        <p className="text-3xl font-black text-toon-border">
          ${Number(product.price).toLocaleString('es-CL')}
        </p>

        <div className="bg-white border-4 border-toon-border p-6 rounded-2xl shadow-toon">
          <p className="font-bold text-lg leading-relaxed italic text-gray-600">
            {/* Si no hay descripción en la DB, mostramos un fallback */}
            {product.description ||
              'Este tesoro no tiene descripción aún, pero te aseguramos que es genial.'}
          </p>
        </div>

        {/* Specs dinámicos */}
        <div className="grid grid-cols-1 gap-2">
          {displaySpecs.map((spec) => (
            <div
              key={spec.label}
              className="flex border-b-2 border-toon-border/10 py-2 justify-between"
            >
              <span className="font-black uppercase text-xs text-gray-500">
                {spec.label}
              </span>
              <span className="font-bold">{spec.value}</span>
            </div>
          ))}
        </div>

        {/* Acciones de Compra */}
        <div className="pt-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex border-4 border-toon-border rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(30,30,30,1)]">
              <button className="bg-white px-4 py-2 font-black border-r-4 border-toon-border hover:bg-gray-100">
                -
              </button>
              <div className="bg-white px-6 py-2 font-black">1</div>
              <button className="bg-white px-4 py-2 font-black border-l-4 border-toon-border hover:bg-gray-100">
                +
              </button>
            </div>
            <span
              className={cn(
                'font-bold text-sm',
                product.stock < 5 ? 'text-red-500' : 'text-gray-400',
              )}
            >
              {product.stock} unidades disponibles
            </span>
          </div>

          <button
            disabled={product.stock === 0}
            className={cn(
              'w-full py-5 rounded-2xl border-4 border-toon-border font-black text-2xl shadow-toon transition-all',
              product.stock > 0
                ? 'bg-toon-pink hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:bg-pink-400'
                : 'bg-gray-300 cursor-not-allowed opacity-50',
            )}
          >
            {product.stock > 0 ? 'AÑADIR AL CARRITO 🛒' : 'AGOTADO'}
          </button>
        </div>
      </div>
    </div>
  )
}
