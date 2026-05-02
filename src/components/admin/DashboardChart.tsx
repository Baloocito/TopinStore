'use client'

import { useState } from 'react'
import { Activity, Coins, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type DailyData = {
  day: string
  revenue: number
  orders: number
}

export default function DashboardChart({ data }: { data: DailyData[] }) {
  // Estado para controlar qué estamos viendo
  const [viewMode, setViewMode] = useState<'revenue' | 'orders'>('revenue')

  // Encontrar el valor máximo para calcular la altura de las barras
  const maxValue = Math.max(
    ...data.map((d) => (viewMode === 'revenue' ? d.revenue : d.orders)),
    1,
  )

  return (
    <div className="bg-white border-4 border-toon-border rounded-3xl p-4 md:p-6 shadow-toon flex flex-col h-[400px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
        <h3 className="font-black text-lg md:text-xl uppercase tracking-tighter flex items-center gap-2">
          <Activity className="text-toon-pink" strokeWidth={3} />
          Últimos 7 Días
        </h3>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* TOGGLE INTERACTIVO */}
          <div className="flex bg-slate-100 border-3 border-toon-border rounded-xl p-1 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('revenue')}
              className={cn(
                'flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase transition-all',
                viewMode === 'revenue'
                  ? 'bg-toon-yellow border-2 border-toon-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-toon-border'
                  : 'text-gray-400 hover:text-toon-border',
              )}
            >
              <Coins size={12} strokeWidth={3} /> Oro
            </button>
            <button
              onClick={() => setViewMode('orders')}
              className={cn(
                'flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase transition-all',
                viewMode === 'orders'
                  ? 'bg-toon-blue border-2 border-toon-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white'
                  : 'text-gray-400 hover:text-toon-border',
              )}
            >
              <ShoppingBag size={12} strokeWidth={3} /> Misiones
            </button>
          </div>

          <Link
            href="/dashboard/analytics"
            className="hidden md:flex px-3 py-2 border-3 border-toon-border rounded-xl text-[10px] font-black uppercase hover:bg-toon-yellow transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 active:translate-x-1 shrink-0"
          >
            Métricas
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-end gap-2 md:gap-4 border-b-4 border-toon-border pb-4 px-2 relative min-h-0">
        {data.every(
          (d) => (viewMode === 'revenue' ? d.revenue : d.orders) === 0,
        ) ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-black text-xs uppercase opacity-50 text-center px-4">
            Aún no hay actividad esta semana
          </div>
        ) : (
          data.map((dayData, i) => {
            const val =
              viewMode === 'revenue' ? dayData.revenue : dayData.orders
            const heightPercent = Math.max((val / maxValue) * 100, 5) // Mínimo 5% para que la barra se vea

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end"
              >
                <div className="w-full relative flex justify-center h-full items-end">
                  {/* Tooltip visible al hacer hover (o al tocar en móvil si Safari lo permite por el layout) */}
                  <span className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-toon-border text-white border-2 border-toon-border text-[10px] font-black px-2 py-1 rounded-lg pointer-events-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10 whitespace-nowrap">
                    {viewMode === 'revenue'
                      ? `$${val.toLocaleString('es-CL')}`
                      : `${val} ped.`}
                  </span>

                  <div
                    className={cn(
                      'w-full max-w-[40px] border-3 border-b-0 border-toon-border rounded-t-lg transition-all shadow-inner',
                      viewMode === 'revenue'
                        ? 'bg-toon-yellow group-hover:bg-yellow-300'
                        : 'bg-toon-blue group-hover:bg-blue-400',
                    )}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="font-black text-[9px] md:text-[10px] text-gray-400 shrink-0">
                  {dayData.day}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
