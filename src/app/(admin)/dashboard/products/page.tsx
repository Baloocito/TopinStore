import { getProducts } from '@/lib/data'
import { db } from '@/db'
import Link from 'next/link'
import { Plus, Search, Filter, Layers, Edit3, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import ProductDrawer from '@/components/admin/ProductDrawer'

export default async function InventoryPage() {
  const products = await getProducts()
  const categories = await db.query.categories.findMany()

  return (
    <div className="space-y-6">
      {/* TOOLBAR SUPERIOR */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white border-4 border-toon-border p-6 rounded-3xl shadow-toon">
        <div className="flex flex-1 w-full gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por SKU o nombre..."
              className="w-full pl-10 pr-4 py-3 border-3 border-toon-border rounded-xl font-bold focus:ring-4 ring-toon-yellow outline-none transition-all"
            />
          </div>
          <button className="p-3 border-3 border-toon-border rounded-xl bg-slate-50 hover:bg-toon-yellow transition-colors">
            <Filter size={20} />
          </button>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-toon-blue border-3 border-toon-border px-4 py-3 rounded-xl font-black text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
            <Layers size={16} />
            Categorías
          </button>
          <Link
            href="/dashboard/products/new"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-toon-pink border-3 border-toon-border px-6 py-3 rounded-xl font-black text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
          >
            <Plus size={16} />
            Nuevo Ítem
          </Link>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div className="bg-white border-4 border-toon-border rounded-3xl shadow-toon overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-4 border-toon-border">
                <th className="p-4 text-left font-black uppercase text-xs tracking-widest border-r-2 border-toon-border/10">
                  Producto
                </th>
                <th className="p-4 text-left font-black uppercase text-xs tracking-widest border-r-2 border-toon-border/10">
                  Categoría
                </th>
                <th className="p-4 text-left font-black uppercase text-xs tracking-widest border-r-2 border-toon-border/10">
                  Stock
                </th>
                <th className="p-4 text-left font-black uppercase text-xs tracking-widest border-r-2 border-toon-border/10">
                  Precio
                </th>
                <th className="p-4 text-center font-black uppercase text-xs tracking-widest">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-toon-border/5">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-4 border-r-2 border-toon-border/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 border-3 border-toon-border rounded-xl bg-toon-blue/10 overflow-hidden flex-shrink-0 flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          '📦'
                        )}
                      </div>
                      <div>
                        <p className="font-black uppercase text-sm leading-tight">
                          {product.name}
                        </p>
                        <p className="font-mono text-[10px] text-gray-400 mt-0.5">
                          {product.sku}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 border-r-2 border-toon-border/5">
                    <span className="bg-toon-yellow border-2 border-toon-border px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {product.category?.name || 'General'}
                    </span>
                  </td>
                  <td className="p-4 border-r-2 border-toon-border/5">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-3 h-3 rounded-full border-2 border-toon-border shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]',
                          Number(product.stock) > 5
                            ? 'bg-green-400' // Stock Seguro (Verde)
                            : Number(product.stock) > 0
                              ? 'bg-yellow-400' // Stock Bajo (Amarillo)
                              : 'bg-red-500', // Agotado (Rojo)
                        )}
                      />
                      <span className="font-black text-sm">
                        {product.stock}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        UNID.
                      </span>
                    </div>
                  </td>
                  <td className="p-4 border-r-2 border-toon-border/5 font-black text-sm">
                    ${Number(product.price).toLocaleString('es-CL')}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      {/* Link al detalle público */}
                      <Link
                        href={`/products/${product.slug}`}
                        target="_blank"
                        className="p-2 border-2 border-toon-border rounded-lg hover:bg-toon-blue transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                      >
                        <ExternalLink size={14} />
                      </Link>
                      {/* Botón de Edición (Abrirá la gaveta) */}
                      <Link
                        href={`/dashboard/products?edit=${product.slug}`}
                        className="p-2 border-2 border-toon-border rounded-lg bg-toon-pink hover:bg-pink-400 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                      >
                        <Edit3 size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER DE LA TABLA */}
      <div className="flex justify-between items-center px-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Mostrando {products.length} tesoros encontrados
        </p>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 border-3 border-toon-border rounded-xl font-black text-xs disabled:opacity-30"
            disabled
          >
            ANTERIOR
          </button>
          <button className="px-4 py-2 border-3 border-toon-border rounded-xl bg-white font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            SIGUIENTE
          </button>
        </div>
      </div>
      <ProductDrawer products={products} categories={categories} />
    </div>
  )
}
