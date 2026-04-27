'use client'

import { useState, useRef, useEffect } from 'react'
import { Filter, X } from 'lucide-react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function ProductFilter({ categories }: { categories: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const currentStock = searchParams.get('stock') || 'todos'
  const currentCategory = searchParams.get('category') || 'todas'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === 'todos' || value === 'todas') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    replace(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('stock')
    params.delete('category')
    replace(`${pathname}?${params.toString()}`)
    setIsOpen(false)
  }

  const FilterPill = ({
    active,
    onClick,
    label,
    colorClass = 'bg-toon-yellow',
  }: {
    active: boolean
    onClick: () => void
    label: string
    colorClass?: string
  }) => (
    <button
      onClick={onClick}
      className={cn(
        'px-2 py-2 border-3 border-toon-border rounded-xl font-black text-[10px] uppercase transition-all flex-1 text-center leading-none',
        active
          ? cn(colorClass, 'translate-y-1 shadow-none')
          : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50',
      )}
    >
      {label}
    </button>
  )

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-3 border-3 border-toon-border rounded-xl transition-all shrink-0',
          isOpen || currentStock !== 'todos' || currentCategory !== 'todas'
            ? 'bg-toon-yellow shadow-none translate-x-1 translate-y-1'
            : 'bg-slate-50 hover:brightness-95 active:translate-x-1 active:translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none',
        )}
      >
        <Filter size={20} />
      </button>

      {isOpen && (
        // ANCHO DINÁMICO: Se adapta al celular sin salirse, y en PC vuelve a w-80
        <div className="absolute right-0 top-full mt-3 w-[calc(100vw-3rem)] max-w-[320px] md:w-80 bg-white border-4 border-toon-border rounded-2xl p-4 md:p-5 z-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4 border-b-4 border-toon-border/10 pb-2">
            <h3 className="font-black uppercase tracking-widest text-sm text-toon-border">
              Filtros Tácticos
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-toon-red transition-colors"
            >
              <X size={18} strokeWidth={3} />
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <p className="font-bold text-[10px] text-gray-400 uppercase mb-2">
                Estado del Botín
              </p>
              {/* MAGIA DE GRID: Ahora son 2 columnas en lugar de una fila apretada */}
              <div className="grid grid-cols-2 gap-2">
                <FilterPill
                  active={currentStock === 'todos'}
                  onClick={() => updateFilter('stock', 'todos')}
                  label="Todos"
                />
                <FilterPill
                  active={currentStock === 'seguro'}
                  onClick={() => updateFilter('stock', 'seguro')}
                  label="Seguro (+5)"
                  colorClass="bg-toon-lime"
                />
                <FilterPill
                  active={currentStock === 'critico'}
                  onClick={() => updateFilter('stock', 'critico')}
                  label="Crítico (1-5)"
                  colorClass="bg-toon-pink"
                />
                <FilterPill
                  active={currentStock === 'agotado'}
                  onClick={() => updateFilter('stock', 'agotado')}
                  label="Agotado"
                  colorClass="bg-toon-red text-white"
                />
              </div>
            </div>

            <div>
              <p className="font-bold text-[10px] text-gray-400 uppercase mb-2">
                Clase de Objeto
              </p>
              <div className="flex flex-wrap gap-2">
                <FilterPill
                  active={currentCategory === 'todas'}
                  onClick={() => updateFilter('category', 'todas')}
                  label="Todas"
                  colorClass="bg-toon-blue text-white"
                />
                {categories.map((cat) => (
                  <FilterPill
                    key={cat.id}
                    active={currentCategory === cat.slug}
                    onClick={() => updateFilter('category', cat.slug)}
                    label={cat.name}
                    colorClass="bg-toon-blue text-white"
                  />
                ))}
              </div>
            </div>
          </div>

          {(currentStock !== 'todos' || currentCategory !== 'todas') && (
            <button
              onClick={clearFilters}
              className="mt-6 w-full py-3 bg-slate-100 border-3 border-toon-border rounded-xl font-black text-xs uppercase hover:bg-toon-red hover:text-white transition-colors active:translate-y-1 active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Borrar Filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}
