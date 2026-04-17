import Link from 'next/link'
import { getProducts } from '@/lib/data'
import { cn } from '@/lib/utils'

export default async function ShopPage() {
  const realProducts = await getProducts()

  return (
    <div className="space-y-12">
      {/* Hero Section / Banner */}
      <section className="bg-toon-yellow border-4 border-toon-border p-8 rounded-3xl shadow-toon flex flex-col items-center text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">
          Tesoros & Cosas Kawaii
        </h1>
        <p className="text-xl font-bold max-w-lg">
          Desde la feria de las pulgas directamente a tu setup. ¡Packs armados y
          joyas únicas!
        </p>
      </section>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {realProducts.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className={cn(
              'group bg-white border-4 border-toon-border rounded-2xl overflow-hidden shadow-toon transition-all hover:-translate-y-1 hover:translate-x-1 hover:shadow-none block',
              product.stock === 0 && 'opacity-75 grayscale',
            )}
          >
            {/* Imagen / Placeholder */}
            <div className="aspect-square bg-toon-blue/20 border-b-4 border-toon-border flex items-center justify-center text-7xl group-hover:scale-110 transition-transform">
              {/* Aquí luego irá la imagen real de la DB */}
              {product.type === 'pack' ? '📦' : '✨'}
            </div>

            {/* Contenido */}
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                {/* Categoría Dinámica */}
                <span className="text-xs font-black uppercase bg-toon-pink border-2 border-toon-border px-2 py-0.5 rounded-full">
                  {product.category?.name || 'General'}
                </span>

                {/* Tag de Pack */}
                {product.type === 'pack' && (
                  <span className="text-[10px] font-black uppercase bg-white border-2 border-toon-border px-2 py-0.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    📦 Pack
                  </span>
                )}
              </div>

              <h3 className="font-black text-xl leading-tight h-12 line-clamp-2">
                {product.name}
              </h3>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm font-bold text-gray-500">Precio</p>
                  <p className="text-2xl font-black text-toon-border">
                    ${Number(product.price).toLocaleString('es-CL')}
                  </p>
                </div>

                {/* Indicador de Stock para Feria */}
                <div className="text-right text-[10px] font-bold">
                  {product.stock === 1 ? (
                    <span className="text-red-500 uppercase italic">
                      ¡Único!
                    </span>
                  ) : (
                    <span className="text-gray-400">{product.stock} disp.</span>
                  )}
                </div>
              </div>

              {/* Botón de Compra Visual */}
              <div
                className={cn(
                  'w-full py-3 rounded-xl border-3 border-toon-border font-black text-center text-lg shadow-[4px_4px_0px_0px_rgba(30,30,30,1)] transition-all',
                  product.stock > 0
                    ? 'bg-toon-yellow group-hover:bg-yellow-300'
                    : 'bg-gray-300',
                )}
              >
                {product.stock > 0 ? '¡LO QUIERO!' : 'AGOTADO'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
