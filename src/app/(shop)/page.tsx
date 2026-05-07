import Link from 'next/link'
import { getProducts } from '@/lib/data'
import { cn } from '@/lib/utils'
import {
  Flame,
  ShieldCheck,
  Truck,
  Sparkles,
  TrendingUp,
  Star,
} from 'lucide-react'

export default async function ShopPage() {
  const realProducts = await getProducts()

  // Filtramos los productos activos y con stock para el "Top"
  // Simulamos los "Más Vendidos" tomando los primeros 3 (puedes ordenarlos por salesCount si tu getProducts lo trae)
  const topItems = [...realProducts].filter((p) => p.stock > 0).slice(0, 3)

  return (
    <div className="space-y-12 md:space-y-16 animate-in fade-in duration-500 pt-4">
      {/* ==========================================
          1. HERO SECTION (ALTO IMPACTO)
          ========================================== */}
      <section className="bg-toon-purple border-4 border-toon-border p-8 md:p-12 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col md:flex-row items-center gap-8 justify-between">
        {/* Fondo decorativo */}
        <div className="absolute -right-20 -top-20 text-[200px] opacity-10 pointer-events-none rotate-12">
          🧸
        </div>

        <div className="flex flex-col items-start text-left space-y-6 relative z-10 w-full md:w-2/3">
          <div className="bg-toon-lime text-toon-border font-black text-xs md:text-sm uppercase px-3 py-1 rounded-full border-2 border-toon-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 w-max">
            <Sparkles size={16} /> ¡Nueva Colección Disponible!
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] leading-none">
            Tesoros &<br />
            Cosas Kawaii
          </h1>

          <p className="text-lg md:text-xl font-bold text-white/90 max-w-lg leading-snug">
            Desde la feria de las pulgas directamente a tu setup. Arma tu
            inventario con packs dinámicos y joyas únicas.
          </p>

          <Link
            href="#todo-el-botin"
            className="bg-toon-yellow text-toon-border border-4 border-toon-border font-black text-xl uppercase px-8 py-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 group"
          >
            Explorar Botín{' '}
            <TrendingUp
              className="group-hover:translate-x-1 transition-transform"
              strokeWidth={3}
            />
          </Link>
        </div>

        {/* Imagen Gigante Hero */}
        <div className="w-full md:w-1/3 flex justify-center relative z-10 hidden md:flex">
          <div className="w-64 h-64 bg-toon-pink border-4 border-toon-border rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-9xl animate-bounce-slow">
            ✨
          </div>
        </div>
      </section>

      {/* ==========================================
          2. TRUST BADGES (ESCUDOS DE CONFIANZA)
          ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 border-4 border-toon-border p-4 rounded-2xl flex items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
          <div className="bg-toon-lime p-3 rounded-xl border-2 border-toon-border">
            <Truck strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="font-black uppercase text-sm">
              Envíos a todo Chile
            </h4>
            <p className="text-[10px] font-bold text-gray-500 uppercase">
              Rápido y seguro
            </p>
          </div>
        </div>
        <div className="bg-slate-50 border-4 border-toon-border p-4 rounded-2xl flex items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
          <div className="bg-toon-yellow p-3 rounded-xl border-2 border-toon-border">
            <ShieldCheck strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="font-black uppercase text-sm">Compra Protegida</h4>
            <p className="text-[10px] font-bold text-gray-500 uppercase">
              Transacción encriptada
            </p>
          </div>
        </div>
        <div className="bg-slate-50 border-4 border-toon-border p-4 rounded-2xl flex items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
          <div className="bg-toon-pink p-3 rounded-xl border-2 border-toon-border text-white">
            <Star strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="font-black uppercase text-sm">Calidad Kawaii</h4>
            <p className="text-[10px] font-bold text-gray-500 uppercase">
              Selección premium
            </p>
          </div>
        </div>
      </div>

      {/* ==========================================
          3. ITEMS META (LOS MÁS VENDIDOS / DESTACADOS)
          ========================================== */}
      {topItems.length > 0 && (
        <section className="space-y-6 bg-white border-4 border-toon-border p-6 md:p-8 rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-3 border-b-4 border-toon-border/10 pb-4">
            <Flame className="text-toon-red fill-toon-red" size={32} />
            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-toon-border leading-none">
                Items Meta
              </h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                El botín más codiciado por el Gremio
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {topItems.map((product, idx) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group bg-slate-50 border-4 border-toon-border rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] block relative"
              >
                {/* Corona de Top */}
                <div className="absolute top-2 right-2 bg-toon-yellow border-2 border-toon-border text-xs font-black px-2 py-1 rounded-lg z-10 flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  TOP {idx + 1}
                </div>

                <div className="aspect-square bg-white border-b-4 border-toon-border relative overflow-hidden flex items-center justify-center text-7xl">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="group-hover:scale-110 transition-transform">
                      {product.type === 'pack' ? '📦' : '✨'}
                    </span>
                  )}
                </div>
                <div className="p-4 bg-toon-blue/10">
                  <span className="text-[10px] font-black uppercase text-toon-blue tracking-widest">
                    {product.category?.name || 'Destacado'}
                  </span>
                  <h3 className="font-black text-lg leading-tight h-12 line-clamp-2 mt-1">
                    {product.name}
                  </h3>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-2xl font-black text-toon-border">
                      ${Number(product.price).toLocaleString('es-CL')}
                    </span>
                    <span className="bg-toon-lime text-toon-border border-2 border-toon-border font-black text-xs px-2 py-1 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      VER LOOT
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ==========================================
          4. GRILLA COMPLETA DE PRODUCTOS
          ========================================== */}
      <section id="todo-el-botin" className="space-y-6 pt-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-toon-border w-4 h-8 rounded-full" />
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-toon-border">
            Todo el Botín
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {realProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className={cn(
                'group bg-white border-4 border-toon-border rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:translate-x-1 hover:shadow-none block flex flex-col',
                product.stock === 0 && 'opacity-75 grayscale',
              )}
            >
              <div className="aspect-square bg-slate-50 border-b-4 border-toon-border relative overflow-hidden flex items-center justify-center text-7xl">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span className="group-hover:scale-110 transition-transform">
                    {product.type === 'pack' ? '📦' : '✨'}
                  </span>
                )}
              </div>

              <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase bg-toon-pink text-white border-2 border-toon-border px-2 py-0.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {product.category?.name || 'General'}
                  </span>
                  {product.type === 'pack' && (
                    <span className="text-[10px] font-black uppercase bg-white border-2 border-toon-border px-2 py-0.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      📦 Pack
                    </span>
                  )}
                </div>

                <h3 className="font-black text-lg leading-tight line-clamp-2 flex-1">
                  {product.name}
                </h3>

                <div className="flex justify-between items-end mt-4 mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                      Precio
                    </p>
                    <p className="text-2xl font-black text-toon-border leading-none">
                      ${Number(product.price).toLocaleString('es-CL')}
                    </p>
                  </div>
                  <div className="text-right text-[10px] font-bold">
                    {product.stock === 1 ? (
                      <span className="text-toon-red uppercase bg-red-100 px-1 rounded border border-toon-red">
                        ¡Único!
                      </span>
                    ) : (
                      <span className="text-gray-400">
                        {product.stock} disp.
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    'w-full py-3 rounded-xl border-3 border-toon-border font-black text-center text-sm md:text-base shadow-[4px_4px_0px_0px_rgba(30,30,30,1)] transition-all uppercase',
                    product.stock > 0
                      ? 'bg-toon-yellow group-hover:bg-yellow-300'
                      : 'bg-gray-300 text-gray-500',
                  )}
                >
                  {product.stock > 0 ? '¡LO QUIERO!' : 'AGOTADO'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
