import { NextResponse } from 'next/server'
import { db } from '@/db'
import { orders } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
})

export async function POST(request: Request) {
  try {
    // 1. Extraemos los parámetros de la URL que nos manda Mercado Pago
    const url = new URL(request.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const id = url.searchParams.get('data.id') || url.searchParams.get('id')

    // 2. Solo nos importan los avisos de "pago"
    if (topic === 'payment' && id) {
      // 3. Le preguntamos a Mercado Pago los detalles reales de este pago
      const paymentClient = new Payment(client)
      const paymentInfo = await paymentClient.get({ id })

      // 4. Verificamos si el pago fue aprobado
      if (paymentInfo.status === 'approved') {
        const orderId = paymentInfo.external_reference // ¡Este es el ID de nuestra DB que le enviamos!

        if (orderId) {
          // 5. ¡ACTUALIZAMOS LA ORDEN A PAGADA EN NUESTRA BASE DE DATOS!
          await db
            .update(orders)
            .set({
              paymentStatus: 'paid',
              updatedAt: new Date(),
            })
            .where(eq(orders.id, Number(orderId)))

          console.log(`✅ ¡ORO RECIBIDO! Orden ${orderId} pagada con éxito.`)

          // 🔮 AQUÍ EN EL FUTURO ENVIAREMOS EL CORREO AUTOMÁTICO
        }
      }
    }

    // Siempre debemos responderle un 200 OK a MP rápido para que deje de avisarnos
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error en el Guardián (Webhook):', error)
    return NextResponse.json(
      { error: 'Error procesando el webhook' },
      { status: 500 },
    )
  }
}
