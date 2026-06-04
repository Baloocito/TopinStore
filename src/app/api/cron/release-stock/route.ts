import { NextResponse } from 'next/server'
import { db } from '@/db'
import { orders, orderItems, products } from '@/db/schema'
import { eq, and, lt, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // 🛡️ PROTECCIÓN CRÍTICA
  const authHeader = request.headers.get('authorization')
  const systemSecret = process.env.CRON_SECRET

  // Log de emergencia para ver en los servidores de Vercel qué está llegando
  console.log('--- AUDITORÍA CRON ---')
  console.log('¿Existe secret en servidor?:', !!systemSecret)

  if (!authHeader || authHeader !== `Bearer ${systemSecret}`) {
    return new NextResponse('No autorizado', { status: 401 })
  }

  try {
    const now = new Date()

    // 🕵️ 1. BUSCAR MISIONES EXPIRADAS (Versión Adaptada Opción A + Limpieza Histórica)
    const expiredOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.status, 'pending'),
        sql`(${orders.expiresAt} < ${now} OR ${orders.expiresAt} IS NULL OR ${orders.createdAt} < ${now} - INTERVAL '2 hours')`,
      ),
      with: {
        items: true,
      },
    })

    if (expiredOrders.length === 0) {
      return NextResponse.json({
        message: 'No hay misiones expiradas por ahora.',
      })
    }

    console.log(
      `🧹 Limpiador: Procesando ${expiredOrders.length} misiones expiradas...`,
    )

    // 🛠️ 2. PROCESO DE DEVOLUCIÓN (Uno por uno para asegurar el stock)
    for (const order of expiredOrders) {
      // Usamos una transacción para que si algo falla, no quede el stock a medias
      await db.transaction(async (tx) => {
        // A. Devolver Stock al inventario real
        for (const item of order.items) {
          if (item.productId == null) {
            continue
          }

          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${item.quantity}`,
              // Opcional: Podrías restar del salesCount si lo deseas,
              // pero usualmente solo se ajusta el stock físico.
            })
            .where(eq(products.id, item.productId))
        }

        // B. Marcar la orden como EXPIRADA
        await tx
          .update(orders)
          .set({
            status: 'expired',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id))
      })
    }

    return NextResponse.json({
      success: true,
      processed: expiredOrders.length,
      message:
        'El stock ha vuelto a la bodega y las misiones fueron archivadas.',
    })
  } catch (error) {
    console.error('🔥 Error fatal en el Limpiador de Stock:', error)
    return NextResponse.json(
      { error: 'Fallo en la limpieza del gremio' },
      { status: 500 },
    )
  }
}
