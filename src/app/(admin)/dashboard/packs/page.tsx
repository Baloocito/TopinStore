import { db } from '@/db'
import { products } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import PackCreatorClient from './PackCreatorClient' // El cliente que acabamos de crear

export default async function PacksPage() {
  // 1. OBTENER EL INVENTARIO REAL DE LA BASE DE DATOS
  // Buscamos solo productos de tipo 'simple' (no queremos meter un Pack dentro de un Pack)
  const inventory = await db.query.products.findMany({
    where: eq(products.type, 'simple'),
    orderBy: [desc(products.createdAt)],
  })

  // 2. FORMATEAR LOS DATOS PARA LA MESA DE CRAFTEO
  // Postgres a veces devuelve los DECIMAL como strings por precisión,
  // así que los transformamos a Number de forma segura.
  const formattedInventory = inventory.map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    stock: item.stock,
  }))

  // 3. RENDERIZAR LA INTERFAZ CON LOS DATOS REALES
  return <PackCreatorClient initialInventory={formattedInventory} />
}
