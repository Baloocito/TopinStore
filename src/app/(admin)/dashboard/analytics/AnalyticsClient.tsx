'use client'

import {
  BarChart3,
  Coins,
  Target,
  TrendingUp,
  TrendingDown,
  Flame,
  Trophy,
  Crosshair,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type TopItem = {
  name: string
  soldCount: number
  revenue: number
}

type AnalyticsProps = {
  monthlyGoal: number
  monthlyRevenue: number
  todayRevenue: number
  yesterdayRevenue: number
  topItems: TopItem[]
  weeklyData: { day: string; amount: number }[]
}

export default function AnalyticsClient({ data }: { data: AnalyticsProps }) {
  // ==========================================
  // CÁLCULOS DEL JUEGO
  // ==========================================

  // 1. Barra de HP (Meta Mensual)
  const hpPercentage = Math.min(
    (data.monthlyRevenue / data.monthlyGoal) * 100,
    100,
  )
  const isHpLow = hpPercentage < 30

  // 2. DPS de Ventas (Delta Diario)
  const deltaLoot = data.todayRevenue - data.yesterdayRevenue
  const deltaPercentage =
    data.yesterdayRevenue > 0 ? (deltaLoot / data.yesterdayRevenue) * 100 : 100
  const isLootUp = deltaLoot >= 0

  // 3. Altura máxima para el gráfico de barras del Weekly Loot
  const maxWeeklyAmount = Math.max(...data.weeklyData.map((d) => d.amount), 1)

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* HEADER DEL HUD */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-toon-lime border-4 border-toon-border rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <BarChart3 size={28} className="text-toon-border" strokeWidth={3} />
        </div>
        <div>
          <h1 className="font-black text-3xl uppercase tracking-tighter text-toon-border">
            HUD del Gremio
          </h1>
          <p className="font-bold text-gray-500 text-sm italic">
            "Revisa tus stats, ajusta tu puntería y maximiza el oro"
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ==========================================
            BARRA DE HP (META MENSUAL) Y LOOT
            ========================================== */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* BARRA DE HP */}
          <div className="bg-white border-4 border-toon-border rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-slate-100 opacity-50 rotate-12 pointer-events-none">
              <Target size={120} strokeWidth={3} />
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="font-black text-xl uppercase text-toon-border flex items-center gap-2">
                    <Crosshair className="text-toon-pink" size={24} />
                    HP de la Tienda (Meta Mensual)
                  </h2>
                  <span className="font-bold text-xs text-gray-400 tracking-widest uppercase">
                    Progreso de Supervivencia
                  </span>
                </div>
                <div className="text-right">
                  <span className="block font-black text-2xl text-toon-border">
                    ${data.monthlyRevenue.toLocaleString('es-CL')}
                  </span>
                  <span className="block font-bold text-xs text-gray-400">
                    de ${data.monthlyGoal.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              {/* Contenedor de la Barra de HP */}
              <div className="h-10 w-full bg-slate-800 border-4 border-toon-border rounded-xl relative overflow-hidden shadow-inner">
                {/* Relleno de HP */}
                <div
                  className={cn(
                    'h-full transition-all duration-1000 ease-out border-r-4 border-toon-border relative',
                    isHpLow ? 'bg-toon-red' : 'bg-toon-lime',
                  )}
                  style={{ width: `${hpPercentage}%` }}
                >
                  {/* Brillo visual de la barra (Estilo UI de juegos de pelea) */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-white/30" />
                </div>
              </div>
              <div className="mt-2 text-right">
                <span className="font-black text-sm text-toon-border">
                  {hpPercentage.toFixed(1)}% COMPLETADO
                </span>
              </div>
            </div>
          </div>

          {/* TARJETAS DE LOOT Y GRÁFICO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* STAT: LOOT DIARIO */}
            <div className="bg-toon-yellow border-4 border-toon-border rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white border-3 border-toon-border rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Coins
                    size={24}
                    className="text-toon-border"
                    strokeWidth={3}
                  />
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-md border-2 border-toon-border font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                    isLootUp
                      ? 'bg-toon-lime text-toon-border'
                      : 'bg-toon-red text-white',
                  )}
                >
                  {isLootUp ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}
                  {isLootUp ? '+' : ''}
                  {deltaPercentage.toFixed(0)}%
                </div>
              </div>

              <div>
                <h3 className="font-bold text-xs uppercase text-toon-border/70 tracking-widest mb-1">
                  Loot de Hoy
                </h3>
                <span className="block font-black text-4xl text-toon-border drop-shadow-[2px_2px_0px_rgba(255,255,255,0.5)]">
                  ${data.todayRevenue.toLocaleString('es-CL')}
                </span>
                <span className="font-bold text-xs text-toon-border/60">
                  Ayer: ${data.yesterdayRevenue.toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            {/* GRÁFICO DE BARRAS: ÚLTIMOS 7 DÍAS */}
            <div className="bg-white border-4 border-toon-border rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-black text-sm uppercase text-toon-border mb-4 flex items-center gap-2">
                <Flame className="text-toon-pink" size={16} />
                Racha de 7 Días
              </h3>

              <div className="flex items-end justify-between gap-2 h-32 pt-4 border-b-4 border-toon-border">
                {data.weeklyData.map((day, idx) => {
                  const heightPercent = (day.amount / maxWeeklyAmount) * 100
                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-2 w-full group relative"
                    >
                      {/* Tooltip Hover */}
                      <div className="absolute -top-8 bg-toon-border text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        ${day.amount.toLocaleString('es-CL')}
                      </div>

                      <div
                        className="w-full bg-toon-blue border-3 border-b-0 border-toon-border rounded-t-lg transition-all group-hover:brightness-110"
                        style={{ height: `${Math.max(heightPercent, 5)}%` }}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-2">
                {data.weeklyData.map((day, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] font-black uppercase text-gray-400"
                  >
                    {day.day}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            ITEMS META (LEADERBOARD DE PRODUCTOS)
            ========================================== */}
        <div className="lg:col-span-4 bg-slate-50 border-4 border-toon-border rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col h-[600px] lg:h-auto">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b-4 border-toon-border/10">
            <Trophy
              className="text-toon-yellow fill-toon-yellow border-toon-border"
              size={24}
            />
            <div>
              <h2 className="font-black text-xl uppercase tracking-tighter text-toon-border leading-none">
                Items Meta
              </h2>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Mayor Potencia de Fuego
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
            {data.topItems.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center opacity-50">
                <Crosshair size={40} className="mb-2" />
                <span className="font-black uppercase text-xs">
                  Sin datos de combate
                </span>
              </div>
            ) : (
              data.topItems.map((item, index) => {
                // Colores para el podio
                const isFirst = index === 0
                const isSecond = index === 1
                const isThird = index === 2

                let positionStyle = 'bg-white border-gray-300 text-gray-400'
                if (isFirst)
                  positionStyle =
                    'bg-toon-yellow border-toon-border text-toon-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                if (isSecond)
                  positionStyle =
                    'bg-slate-300 border-toon-border text-toon-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                if (isThird)
                  positionStyle =
                    'bg-[#cd7f32] border-toon-border text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'

                return (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-2xl border-3 transition-transform hover:translate-x-1',
                      isFirst
                        ? 'bg-white border-toon-yellow shadow-[4px_4px_0px_0px_rgba(255,204,0,1)]'
                        : 'bg-white border-toon-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg border-2 flex items-center justify-center font-black text-sm shrink-0',
                        positionStyle,
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-sm uppercase truncate text-toon-border">
                        {item.name}
                      </h4>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {item.soldCount} Impactos
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block font-black text-sm text-toon-lime">
                        ${item.revenue.toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
