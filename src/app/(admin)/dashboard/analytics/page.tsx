import { db } from '@/db'
import { orders, products } from '@/db/schema'
import { gte, eq } from 'drizzle-orm'
import AnalyticsClient, { TopItem } from './AnalyticsClient'

export default async function AnalyticsPage() {
  // 1. META MENSUAL
  const MONTHLY_GOAL = 1000000 // 1 Millón de pesos

  // 2. OBTENEMOS LAS FECHAS CLAVE (Hora Local)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  )
  const startOfYesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  )

  // 3. GENERADOR DE FECHAS PARA EL GRÁFICO (Últimos 7 días exactos)
  const weeklyDataMap = new Map<string, { day: string; amount: number }>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    // Extraemos la fecha en formato YYYY-MM-DD respetando la zona horaria local
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    // Formateamos el día (ej: "Lun", "Mar")
    const dayName = new Intl.DateTimeFormat('es-CL', {
      weekday: 'short',
    }).format(d)
    const formattedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1, 3)

    weeklyDataMap.set(dateKey, { day: formattedDay, amount: 0 })
  }

  // 4. CONSULTA AL SERVIDOR (Misiones y Catálogo)
  // Traemos los pedidos de este mes para calcular Loot y Top Items
  const recentOrders = await db.query.orders.findMany({
    where: gte(orders.createdAt, startOfMonth),
    with: { items: true },
  })

  // Traemos todos los productos activos para descubrir el "Cementerio" (Peores Ítems)
  const activeProducts = await db.query.products.findMany({
    where: eq(products.isArchived, false),
  })

  // ==========================================
  // MATEMÁTICAS EN EL SERVIDOR
  // ==========================================
  let monthlyRevenue = 0
  let todayRevenue = 0
  let yesterdayRevenue = 0
  const itemsTracker: Record<string, { count: number; rev: number }> = {}

  recentOrders.forEach((order) => {
    // Si la misión fue cancelada o no pagada, no cuenta para el HP
    if (order.status === 'cancelled' || order.paymentStatus === 'unpaid') return

    const orderTotal = Number(order.total)
    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date()
    const orderDateKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`

    // A. Sumar a Mensual
    monthlyRevenue += orderTotal

    // B. Sumar a Hoy o Ayer
    if (orderDate >= startOfToday) {
      todayRevenue += orderTotal
    } else if (orderDate >= startOfYesterday && orderDate < startOfToday) {
      yesterdayRevenue += orderTotal
    }

    // C. Sumar al Gráfico Semanal
    if (weeklyDataMap.has(orderDateKey)) {
      const current = weeklyDataMap.get(orderDateKey)!
      current.amount += orderTotal
      weeklyDataMap.set(orderDateKey, current)
    }

    // D. Calcular el DPS de los Items (Items Meta del Mes)
    order.items.forEach((item) => {
      if (!itemsTracker[item.productName]) {
        itemsTracker[item.productName] = { count: 0, rev: 0 }
      }
      itemsTracker[item.productName].count += item.quantity
      itemsTracker[item.productName].rev +=
        Number(item.priceAtTime) * item.quantity
    })
  })

  // ==========================================
  // PROCESAMIENTO DE RANKINGS
  // ==========================================

  // Extraer el Top 10 de Items Meta (Los que más dinero generaron este mes)
  const topItems: TopItem[] = Object.entries(itemsTracker)
    .map(([name, data]) => ({ name, soldCount: data.count, revenue: data.rev }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Extraer el Cementerio de Ítems Histórico (Los que menos venden en total)
  const worstItems: TopItem[] = activeProducts
    .map((p) => ({
      name: p.name,
      soldCount: p.salesCount,
      revenue: p.salesCount * Number(p.price),
    }))
    .sort((a, b) => {
      // Prioriza mostrar primero los que tienen menos ventas
      if (a.soldCount === b.soldCount) return a.revenue - b.revenue
      return a.soldCount - b.soldCount
    })
    .slice(0, 10)

  // Convertimos el mapa semanal de vuelta a un Array para el gráfico
  const weeklyData = Array.from(weeklyDataMap.values())

  // Empaquetamos todo de forma 100% REAL
  const analyticsData = {
    monthlyGoal: MONTHLY_GOAL,
    monthlyRevenue,
    todayRevenue,
    yesterdayRevenue,
    topItems,
    worstItems, // <--- Nueva variable conectada
    weeklyData, // <--- Ahora es un gráfico real y dinámico
  }

  return <AnalyticsClient data={analyticsData} />
}
