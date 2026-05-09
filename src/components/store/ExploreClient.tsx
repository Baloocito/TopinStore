'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, ArrowUpDown, PackageSearch, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function ExploreClient({
  initialProducts,
  categories,
  initialCategory,
}: {
  initialProducts: any[]
  categories: any[]
  initialCategory?: string
}) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory || 'all',
  )
  const [sortBy, setSortBy] = useState('newest') // newest, price-asc, price-desc, alpha

  // 🪄 EL MOTOR DE FILTRADO (Se ejecuta cada vez que cambia un estado)
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((p) => {
        const matchesSearch = p.name
          .toLowerCase()
          .includes(search.toLowerCase())
        const matchesCategory =
          selectedCategory === 'all' || p.category?.slug === selectedCategory
        return matchesSearch && matchesCategory
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return Number(a.price) - Number(b.price)
        if (sortBy === 'price-desc') return Number(b.price) - Number(a.price)
        if (sortBy === 'alpha') return a.name.localeCompare(b.name)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [search, selectedCategory, sortBy, initialProducts])

  return (
    <div className="space-y-8">
      {/* BARRA DE HERRAMIENTAS (FILTROS) */}
      <section className="bg-white border-4 border-toon-border p-4 md:p-6 rounded-3xl shadow-toon space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* BUSCADOR */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar por nombre del ítem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-3 border-toon-border rounded-2xl font-bold focus:ring-4 ring-toon-blue/20 outline-none transition-all"
            />
          </div>

          {/* SELECTOR DE ORDEN */}
          <div className="relative shrink-0">
            <ArrowUpDown
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white border-3 border-toon-border rounded-2xl font-black uppercase text-xs appearance-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <option value="newest">Más Reciente</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="alpha">A - Z</option>
            </select>
          </div>
        </div>

        {/* CHIPS DE CATEGORÍAS */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-4 py-1.5 rounded-full border-2 border-toon-border font-black text-[10px] uppercase transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5',
              selectedCategory === 'all'
                ? 'bg-toon-yellow'
                : 'bg-white hover:bg-slate-50',
            )}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={cn(
                'px-4 py-1.5 rounded-full border-2 border-toon-border font-black text-[10px] uppercase transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5',
                selectedCategory === cat.slug
                  ? 'bg-toon-pink text-white'
                  : 'bg-white hover:bg-slate-50',
              )}
            >
              {cat.name}
            </button>
          ))}

          {/* RESET BUTTON */}
          {(search || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearch('')
                setSelectedCategory('all')
              }}
              className="flex items-center gap-1 px-4 py-1.5 text-[10px] font-black uppercase text-toon-red hover:underline"
            >
              <X size={14} /> Limpiar Filtros
            </button>
          )}
        </div>
      </section>

      {/* RESULTADOS */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <span className="font-black text-xs uppercase text-gray-400 tracking-widest">
            Items encontrados: {filteredProducts.length}
          </span>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className={cn(
                  'group bg-white border-4 border-toon-border rounded-2xl overflow-hidden shadow-toon transition-all hover:-translate-y-1 hover:translate-x-1 hover:shadow-none block flex flex-col',
                  product.stock === 0 && 'opacity-75 grayscale',
                )}
              >
                <div className="aspect-square bg-slate-50 border-b-4 border-toon-border relative overflow-hidden flex items-center justify-center text-6xl">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span>{product.type === 'pack' ? '📦' : '✨'}</span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-black text-lg leading-tight line-clamp-2 flex-1 mb-4">
                    {product.name}
                  </h3>
                  <div className="flex justify-between items-end">
                    <p className="text-2xl font-black text-toon-border">
                      ${Number(product.price).toLocaleString('es-CL')}
                    </p>
                    <span className="text-[10px] font-bold text-gray-400">
                      {product.stock} disp.
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white border-4 border-dashed border-toon-border/20 rounded-3xl">
            <div className="text-7xl grayscale opacity-30">🔍</div>
            <h3 className="font-black text-2xl uppercase text-toon-border">
              Sin botín a la vista
            </h3>
            <p className="font-bold text-gray-500 max-w-xs">
              No encontramos nada que coincida con tu búsqueda. ¡Prueba otros
              filtros!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
