import { db } from '@/db'
import { products, categories } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getProducts() {
  try {
    // Usamos el query builder de Drizzle para traer la relación fácilmente
    const data = await db.query.products.findMany({
      with: {
        category: true, // Esto trae el objeto de la categoría
      },
      orderBy: (products, { desc }) => [desc(products.createdAt)],
    })
    return data
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const product = await db.query.products.findFirst({
      where: eq(products.slug, slug),
      with: {
        category: true,
      },
    })
    return product || null
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}
