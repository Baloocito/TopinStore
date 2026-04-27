import { getProducts } from '@/lib/data'
import { db } from '@/db'
import Link from 'next/link'
import { Plus, Layers } from 'lucide-react' // Limpiamos Search y Filter que ya no se usan aquí
import ProductCard from '@/components/admin/ProductCard'
import ProductDrawer from '@/components/admin/ProductDrawer'
import NewProductDrawer from '@/components/admin/NewProductDrawer'
import CategoryDrawer from '@/components/admin/CategoryDrawer'
import ProductSearch from '@/components/admin/ProductSearch'
import ProductFilter from '@/components/admin/ProductFilter'
import { Suspense } from 'react'
import { cn } from '@/lib/utils' // <-- ¡AQUÍ ESTÁ EL SALVAVIDAS!

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    stock?: string
    category?: string
    page?: string
  }>
}) {
  const params = await searchParams
  const query = params?.q || ''
  const stockFilter = params?.stock || 'todos'
  const categoryFilter = params?.category || 'todas'
  const currentPage = Number(params?.page) || 1

  // LE PASAMOS TODOS LOS PARÁMETROS A LA BD (¡Incluyendo la página!)
  const products = await getProducts(
    query,
    stockFilter,
    categoryFilter,
    currentPage,
  )
  const categories = await db.query.categories.findMany()

  // Función para crear las URLs de "Siguiente" y "Anterior" manteniendo los filtros
  const createPageURL = (pageNumber: number) => {
    const newParams = new URLSearchParams()
    if (query) newParams.set('q', query)
    if (stockFilter !== 'todos') newParams.set('stock', stockFilter)
    if (categoryFilter !== 'todas') newParams.set('category', categoryFilter)
    newParams.set('page', pageNumber.toString())
    return `/dashboard/products?${newParams.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* TOOLBAR SUPERIOR */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white border-4 border-toon-border p-4 md:p-6 rounded-3xl shadow-toon">
        {/* Buscador y Filtro */}
        <div className="flex w-full gap-2">
          <Suspense
            fallback={
              <div className="flex-1 bg-slate-100 rounded-xl animate-pulse" />
            }
          >
            <ProductSearch />
          </Suspense>

          {/* NUESTRO NUEVO POPOVER DE FILTROS */}
          <Suspense
            fallback={
              <div className="w-12 h-12 bg-slate-100 rounded-xl animate-pulse shrink-0" />
            }
          >
            <ProductFilter categories={categories} />
          </Suspense>
        </div>

        {/* Botones de Acción con Física "Active" (Gamepad Style) */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link
            href="/dashboard/products?categories=true"
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-toon-blue border-3 border-toon-border px-4 py-3 rounded-xl font-black text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:brightness-110 active:shadow-none active:translate-x-1 active:translate-y-1 transition-all text-white"
          >
            <Layers size={16} />
            Categorías
          </Link>
          <Link
            href="/dashboard/products?new=true"
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-toon-pink border-3 border-toon-border px-6 py-3 rounded-xl font-black text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:brightness-110 active:shadow-none active:translate-x-1 active:translate-y-1 transition-all text-toon-border"
          >
            <Plus size={16} />
            Nuevo Ítem
          </Link>
        </div>
      </div>

      {/* =========================================
          GRILLA UNIVERSAL: CARTAS TCG ANIMADAS
          ========================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* FOOTER / PAGINACIÓN */}
      <div className="flex justify-between items-center px-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Mostrando tesoros (Página {currentPage})
        </p>
        <div className="flex gap-2">
          {/* BOTÓN ANTERIOR */}
          <Link
            href={createPageURL(currentPage - 1)}
            className={cn(
              'px-4 py-2 border-3 border-toon-border rounded-xl font-black text-xs transition-all',
              currentPage <= 1
                ? 'bg-slate-100 text-gray-400 pointer-events-none' // Desactivado
                : 'bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50 active:shadow-none active:translate-x-1 active:translate-y-1 text-toon-border',
            )}
          >
            ANTERIOR
          </Link>

          {/* BOTÓN SIGUIENTE */}
          <Link
            href={createPageURL(currentPage + 1)}
            className={cn(
              'px-4 py-2 border-3 border-toon-border rounded-xl font-black text-xs transition-all',
              products.length === 0
                ? 'bg-slate-100 text-gray-400 pointer-events-none' // Desactivado si ya no hay más
                : 'bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50 active:shadow-none active:translate-x-1 active:translate-y-1 text-toon-border',
            )}
          >
            SIGUIENTE
          </Link>
        </div>
      </div>

      {/* GAVETAS FLOTANTES */}
      <Suspense fallback={<div className="hidden">Cargando gavetas...</div>}>
        <ProductDrawer products={products} categories={categories} />
        <NewProductDrawer categories={categories} />
        <CategoryDrawer categories={categories} />
      </Suspense>
    </div>
  )
}
