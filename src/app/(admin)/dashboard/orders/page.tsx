import { db } from '@/db'
import { orders, products } from '@/db/schema'
import { desc, inArray } from 'drizzle-orm'
import OrdersKanbanClient, { OrderData } from './OrdersKanbanClient'

export default async function OrdersPage() {
  const rawOrders = await db.query.orders.findMany({
    with: {
      customer: true,
      items: true,
    },
    orderBy: [desc(orders.createdAt)],
  })

  const recipeProductIds = new Set<number>()

  rawOrders.forEach((order) => {
    order.items.forEach((item) => {
      const recipe = item.packRecipe as {
        items?: { id: number; qty: number }[]
      } | null

      if (recipe && recipe.items) {
        recipe.items.forEach((recipeItem) => {
          recipeProductIds.add(recipeItem.id)
        })
      }
    })
  })

  const recipeProductsMap: Record<number, string> = {}
  if (recipeProductIds.size > 0) {
    const fetchedProducts = await db.query.products.findMany({
      where: inArray(products.id, Array.from(recipeProductIds)),
      columns: { id: true, name: true },
    })
    fetchedProducts.forEach((p) => {
      recipeProductsMap[p.id] = p.name
    })
  }

  const formattedOrders: OrderData[] = rawOrders.map((order) => {
    let readableAddress = 'Dirección no registrada'
    if (order.shippingAddress) {
      if (typeof order.shippingAddress === 'string') {
        readableAddress = order.shippingAddress
      } else {
        const addr = order.shippingAddress as any
        const deptoText = addr.depto ? ` (Depto: ${addr.depto})` : ''
        readableAddress = `${addr.address}${deptoText}, ${addr.comuna}, Región ${addr.region}`
      }
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || 'Jugador Anónimo',
      // 🔥 BLINDAMOS LOS NÚMEROS POR SI LA BD TIENE NULL O TEXTOS RAROS
      subtotal: Number(order.subtotal) || 0,
      total: Number(order.total) || 0,
      // 🔥 AGREGAMOS EL ESTADO DE PAGO
      paymentStatus: order.paymentStatus || 'unpaid',
      status: order.status,
      itemsCount: order.items.length,
      shippingAddress: readableAddress,
      customerNotes: order.customerNotes || null,
      trackingNumber: order.trackingNumber || null,
      courier: order.courier || null,
      // 🔥 AGREGAMOS LA FECHA DE CREACIÓN
      createdAt: order.createdAt || new Date(),
      items: order.items.map((item) => {
        const recipe = item.packRecipe as {
          items?: { id: number; qty: number; name?: string }[]
        } | null

        let enrichedRecipe = recipe ? JSON.parse(JSON.stringify(recipe)) : null

        if (enrichedRecipe && enrichedRecipe.items) {
          enrichedRecipe.items = enrichedRecipe.items.map((rItem: any) => ({
            ...rItem,
            name:
              recipeProductsMap[rItem.id] || `Reliquia Perdida #${rItem.id}`,
          }))
        }

        return {
          id: item.id,
          productName: item.productName,
          priceAtTime: Number(item.priceAtTime),
          quantity: item.quantity,
          packRecipe: enrichedRecipe,
        }
      }),
    }
  })

  return <OrdersKanbanClient initialOrders={formattedOrders} />
}
