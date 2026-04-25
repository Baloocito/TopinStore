import Link from 'next/link'
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  ArrowRight,
  Activity,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// MOCK DATA: Datos de prueba para previsualizar el diseño.
// Más adelante conectaremos esto a tu base de datos Neon y MercadoPago.
const stats = [
  {
    title: 'Ingresos del Mes',
    value: '$1.240.000',
    change: '+14%',
    icon: DollarSign,
    color: 'bg-toon-lime',
  },
  {
    title: 'Nuevos Pedidos',
    value: '34',
    change: '+5%',
    icon: ShoppingBag,
    color: 'bg-toon-blue',
  },
  {
    title: 'Tesoros Activos',
    value: '128',
    change: '+2',
    icon: Package,
    color: 'bg-toon-yellow',
  },
  {
    title: 'Conversión',
    value: '3.2%',
    change: '+0.4%',
    icon: TrendingUp,
    color: 'bg-toon-pink',
  },
]

const recentOrders = [
  {
    id: '#ORD-092',
    product: 'Pack Aventura Épica',
    date: 'Hoy, 14:30',
    amount: '$45.000',
    status: 'Pagado',
  },
  {
    id: '#ORD-091',
    product: 'Espada de Madera Toon',
    date: 'Hoy, 11:15',
    amount: '$15.000',
    status: 'Enviado',
  },
  {
    id: '#ORD-090',
    product: 'Poción de Salud x3',
    date: 'Ayer, 18:45',
    amount: '$9.000',
    status: 'Pagado',
  },
  {
    id: '#ORD-089',
    product: 'Escudo Neobrutalista',
    date: 'Ayer, 16:20',
    amount: '$25.000',
    status: 'Entregado',
  },
]

// Gráfico de barras CSS simple para mantener el estilo Toon
const chartData = [40, 70, 45, 90, 65, 85, 100]

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. BANNER DE BIENVENIDA (ESTILO RPG) */}
      <div className="bg-toon-border text-grey rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-[6px_6px_0px_0px_rgba(255,105,180,1)] relative overflow-hidden">
        <div className="relative z-10 space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full border-2 border-white/30 backdrop-blur-sm mb-2">
            <Star size={14} className="text-black fill-yellow-500" />
            <span className="font-bold text-[10px] uppercase tracking-widest text-gray-600">
              Nivel de Tienda: Épico
            </span>
          </div>
          <h2 className="font-black text-3xl md:text-5xl uppercase tracking-tighter">
            ¡Hola de nuevo, <span className="text-toon-yellow">Eusebio</span>!
          </h2>
          <p className="font-bold text-sm md:text-base text-gray-300 max-w-lg">
            Tus productos están arrasando. Tienes 4 pedidos nuevos esperando ser
            enviados y tu conversión ha subido esta semana. ¡Sigue así!
          </p>
        </div>

        {/* Acciones Rápidas del Banner */}
        <div className="relative z-10 flex gap-3 w-full md:w-auto">
          <Link
            href="/dashboard/products?new=true"
            className="flex-1 md:flex-none px-6 py-4 bg-toon-lime border-4 border-white rounded-xl font-black text-toon-border text-sm md:text-base uppercase hover:bg-green-400 transition-colors text-center shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-y-1 active:translate-x-1"
          >
            + NUEVO TESORO
          </Link>
        </div>

        {/* Elementos decorativos de fondo */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-toon-pink rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-32 h-32 bg-toon-blue rounded-full blur-3xl opacity-50 pointer-events-none" />
      </div>

      {/* 2. STATS (TARJETAS KPI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={i}
              className={cn(
                'border-4 border-toon-border rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all group',
                stat.color,
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/30 border-2 border-toon-border rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <Icon size={24} className="text-toon-border" />
                </div>
                <span className="bg-white border-2 border-toon-border px-2 py-1 rounded-lg font-black text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {stat.change}
                </span>
              </div>
              <h3 className="font-black text-gray-800 text-xs uppercase tracking-widest mb-1">
                {stat.title}
              </h3>
              <p className="font-black text-3xl md:text-4xl text-toon-border tracking-tighter">
                {stat.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* 3. GRÁFICOS Y ACTIVIDAD RECIENTE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel de Gráfico (Mini-juego de Stats) */}
        <div className="lg:col-span-2 bg-white border-4 border-toon-border rounded-3xl p-6 shadow-toon flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-xl uppercase tracking-tighter flex items-center gap-2">
              <Activity className="text-toon-pink" />
              Ventas Semanales
            </h3>
            <button className="px-4 py-2 border-2 border-toon-border rounded-lg text-[10px] font-black uppercase hover:bg-toon-yellow transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5">
              Descargar Reporte
            </button>
          </div>

          {/* Gráfico de Barras CSS (Toon Style) */}
          <div className="flex-1 flex items-end gap-2 md:gap-4 h-48 mt-auto border-b-4 border-toon-border pb-4 px-2">
            {chartData.map((height, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-full relative flex justify-center">
                  {/* Tooltip Hover */}
                  <span className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-toon-border text-white text-[10px] font-black px-2 py-1 rounded-lg pointer-events-none">
                    {height}
                  </span>
                  {/* Barra */}
                  <div
                    className="w-full max-w-[40px] bg-toon-blue border-3 border-toon-border rounded-t-lg group-hover:bg-toon-pink transition-colors"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="font-black text-[10px] text-gray-400">
                  D{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de Órdenes Recientes */}
        <div className="bg-white border-4 border-toon-border rounded-3xl p-6 shadow-toon flex flex-col">
          <h3 className="font-black text-xl uppercase tracking-tighter mb-6">
            Últimos Botines
          </h3>
          <div className="space-y-4 flex-1">
            {recentOrders.map((order, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 border-3 border-toon-border/10 rounded-2xl hover:border-toon-yellow hover:bg-yellow-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-toon-bg border-2 border-toon-border flex items-center justify-center flex-shrink-0">
                  <ShoppingBag size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-xs uppercase truncate">
                    {order.product}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400">
                    {order.id} • {order.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-toon-lime drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                    {order.amount}
                  </p>
                  <span
                    className={cn(
                      'text-[8px] font-black uppercase px-2 py-0.5 rounded-full border-2 border-toon-border',
                      order.status === 'Pagado'
                        ? 'bg-toon-lime'
                        : order.status === 'Enviado'
                          ? 'bg-toon-blue text-white'
                          : 'bg-white',
                    )}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/sales"
            className="mt-6 w-full py-3 bg-slate-100 border-3 border-toon-border rounded-xl font-black text-xs uppercase text-center hover:bg-toon-yellow transition-colors flex items-center justify-center gap-2"
          >
            Ver todas <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
