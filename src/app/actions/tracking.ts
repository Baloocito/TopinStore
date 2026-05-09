'use server'

import { db } from '@/db'
import { products } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function recordProductView(productId: number) {
  // 🛡️ FILTRO DE CORDURA (Sanity Check)
  // Rechazamos automáticamente si el ID es falso, negativo, o si un hacker mandó texto
  if (!productId || typeof productId !== 'number' || productId <= 0) {
    console.warn('Radar de marketing detectó un ID inválido. Ignorando.')
    return
  }

  try {
    // Magia SQL: Le decimos a la base de datos que tome el valor actual y le sume 1
    // Drizzle ORM automáticamente blinda esto contra SQL Injections.
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
