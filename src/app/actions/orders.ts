'use server'

import { db } from '@/db'
import { orders, products } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
// 🛡️ Importamos las herramientas de seguridad
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { Resend } from 'resend'
import ShippingEmail from '@/components/emails/ShippingEmail'

export async function updateOrderStatusAction(
  orderId: number,
  newStatus: string,
) {
  try {
    // 🛡️ EL PORTERO DEL GREMIO
    const session = await getServerSession(authOptions)
    if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
      console.warn(
        `Intento de acceso no autorizado a updateOrderStatusAction por: ${session?.user?.email || 'Anónimo'}`,
      )
      return {
        success: false,
        message: '❌ Magia oscura detectada. No eres el Maestro del Gremio.',
      }
    }

    await db
      .update(orders)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(orders.id, orderId))

    revalidatePath('/dashboard/orders')
    return { success: true }
  } catch (error) {
    console.error('Error actualizando la misión:', error)
    return {
      success: false,
      message: 'El gremio no pudo actualizar la misión.',
    }
  }
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function updateOrderLogisticsAction(
  orderId: number,
  courier: string,
  trackingNumber: string,
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
      return { success: false, message: '❌ Magia oscura detectada.' }
    }

    // 1. Guardamos los datos en la base de datos
    await db
      .update(orders)
      .set({
        courier,
        trackingNumber,
        status: 'shipped', // OPCIONAL: Mueve la tarjeta automáticamente a "En la Carreta"
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))

    // 2. Buscamos el correo del cliente para avisarle
    const orderData = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { customer: true },
    })

    // 3. Soltamos al Cuervo Mensajero
    if (orderData?.customer?.email) {
      await resend.emails.send({
        from: 'Topin Store <ventas@tudominio.cl>', // CAMBIAR por tu dominio verificado en Resend
        to: orderData.customer.email,
        subject: `🚚 ¡Tu botín está en camino! Orden ${orderData.orderNumber}`,
        react: ShippingEmail({
          customerName: orderData.customer.name,
          orderNumber: orderData.orderNumber,
          courier: courier,
          trackingNumber: trackingNumber,
        }),
      })
      console.log(`✉️ Cuervo de envío despachado a ${orderData.customer.email}`)
    }

    revalidatePath('/dashboard/orders')
    return { success: true }
  } catch (error) {
    console.error('Error actualizando logística:', error)
    return { success: false, message: 'La carreta se rompió.' }
  }
}

export async function deleteOrderAndReleaseStockAction(orderId: number) {
  try {
    // 1. Buscamos los ítems de la orden para saber qué devolver
    const orderWithItems = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { items: true },
    })

    if (!orderWithItems) {
      return {
        success: false,
        message: 'La misión no existe en los registros.',
      }
    }

    // 2. Usamos una transacción SQL idéntica a la del limpiador
    await db.transaction(async (tx) => {
      for (const item of orderWithItems.items) {
        if (!item.productId) continue

        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} + ${item.quantity}`,
          })
          .where(eq(products.id, item.productId))
      }

      // 3. Modificamos el estado a 'expired' (o puedes usar tx.delete(orders) si prefieres borrarla)
      await tx
        .update(orders)
        .set({
          status: 'expired',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
    })

    revalidatePath('/admin/orders') // Ajusta esta ruta a la de tu panel kanban
    return { success: true }
  } catch (error) {
    console.error('Error al revocar misión manualmente:', error)
    return { success: false, message: 'La magia de la base de datos falló.' }
  }
}
