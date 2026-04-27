import Link from 'next/link'
import WelcomeBanner from '@/components/admin/WelcomeBanner'
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

// ==========================================
// 1. DICCIONARIO DE ÍCONOS (Escalabilidad)
// La BD devolverá strings (ej. "DollarSign"), y este mapa los convierte en Íconos de Lucide.
// ==========================================
const iconMap: Record<string, React.ElementType> = {
  DollarSign,
  ShoppingBag,
  Package,
  TrendingUp,
}

// ==========================================
// 2. FUNCIONES DE EXTRACCIÓN DE DATOS (Mocks)
// Aquí es donde conectarás Drizzle ORM y MercadoPago en el futuro.
// ==========================================
async function getDashboardStats() {
  // Simula el retraso de una base de datos real
  return [
    {
      title: 'Ingresos del Mes',
      value: '$1.240.000',
      change: '+14%',
      iconName: 'DollarSign',
      color: 'bg-toon-lime',
    },
    {
      title: 'Nuevos Pedidos',
      value: '34',
      change: '+5%',
      iconName: 'ShoppingBag',
      color: 'bg-toon-blue',
    },
    {
      title: 'Tesoros Activos',
      value: '128',
      change: '+2',
      iconName: 'Package',
      color: 'bg-toon-yellow',
    },
    {
      title: 'Conversión',
      value: '3.2%',
      change: '+0.4%',
      iconName: 'TrendingUp',
      color: 'bg-toon-pink',
    },
  ]
}

async function getRecentOrders() {
  return [
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
}

async function getWeeklyChart() {
  return [40, 70, 45, 90, 65, 85, 100] // Porcentajes de venta de Lunes a Domingo
}

// ==========================================
// 3. COMPONENTE PRINCIPAL (Server Component)
// Transformamos la función a 'async' para esperar a la base de datos
// ==========================================
export default async function DashboardPage() {
  // Ejecutamos todas las consultas al mismo tiempo para que cargue ultrarrápido
  const [stats, recentOrders, chartData] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(),
    getWeeklyChart(),
  ])

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. BANNER INTERACTIVO 3D */}
      <WelcomeBanner />

      {/* 2. STATS (TARJETAS KPI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          // Buscamos el ícono correcto en nuestro diccionario
          const Icon = iconMap[stat.iconName] || Star

          return (
            <div
              key={i}
              className={cn(
                'border-4 border-toon-border rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all group cursor-default',
                stat.color,
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/30 border-2 border-toon-border rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                  <Icon size={24} className="text-toon-border" />
                </div>
                <span className="bg-white border-2 border-toon-border px-2 py-1 rounded-lg font-black text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {stat.change}
                </span>
              </div>
              <h3 className="font-black text-toon-border/80 text-xs uppercase tracking-widest mb-1">
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
              <Activity className="text-toon-pink" strokeWidth={3} />
              Ventas Semanales
            </h3>
            <button className="px-4 py-2 border-3 border-toon-border rounded-xl text-[10px] font-black uppercase hover:bg-toon-yellow transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 active:translate-x-1">
              Reporte
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
                  <span className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-toon-border text-toon-yellow border-2 border-toon-border text-[10px] font-black px-2 py-1 rounded-lg pointer-events-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
                    {height}%
                  </span>
                  <div
                    className="w-full max-w-[40px] bg-toon-blue border-3 border-toon-border rounded-t-lg group-hover:bg-toon-pink transition-colors shadow-inner"
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
          <h3 className="font-black text-xl uppercase tracking-tighter mb-6 flex items-center gap-2">
            <Package className="text-toon-blue" strokeWidth={3} />
            Últimos Botines
          </h3>

          <div className="space-y-4 flex-1">
            {recentOrders.length > 0 ? (
              recentOrders.map((order, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 border-3 border-toon-border/10 rounded-2xl hover:border-toon-border hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border-2 border-toon-border/20 group-hover:border-toon-border group-hover:bg-toon-yellow transition-colors flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={16} className="text-toon-border" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-xs uppercase truncate">
                      {order.product}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400">
                      {order.id} • {order.date}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="font-black text-sm text-toon-lime drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] leading-none">
                      {order.amount}
                    </p>
                    <span
                      className={cn(
                        'text-[8px] font-black uppercase px-2 py-0.5 rounded-full border-2 border-toon-border shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]',
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
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 opacity-50">
                <Package size={32} />
                <p className="font-black text-xs uppercase">
                  Sin botín reciente
                </p>
              </div>
            )}
          </div>

          <Link
            href="/dashboard/sales"
            className="mt-6 w-full py-3 bg-white border-3 border-toon-border rounded-xl font-black text-xs uppercase text-center hover:bg-toon-yellow active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
          >
            Ver todas <ArrowRight size={14} strokeWidth={3} />
          </Link>
        </div>
      </div>
    </div>
  )
}
