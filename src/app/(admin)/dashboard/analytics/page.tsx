import { db } from '@/db'
import { orders, orderItems } from '@/db/schema'
import { gte } from 'drizzle-orm'
import AnalyticsClient, { TopItem } from './AnalyticsClient'

export default async function AnalyticsPage() {
  // 1. DEFINIMOS LA META MENSUAL (Puedes guardarla en BD después, por ahora es fija)
  const MONTHLY_GOAL = 1000000 // 1 Millón de pesos

  // 2. OBTENEMOS LAS FECHAS CLAVE
  const now = new Date()

  // Inicio de mes
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Hoy a las 00:00:00
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  )

  // Ayer a las 00:00:00
  const startOfYesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  )

  // 3. CONSULTA AL SERVIDOR (Extraemos los pedidos desde inicio de mes)
  const recentOrders = await db.query.orders.findMany({
    where: gte(orders.createdAt, startOfMonth),
    with: { items: true },
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

    // Sumar a Mensual
    monthlyRevenue += orderTotal

    // Sumar a Hoy o Ayer
    if (orderDate >= startOfToday) {
      todayRevenue += orderTotal
    } else if (orderDate >= startOfYesterday && orderDate < startOfToday) {
      yesterdayRevenue += orderTotal
    }

    // Calcular el DPS de los Items (Items Meta)
    order.items.forEach((item) => {
      if (!itemsTracker[item.productName]) {
        itemsTracker[item.productName] = { count: 0, rev: 0 }
      }
      itemsTracker[item.productName].count += item.quantity
      itemsTracker[item.productName].rev +=
        Number(item.priceAtTime) * item.quantity
    })
  })

  // Ordenar y extraer el Top 10 de Items Meta
  const topItems: TopItem[] = Object.entries(itemsTracker)
    .map(([name, data]) => ({ name, soldCount: data.count, revenue: data.rev }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Datos para el gráfico semanal (Si la BD está vacía, usamos Mock Data para que el gráfico no se rompa)
  const weeklyData = [
    { day: 'Lun', amount: 15000 },
    { day: 'Mar', amount: 32000 },
    { day: 'Mié', amount: 8000 },
    { day: 'Jue', amount: 45000 },
    { day: 'Vie', amount: 21000 },
    { day: 'Sáb', amount: 60000 },
    { day: 'Dom', amount: todayRevenue || 12000 },
  ]

  // Si la tienda es 100% nueva, metemos datos de prueba para el HUD
  if (monthlyRevenue === 0) {
    return (
      <AnalyticsClient
        data={{
          monthlyGoal: MONTHLY_GOAL,
          monthlyRevenue: 345000,
          todayRevenue: 45000,
          yesterdayRevenue: 32000,
          topItems: [
            {
              name: 'Estuche Kawaii Super Pro',
              soldCount: 15,
              revenue: 150000,
            },
            { name: 'Lápiz Destacador Neón', soldCount: 45, revenue: 112500 },
            {
              name: 'Pack Supervivencia Escolar',
              soldCount: 8,
              revenue: 82500,
            },
          ],
          weeklyData,
        }}
      />
    )
  }

  // Empaquetamos todo para enviarlo al Cliente
  const analyticsData = {
    monthlyGoal: MONTHLY_GOAL,
    monthlyRevenue,
    todayRevenue,
    yesterdayRevenue,
    topItems,
    weeklyData, // Idealmente, calcular esto iterando los últimos 7 días con `recentOrders`
  }

  return <AnalyticsClient data={analyticsData} />
}
