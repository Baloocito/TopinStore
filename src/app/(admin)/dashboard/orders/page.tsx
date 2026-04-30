import { db } from '@/db'
import { orders } from '@/db/schema'
import { desc } from 'drizzle-orm'
import OrdersKanbanClient, { OrderData } from './OrdersKanbanClient'

export default async function OrdersPage() {
  // 1. Buscador Relacional de Drizzle (Limpio y sin errores de SQL)
  const rawOrders = await db.query.orders.findMany({
    with: {
      customer: true, // Traemos al NPC (Cliente)
      items: true, // Traemos el botín para contarlo
    },
    orderBy: [desc(orders.createdAt)],
  })

  // 2. Formatear la data para nuestro Motor Kanban
  const formattedOrders: OrderData[] = rawOrders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer?.name || 'Jugador Anónimo',
    total: Number(order.total),
    status: order.status,
    itemsCount: order.items.length, // Contamos los ítems en JavaScript
  }))

  return <OrdersKanbanClient initialOrders={formattedOrders} />
}
