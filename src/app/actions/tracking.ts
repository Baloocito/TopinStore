'use server'

import { db } from '@/db'
import { products } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function recordProductView(productId: number) {
  try {
    // Magia SQL: Le decimos a la base de datos que tome el valor actual y le sume 1
    await db
      .update(products)
      .set({ viewsCount: sql`${products.viewsCount} + 1` })
      .where(eq(products.id, productId))
  } catch (error) {
    // Si falla el tracker, no queremos que la página del cliente explote,
    // así que solo lo registramos en silencio.
    console.error('Error en el radar de marketing (Views):', error)
  }
}
