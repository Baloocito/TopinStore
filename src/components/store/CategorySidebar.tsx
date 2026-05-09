'use client'

import { X, Search, Tags, Sparkles, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function CategorySidebar({
  isOpen,
  onClose,
  categories,
}: {
  isOpen: boolean
  onClose: () => void
  categories: any[]
}) {
  return (
    <>
      {/* OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-toon-border/40 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={cn(
          'fixed left-0 top-0 h-[100dvh] w-full max-w-[280px] bg-white border-r-8 border-toon-border z-[110] shadow-[10px_0px_0px_0px_rgba(0,0,0,0.1)] flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* HEADER */}
        <div className="p-6 border-b-4 border-toon-border bg-toon-blue/10 flex justify-between items-center shrink-0">
          <span className="font-black text-xl uppercase tracking-tighter italic">
            Menú Principal
          </span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-toon-red hover:text-white border-2 border-transparent hover:border-toon-border rounded-xl transition-all"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* BUSCADOR RÁPIDO */}
          <div className="space-y-2">
            <label className="font-black text-[10px] uppercase text-gray-400 tracking-widest">
              Buscador de Botín
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="¿Qué buscas?..."
                className="w-full bg-slate-50 border-3 border-toon-border rounded-xl py-2 pl-10 pr-4 font-bold text-sm outline-none focus:bg-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
          </div>

          {/* NAVEGACIÓN PRINCIPAL */}
          <nav className="space-y-2">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-3 p-3 bg-slate-50 border-3 border-toon-border rounded-xl font-black uppercase text-xs hover:bg-toon-yellow transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 active:translate-x-1"
            >
              <Home size={18} /> Inicio
            </Link>

            <div className="pt-4 pb-2">
              <span className="font-black text-[10px] uppercase text-gray-400 tracking-widest flex items-center gap-2">
                <Tags size={12} /> Categorías
              </span>
            </div>

            <div className="space-y-2 pl-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/explore?category=${cat.slug}`} // Enlace dinámico
                  onClick={onClose}
                  className="block font-bold text-sm hover:text-toon-pink hover:translate-x-1 transition-all uppercase tracking-tight"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </nav>

          {/* SECCIÓN EXTRA */}
          <div className="p-4 bg-toon-pink/10 border-2 border-dashed border-toon-pink rounded-2xl">
            <p className="font-black text-[10px] text-toon-pink uppercase mb-2 flex items-center gap-1">
              <Sparkles size={12} /> Tip de Aventurero
            </p>
            <p className="text-[10px] font-bold text-gray-600 leading-tight">
              Los Packs de Botín tienen descuentos automáticos. ¡Mientras más
              sumas, menos pagas!
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t-4 border-toon-border bg-slate-50 text-center">
          <span className="text-[9px] font-black uppercase text-gray-400">
            Topin Store v1.0 SpA
          </span>
        </div>
      </div>
    </>
  )
}
