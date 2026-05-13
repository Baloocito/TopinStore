import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto' // Librería nativa de Node.js para matemáticas de seguridad
import { db } from '@/db'
import { orders } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { Resend } from 'resend'
import ReceiptEmail from '@/components/emails/ReceiptEmail'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
})
const resend = new Resend(process.env.RESEND_API_KEY)
const webhookSecret = process.env.MP_WEBHOOK_SECRET || ''

export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id')

    // 🛡️ 1. EXTRAER LOS SELLOS DE SEGURIDAD (Headers)
    const headersList = await headers()
    const xSignature = headersList.get('x-signature')
    const xRequestId = headersList.get('x-request-id')

    // 🛡️ 2. COMPROBACIÓN CRIPTOGRÁFICA (HMAC SHA256)
    if (xSignature && xRequestId && dataId && webhookSecret) {
      // Mercado Pago envía el timestamp y el hash separados por coma
      const parts = xSignature.split(',')
      let ts = ''
      let hash = ''

      parts.forEach((part) => {
        const [key, value] = part.split('=')
        if (key === 'ts') ts = value
        if (key === 'v1') hash = value
      })

      // Reconstruimos el "Manifiesto" original
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

      // Lo encriptamos con tu llave secreta
      const hmac = crypto.createHmac('sha256', webhookSecret)
      hmac.update(manifest)
      const expectedHash = hmac.digest('hex')

      // Si nuestra firma no es EXACTAMENTE igual a la que envió Mercado Pago = Es un Hacker.
      if (expectedHash !== hash) {
        console.error(
          '🚨 ALERTA DE SEGURIDAD: Sello falsificado. Intento de ataque bloqueado.',
        )
        return NextResponse.json({ error: 'Firma Inválida' }, { status: 401 })
      }
    } else if (process.env.NODE_ENV === 'production') {
      // Si estamos en producción y mandan el webhook sin firmas, lo bloqueamos de inmediato.
      console.warn('⚠️ Intento de acceso al webhook sin firmas en producción.')
      return NextResponse.json({ error: 'Faltan firmas' }, { status: 400 })
    }

    // 💰 3. PROCESAR EL PAGO (Si pasamos el escudo)
    if (topic === 'payment' && dataId) {
      const paymentClient = new Payment(client)
      const paymentInfo = await paymentClient.get({ id: dataId })

      if (paymentInfo.status === 'approved') {
        const orderId = paymentInfo.external_reference

        if (orderId) {
          const orderData = await db.query.orders.findFirst({
            where: eq(orders.id, Number(orderId)),
            with: { customer: true },
          })

          // Validamos que exista y que no esté ya pagada (evita envíos dobles de correo)
          if (orderData && orderData.paymentStatus !== 'paid') {
            // Actualizamos el estado en la base de datos
            await db
              .update(orders)
              .set({
                paymentStatus: 'paid',
                updatedAt: new Date(),
              })
              .where(eq(orders.id, Number(orderId)))

            // Enviamos el Cuervo Mensajero (Correo)
            if (orderData.customer) {
              await resend.emails.send({
                from: 'Topin Store <onboarding@resend.dev>', // Cámbialo cuando verifiques tu dominio
                to: orderData.customer.email,
                subject: `¡Botín Asegurado! Orden ${orderData.orderNumber}`,
                react: ReceiptEmail({
                  customerName: orderData.customer.name,
                  orderNumber: orderData.orderNumber,
                  totalAmount: Number(orderData.total).toLocaleString('es-CL'),
                }),
              })
              // 🔥 NUEVO: Alerta Interna para el Maestro del Gremio
              if (process.env.ADMIN_EMAIL) {
                await resend.emails.send({
                  from: 'Topin Bot <ventas@tudominio.cl>',
                  to: process.env.ADMIN_EMAIL,
                  subject: `💰 ¡NUEVA VENTA! $${Number(orderData.total).toLocaleString('es-CL')} - ${orderData.orderNumber}`,
                  html: `
                    <h2>¡Ha entrado oro a la bóveda!</h2>
                    <p><strong>Cliente:</strong> ${orderData.customer.name}</p>
                    <p><strong>Total:</strong> $${Number(orderData.total).toLocaleString('es-CL')}</p>
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/orders">Ir al Tablero de Misiones</a>
                  `,
                })
              }
            }

            console.log(
              `✅ ¡ORO RECIBIDO! Orden ${orderData.orderNumber} procesada y sellada.`,
            )
          }
        }
      }
    }

    // Siempre devolvemos 200 OK para que MP sepa que lo recibimos y deje de insistir
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error en el Guardián (Webhook):', error)
    return NextResponse.json(
      { error: 'Error interno procesando webhook' },
      { status: 500 },
    )
  }
}
