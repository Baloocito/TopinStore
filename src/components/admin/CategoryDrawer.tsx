'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Trash2, Plus, Layers } from 'lucide-react'
import { createCategory, deleteCategory } from '@/lib/actions'
import { cn } from '@/lib/utils'

export default function CategoryDrawer({ categories }: { categories: any[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const showCategories = searchParams.get('categories') === 'true'

  // Estado para asegurarnos de que el componente ya está montado en el cliente antes de usar el Portal
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const closeDrawer = () => {
    router.push('/dashboard/products')
  }

  // Guard: Solo renderizar si el parámetro existe y el componente está montado
  if (!showCategories || !mounted) return null

  // USAMOS PORTAL: Esto teletransporta el Drawer fuera de cualquier contenedor, asegurando que cubra el 100% de la pantalla siempre.
  return createPortal(
    <>
      {/* Backdrop oscuro con blur. Aseguramos que cubra el 100% del viewport */}
      <div
        className="fixed top-0 left-0 w-screen h-[100dvh] bg-toon-border/40 backdrop-blur-sm z-[100] transition-opacity"
        onClick={closeDrawer}
      />

      {/* Gaveta Lateral Neobrutalista */}
      <div className="fixed right-0 top-0 h-[100dvh] w-full max-w-md bg-white border-l-8 border-toon-border z-[110] shadow-[-10px_0px_0px_0px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-300">
        {/* HEADER */}
        <div className="p-4 md:p-6 border-b-4 border-toon-border flex justify-between items-center bg-toon-blue/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-toon-blue border-2 border-toon-border rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Layers size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-black text-xl md:text-2xl uppercase tracking-tighter text-toon-border leading-none">
                Categorías
              </h2>
              <p className="font-mono text-[10px] text-gray-500 uppercase font-bold mt-1">
                Clasifica tu Inventario
              </p>
            </div>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 border-3 border-toon-border rounded-xl hover:bg-toon-red shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all bg-white group shrink-0"
          >
            <X size={20} className="group-hover:text-white" strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 no-scrollbar">
          {/* SECCIÓN 1: CREAR NUEVA */}
          <section className="bg-slate-50 border-4 border-toon-border rounded-2xl p-4 md:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-sm uppercase mb-4 tracking-wider flex items-center gap-2 text-toon-border">
              <Plus size={18} className="text-toon-pink" strokeWidth={3} />
              Nueva Categoría
            </h3>

            {/* SOLUCIÓN RESPONSIVE MÓVIL: flex-col en pantallas pequeñas, flex-row en medianas */}
            <form
              action={createCategory}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                name="name"
                placeholder="Ej. Armaduras"
                required
                className="w-full sm:flex-1 p-3 border-3 border-toon-border rounded-xl font-bold focus:ring-4 ring-toon-yellow outline-none min-w-0"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-3 bg-toon-lime border-3 border-toon-border rounded-xl font-black text-xs hover:bg-green-400 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 active:translate-x-1 flex items-center justify-center gap-2"
              >
                <Save size={18} strokeWidth={3} />
                <span className="sm:hidden font-black text-xs uppercase tracking-widest">
                  Guardar
                </span>
              </button>
            </form>
          </section>

          {/* SECCIÓN 2: LISTA DE EXISTENTES */}
          <section>
            <h3 className="font-black text-xs uppercase mb-4 tracking-wider text-gray-400">
              Categorías Actuales ({categories.length})
            </h3>
            <div className="space-y-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 border-3 border-toon-border rounded-xl hover:bg-toon-yellow/10 transition-colors bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                >
                  <span className="font-black uppercase text-sm text-toon-border truncate pr-2">
                    {cat.name}
                  </span>

                  {/* Formulario individual para borrar */}
                  <form action={deleteCategory} className="shrink-0">
                    <input type="hidden" name="id" value={cat.id} />
                    <button
                      type="submit"
                      className="p-2 text-gray-400 hover:text-white hover:bg-toon-red border-2 border-transparent hover:border-toon-border rounded-lg transition-all"
                      title="Eliminar categoría"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </form>
                </div>
              ))}

              {categories.length === 0 && (
                <div className="text-center p-6 border-4 border-dashed border-toon-border/20 rounded-2xl bg-slate-50">
                  <p className="font-bold text-gray-400 text-xs uppercase">
                    No hay categorías creadas aún
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>,
    document.body, // <- El destino del Portal
  )
}
