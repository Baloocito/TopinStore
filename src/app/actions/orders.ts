'use server'

import { db } from '@/db'
import { orders } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatusAction(
  orderId: number,
  newStatus: string,
) {
  try {
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
