import { db } from '@/db'
import { orders, products } from '@/db/schema'
import { desc, inArray } from 'drizzle-orm'
import OrdersKanbanClient, { OrderData } from './OrdersKanbanClient'

export default async function OrdersPage() {
  // 1. Traer órdenes con cliente e ítems
  const rawOrders = await db.query.orders.findMany({
    with: {
      customer: true,
      items: true,
    },
    orderBy: [desc(orders.createdAt)],
  })

  // 2. MAGIA DE TRADUCCIÓN: Extraer todos los IDs de ingredientes
  const recipeProductIds = new Set<number>()

  rawOrders.forEach((order) => {
    order.items.forEach((item) => {
      // LE DECIMOS A TYPESCRIPT LA FORMA DE NUESTRO JSON
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

  // 3. Buscar los nombres reales en la base de datos
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

  // 4. Formatear la data e inyectar el nombre real a la receta
  const formattedOrders: OrderData[] = rawOrders.map((order) => {
    // 🔥 EL TRADUCTOR DE DIRECCIONES (De JSON a String legible)
    let readableAddress = 'Dirección no registrada'
    if (order.shippingAddress) {
      if (typeof order.shippingAddress === 'string') {
        readableAddress = order.shippingAddress
      } else {
        // Si ya viene como el nuevo objeto JSON del Checkout
        const addr = order.shippingAddress as any
        const deptoText = addr.depto ? ` (Depto: ${addr.depto})` : ''
        readableAddress = `${addr.address}${deptoText}, ${addr.comuna}, Región ${addr.region}`
      }
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || 'Jugador Anónimo',
      total: Number(order.total),
      status: order.status,
      itemsCount: order.items.length,
      shippingAddress: readableAddress, // <--- Aquí pasamos el string ya limpio
      customerNotes: order.customerNotes || null,
      trackingNumber: order.trackingNumber || null,
      courier: order.courier || null,
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
