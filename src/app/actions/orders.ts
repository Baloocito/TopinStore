'use server'

import { db } from '@/db'
import { orders } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
// 🛡️ Importamos las herramientas de seguridad
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

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

export async function updateOrderLogisticsAction(
  orderId: number,
  courier: string,
  trackingNumber: string,
) {
  try {
    // 🛡️ EL PORTERO DEL GREMIO
    const session = await getServerSession(authOptions)
    if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
      console.warn(
        `Intento de acceso no autorizado a updateOrderLogisticsAction por: ${session?.user?.email || 'Anónimo'}`,
      )
      return {
        success: false,
        message: '❌ Magia oscura detectada. No eres el Maestro del Gremio.',
      }
    }

    await db
      .update(orders)
      .set({
        courier,
        trackingNumber,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))

    revalidatePath('/dashboard/orders')
    return { success: true }
  } catch (error) {
    console.error('Error actualizando logística:', error)
    return {
      success: false,
      message: 'La carreta se rompió. No pudimos guardar el tracking.',
    }
  }
}
