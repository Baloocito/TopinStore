'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { X, Save, Trash2, Plus, Layers } from 'lucide-react'
import { createCategory, deleteCategory } from '@/lib/actions'
import { cn } from '@/lib/utils'

export default function CategoryDrawer({ categories }: { categories: any[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const showCategories = searchParams.get('categories') === 'true'

  const closeDrawer = () => {
    router.push('/dashboard/products')
  }

  // Guard: Solo renderizar si el parámetro existe
  if (!showCategories) return null

  return (
    <>
      {/* Backdrop oscuro con blur */}
      <div
        className="fixed inset-0 bg-toon-border/40 backdrop-blur-sm z-[60] transition-opacity"
        onClick={closeDrawer}
      />

      {/* Gaveta Lateral Neobrutalista */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l-8 border-toon-border z-[70] shadow-[-10px_0px_0px_0px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-300">
        {/* HEADER */}
        <div className="p-6 border-b-4 border-toon-border flex justify-between items-center bg-toon-blue/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-toon-blue border-2 border-toon-border rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Layers size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-black text-2xl uppercase tracking-tighter">
                Categorías
              </h2>
              <p className="font-mono text-[10px] text-gray-500 uppercase font-bold">
                Clasifica tu Inventario
              </p>
            </div>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 border-3 border-toon-border rounded-xl hover:bg-toon-red shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all bg-white group"
          >
            <X size={20} className="group-hover:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* SECCIÓN 1: CREAR NUEVA */}
          <section className="bg-slate-50 border-4 border-toon-border rounded-2xl p-4 shadow-toon">
            <h3 className="font-black text-sm uppercase mb-4 tracking-wider flex items-center gap-2">
              <Plus size={16} className="text-toon-pink" />
              Nueva Categoría
            </h3>
            <form action={createCategory} className="flex gap-2">
              <input
                name="name"
                placeholder="Ej. Armaduras"
                required
                className="flex-1 p-3 border-3 border-toon-border rounded-xl font-bold focus:ring-4 ring-toon-yellow outline-none"
              />
              <button
                type="submit"
                className="px-4 py-3 bg-toon-lime border-3 border-toon-border rounded-xl font-black text-xs hover:bg-green-400 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 flex items-center justify-center"
              >
                <Save size={18} />
              </button>
            </form>
          </section>

          {/* SECCIÓN 2: LISTA DE EXISTENTES */}
          <section>
            <h3 className="font-black text-sm uppercase mb-4 tracking-wider text-gray-400">
              Categorías Actuales ({categories.length})
            </h3>
            <div className="space-y-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 border-3 border-toon-border rounded-xl hover:bg-toon-yellow/10 transition-colors"
                >
                  <span className="font-black uppercase text-sm">
                    {cat.name}
                  </span>

                  {/* Formulario individual para borrar */}
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={cat.id} />
                    <button
                      type="submit"
                      className="p-2 text-gray-400 hover:text-white hover:bg-toon-red border-2 border-transparent hover:border-toon-border rounded-lg transition-all"
                      title="Eliminar categoría"
                    >
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>
              ))}

              {categories.length === 0 && (
                <div className="text-center p-6 border-4 border-dashed border-toon-border/20 rounded-2xl">
                  <p className="font-bold text-gray-400 text-xs uppercase">
                    No hay categorías creadas aún
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
