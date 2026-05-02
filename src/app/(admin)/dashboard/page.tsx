import Link from 'next/link'
import WelcomeBanner from '@/components/admin/WelcomeBanner'
// IMPORTAMOS EL NUEVO GRÁFICO INTERACTIVO
import DashboardChart from '@/components/admin/DashboardChart'
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  ArrowRight,
  Star,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// IMPORTS REALES DE BASE DE DATOS
import { db } from '@/db'
import { orders, products, customers } from '@/db/schema'
import { desc, eq, sql } from 'drizzle-orm'

const iconMap: Record<string, React.ElementType> = {
  DollarSign,
  ShoppingBag,
  Package,
  TrendingUp,
  Users,
}

// Utilidad para formatear fechas relativas
const formatRelativeDate = (dateString: Date | null) => {
  if (!dateString) return 'Desconocido'
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const timeString = date.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (date.toDateString() === today.toDateString()) return `Hoy, ${timeString}`
  if (date.toDateString() === yesterday.toDateString())
    return `Ayer, ${timeString}`
  return date.toLocaleDateString('es-CL')
}

export default async function DashboardPage() {
  // ==========================================
  // CONSULTAS A LA BASE DE DATOS (En Paralelo)
  // ==========================================
  const now = new Date()
  const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1)

  // 1. Traer todos los pedidos
  const allOrders = await db.query.orders.findMany({
    with: { customer: true, items: true },
    orderBy: [desc(orders.createdAt)],
  })

  // 2. Contar Productos Activos
  const activeProductsData = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.isAvailable, true))

  // 3. Contar Clientes Totales
  const customersData = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers)

  // ==========================================
  // PROCESAMIENTO MATEMÁTICO
  // ==========================================

  // A. Métricas Rápidas
  const monthlyRevenue = allOrders
    .filter(
      (o) =>
        o.createdAt &&
        new Date(o.createdAt) >= startOfMonthDate &&
        o.status !== 'cancelled',
    )
    .reduce((acc, o) => acc + Number(o.total), 0)

  const pendingOrders = allOrders.filter((o) => o.status === 'pending')
  const pendingCount = pendingOrders.length

  const stats = [
    {
      title: 'Ingresos del Mes',
      value: `$${monthlyRevenue.toLocaleString('es-CL')}`,
      change: 'Activo',
      iconName: 'DollarSign',
      color: 'bg-toon-lime',
    },
    {
      title: 'Misiones Nuevas',
      value: pendingCount.toString(),
      change: 'Pendientes',
      iconName: 'ShoppingBag',
      color: 'bg-toon-blue',
    },
    {
      title: 'Tesoros en Venta',
      value: activeProductsData[0].count.toString(),
      change: 'Bodega',
      iconName: 'Package',
      color: 'bg-toon-yellow',
    },
    {
      title: 'Aventureros',
      value: customersData[0].count.toString(),
      change: 'Total',
      iconName: 'Users',
      color: 'bg-toon-pink',
    },
  ]

  // B. Últimas 4 Órdenes
  const recentOrders = allOrders.slice(0, 4).map((order) => ({
    id: order.orderNumber,
    product: order.items[0]?.productName
      ? `${order.items[0].productName} ${order.items.length > 1 ? `(+${order.items.length - 1})` : ''}`
      : 'Botín Misterioso',
    date: formatRelativeDate(order.createdAt),
    amount: `$${Number(order.total).toLocaleString('es-CL')}`,
    status:
      order.status === 'pending'
        ? 'Pendiente'
        : order.status === 'packing'
          ? 'En Forja'
          : order.status === 'shipped'
            ? 'Enviado'
            : 'Entregado',
  }))

  // C. Preparar datos semanales detallados para el NUEVO componente interactivo
  const weeklyData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      day: d.toLocaleDateString('es-CL', { weekday: 'short' }), // Ej: 'lun', 'mar'
      revenue: 0,
      orders: 0,
    }
  })

  allOrders.forEach((o) => {
    if (!o.createdAt || o.status === 'cancelled') return
    const diffTime = Math.abs(now.getTime() - new Date(o.createdAt).getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 7) {
      weeklyData[6 - diffDays].revenue += Number(o.total)
      weeklyData[6 - diffDays].orders += 1
    }
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* 1. BANNER INTERACTIVO 3D */}
      <WelcomeBanner pendingMissions={pendingCount} />

      {/* 2. STATS (TARJETAS KPI REALES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = iconMap[stat.iconName] || Star

          return (
            <div
              key={i}
              className={cn(
                'border-4 border-toon-border rounded-3xl p-6 transition-all group',
                'cursor-pointer select-none',
                'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
                'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1',
                'active:shadow-none active:translate-x-[6px] active:translate-y-[6px]',
                stat.color,
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/30 border-2 border-toon-border rounded-xl backdrop-blur-sm group-hover:scale-110 group-active:scale-95 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                  <Icon size={24} className="text-toon-border" />
                </div>
                <span className="bg-white border-2 border-toon-border px-2 py-1 rounded-lg font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {stat.change}
                </span>
              </div>
              <h3 className="font-black text-toon-border/80 text-xs uppercase tracking-widest mb-1 pointer-events-none">
                {stat.title}
              </h3>
              <p className="font-black text-3xl md:text-4xl text-toon-border tracking-tighter truncate pointer-events-none">
                {stat.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* 3. GRÁFICOS Y ACTIVIDAD RECIENTE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* === AQUÍ REEMPLAZAMOS EL CÓDIGO VIEJO POR EL COMPONENTE NUEVO === */}
        <div className="lg:col-span-2">
          <DashboardChart data={weeklyData} />
        </div>

        {/* Panel de Órdenes Recientes */}
        <div className="bg-white border-4 border-toon-border rounded-3xl p-6 shadow-toon flex flex-col h-[400px]">
          <h3 className="font-black text-xl uppercase tracking-tighter mb-6 flex items-center gap-2 shrink-0">
            <Package className="text-toon-blue" strokeWidth={3} />
            Últimos Botines
          </h3>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 no-scrollbar">
            {recentOrders.length > 0 ? (
              recentOrders.map((order, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 border-3 border-toon-border/10 rounded-2xl hover:border-toon-border hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border-2 border-toon-border/20 group-hover:border-toon-border group-hover:bg-toon-yellow transition-colors flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={16} className="text-toon-border" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-xs uppercase truncate">
                      {order.product}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 truncate">
                      {order.id} • {order.date}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1 shrink-0">
                    <p className="font-black text-sm text-toon-lime drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] leading-none">
                      {order.amount}
                    </p>
                    <span
                      className={cn(
                        'text-[8px] font-black uppercase px-2 py-0.5 rounded-full border-2 border-toon-border shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]',
                        order.status === 'Pendiente'
                          ? 'bg-toon-pink text-white'
                          : order.status === 'Entregado'
                            ? 'bg-toon-lime'
                            : order.status === 'Enviado'
                              ? 'bg-toon-blue text-white'
                              : 'bg-toon-yellow',
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
                <p className="font-black text-xs uppercase text-center">
                  Aún no hay expediciones completadas
                </p>
              </div>
            )}
          </div>

          <Link
            href="/dashboard/orders"
            className="mt-4 shrink-0 w-full py-3 bg-white border-3 border-toon-border rounded-xl font-black text-xs uppercase text-center hover:bg-toon-yellow active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
          >
            Ir al Tablero Kanban <ArrowRight size={14} strokeWidth={3} />
          </Link>
        </div>
      </div>
    </div>
  )
}
