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
  Skull,
  Megaphone,
  MousePointerClick,
  Eye,
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
  // Prop opcional para no romper tu page.tsx actual, pero lista para el backend
  worstItems?: TopItem[]
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

  // 3. Altura máxima para el gráfico
  const maxWeeklyAmount = Math.max(...data.weeklyData.map((d) => d.amount), 1)

  // Mock de peores ítems si el servidor aún no los envía
  const worstItemsFallback = data.worstItems || [
    { name: 'Caja Loot (Contenedor)', soldCount: 2, revenue: 3000 },
    { name: 'Goma de Borrar Mágica', soldCount: 5, revenue: 4000 },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* HEADER DEL CENTRO DE MANDO */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-toon-lime border-4 border-toon-border rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <BarChart3 size={28} className="text-toon-border" strokeWidth={3} />
        </div>
        <div>
          <h1 className="font-black text-2xl md:text-3xl uppercase tracking-tighter text-toon-border leading-none">
            Centro de Mando (BI)
          </h1>
          <p className="font-bold text-gray-500 text-xs md:text-sm italic mt-1">
            "Revisa tus stats, elimina lo que no sirve y maximiza el oro"
          </p>
        </div>
      </div>

      {/* ==========================================
          BLOQUE SUPERIOR: SALUD DEL NEGOCIO Y LOOT
          ========================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* BARRA DE HP Y LOOT DIARIO */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* BARRA DE SUPERVIVENCIA */}
          <div className="bg-white border-4 border-toon-border rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col justify-center flex-1">
            <div className="absolute -right-6 -top-6 text-slate-100 opacity-50 rotate-12 pointer-events-none">
              <Target size={120} strokeWidth={3} />
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="font-black text-lg md:text-xl uppercase text-toon-border flex items-center gap-2">
                    <Crosshair className="text-toon-pink shrink-0" size={24} />
                    Meta Mensual
                  </h2>
                  <span className="font-bold text-[10px] md:text-xs text-gray-400 tracking-widest uppercase">
                    HP de Supervivencia
                  </span>
                </div>
                <div className="text-right">
                  <span className="block font-black text-xl md:text-2xl text-toon-border">
                    ${data.monthlyRevenue.toLocaleString('es-CL')}
                  </span>
                  <span className="block font-bold text-[10px] md:text-xs text-gray-400">
                    de ${data.monthlyGoal.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              <div className="h-10 w-full bg-slate-800 border-4 border-toon-border rounded-xl relative overflow-hidden shadow-inner">
                <div
                  className={cn(
                    'h-full transition-all duration-1000 ease-out border-r-4 border-toon-border relative',
                    isHpLow ? 'bg-toon-red' : 'bg-toon-lime',
                  )}
                  style={{ width: `${hpPercentage}%` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-2 bg-white/30" />
                </div>
              </div>
              <div className="mt-2 text-right">
                <span className="font-black text-xs md:text-sm text-toon-border">
                  {hpPercentage.toFixed(1)}% COMPLETADO
                </span>
              </div>
            </div>
          </div>

          {/* LOOT DIARIO */}
          <div className="bg-toon-yellow border-4 border-toon-border rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all flex flex-col justify-center flex-1">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white border-3 border-toon-border rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Coins size={24} className="text-toon-border" strokeWidth={3} />
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
              <h3 className="font-bold text-[10px] md:text-xs uppercase text-toon-border/70 tracking-widest mb-1">
                Loot de Hoy (Ingresos)
              </h3>
              <span className="block font-black text-3xl md:text-4xl text-toon-border drop-shadow-[2px_2px_0px_rgba(255,255,255,0.5)]">
                ${data.todayRevenue.toLocaleString('es-CL')}
              </span>
              <span className="font-bold text-[10px] md:text-xs text-toon-border/60">
                Ayer: ${data.yesterdayRevenue.toLocaleString('es-CL')}
              </span>
            </div>
          </div>
        </div>

        {/* GRÁFICO DE BARRAS: ÚLTIMOS 7 DÍAS */}
        <div className="xl:col-span-7 bg-white border-4 border-toon-border rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full">
          <h3 className="font-black text-sm uppercase text-toon-border mb-6 flex items-center gap-2">
            <Flame className="text-toon-pink" size={18} /> Racha de 7 Días
            (Tendencia)
          </h3>

          <div className="flex-1 flex items-end justify-between gap-1 md:gap-3 min-h-[200px] pt-8 border-b-4 border-toon-border relative">
            {data.weeklyData.map((day, idx) => {
              const heightPercent =
                maxWeeklyAmount > 0 ? (day.amount / maxWeeklyAmount) * 100 : 0
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-end h-full w-full group relative"
                >
                  {/* Tooltip Hover Rediseñado */}
                  <div className="absolute -top-12 bg-toon-border border-2 border-toon-border text-white text-[10px] font-black px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] translate-y-2 group-hover:translate-y-0 z-10 flex flex-col items-center">
                    <span className="text-toon-lime">
                      ${day.amount.toLocaleString('es-CL')}
                    </span>
                    <div className="w-2 h-2 bg-toon-border absolute -bottom-1 rotate-45 border-r-2 border-b-2 border-toon-border" />
                  </div>

                  <div
                    className="w-full max-w-[40px] bg-toon-blue border-3 border-b-0 border-toon-border rounded-t-xl transition-all duration-500 group-hover:brightness-110 group-hover:bg-toon-pink"
                    style={{ height: `${Math.max(heightPercent, 5)}%` }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-3 px-1">
            {data.weeklyData.map((day, idx) => (
              <span
                key={idx}
                className="text-[8px] md:text-[10px] font-black uppercase text-gray-400 w-full text-center truncate"
              >
                {day.day}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ==========================================
          BLOQUE INFERIOR: CENTRO DE DECISIONES
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. ITEMS META (LO MEJOR) */}
        <div className="bg-slate-50 border-4 border-toon-border rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-4 border-toon-border/10 shrink-0">
            <Trophy
              className="text-toon-yellow fill-toon-yellow border-toon-border"
              size={24}
            />
            <div>
              <h2 className="font-black text-lg uppercase tracking-tighter text-toon-border leading-none">
                Items Meta
              </h2>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                Mayor Potencia
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {data.topItems.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center opacity-50">
                <Crosshair size={32} className="mb-2" />
                <span className="font-black uppercase text-[10px]">
                  Sin datos de combate
                </span>
              </div>
            ) : (
              data.topItems.map((item, index) => {
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
                      'flex items-center gap-2 p-2.5 rounded-xl border-3 transition-transform hover:translate-x-1',
                      isFirst
                        ? 'bg-white border-toon-yellow shadow-[3px_3px_0px_0px_rgba(255,204,0,1)]'
                        : 'bg-white border-toon-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
                    )}
                  >
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg border-2 flex items-center justify-center font-black text-xs shrink-0',
                        positionStyle,
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-xs uppercase truncate text-toon-border">
                        {item.name}
                      </h4>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">
                        {item.soldCount} Impactos
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block font-black text-xs text-toon-lime">
                        ${item.revenue.toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* 2. CEMENTERIO DE ÍTEMS (LO PEOR - DECISIONES) */}
        <div className="bg-slate-50 border-4 border-toon-border rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-4 border-toon-border/10 shrink-0">
            <Skull
              className="text-toon-red border-toon-border"
              size={24}
              strokeWidth={2.5}
            />
            <div>
              <h2 className="font-black text-lg uppercase tracking-tighter text-toon-border leading-none">
                Cementerio
              </h2>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                Requieren Liquidación
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {worstItemsFallback.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center opacity-50 text-toon-lime">
                <span className="font-black uppercase text-[10px] text-center">
                  ¡Inventario Perfecto!
                  <br />
                  Todo se vende
                </span>
              </div>
            ) : (
              worstItemsFallback.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2.5 rounded-xl border-3 bg-red-50/50 border-toon-red/30 hover:border-toon-red hover:shadow-[3px_3px_0px_0px_rgba(239,68,68,1)] transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-xs uppercase truncate text-toon-border">
                      {item.name}
                    </h4>
                    <span className="text-[9px] font-bold text-toon-red/70 uppercase">
                      Solo {item.soldCount} Ventas
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block font-black text-xs text-toon-border">
                      ${item.revenue.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. RADAR DE MARKETING (PRÓXIMAMENTE) */}
        <div className="bg-toon-purple border-4 border-toon-border rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col h-[400px] relative overflow-hidden group">
          {/* Sello de Próximamente */}
          <div className="absolute top-6 -right-10 bg-toon-yellow text-toon-border font-black text-[10px] uppercase px-10 py-1 rotate-45 border-y-4 border-toon-border shadow-[0px_4px_0px_0px_rgba(0,0,0,0.2)] z-20 pointer-events-none">
            En Construcción
          </div>

          <div className="flex items-center gap-2 mb-4 pb-3 border-b-4 border-white/20 shrink-0 relative z-10">
            <Megaphone
              className="text-toon-yellow"
              size={24}
              strokeWidth={2.5}
            />
            <div>
              <h2 className="font-black text-lg uppercase tracking-tighter text-white leading-none">
                Radar de Ads
              </h2>
              <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">
                Retorno de Inversión
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-4 relative z-10 opacity-80 group-hover:opacity-100 transition-opacity">
            {/* Mock Meta Ads */}
            <div className="bg-white/10 border-2 border-white/30 rounded-xl p-3 flex items-center justify-between backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg border-2 border-toon-border">
                  <span className="font-black text-white text-[10px]">
                    META
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-black text-white/70 uppercase">
                    ROAS Estimado
                  </span>
                  <span className="block text-sm font-black text-white">
                    2.4x
                  </span>
                </div>
              </div>
              <div className="text-right">
                <MousePointerClick
                  size={16}
                  className="text-toon-yellow inline mb-1"
                />
                <span className="block text-[10px] font-bold text-white">
                  $120 c/u
                </span>
              </div>
            </div>

            {/* Mock Google Ads */}
            <div className="bg-white/10 border-2 border-white/30 rounded-xl p-3 flex items-center justify-between backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="bg-white p-1.5 rounded-lg border-2 border-toon-border">
                  <span className="font-black text-[#EA4335] text-[10px]">
                    GOOG
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-black text-white/70 uppercase">
                    Vistas (Defensa)
                  </span>
                  <span className="block text-sm font-black text-white">
                    +12.4k
                  </span>
                </div>
              </div>
              <div className="text-right">
                <Eye size={16} className="text-toon-lime inline mb-1" />
                <span className="block text-[10px] font-bold text-white">
                  CTR: 4.2%
                </span>
              </div>
            </div>

            <button
              disabled
              className="mt-auto bg-toon-yellow text-toon-border font-black uppercase text-xs py-3 rounded-xl border-3 border-toon-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-50 cursor-not-allowed"
            >
              Conectar Cuentas Publicitarias
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
