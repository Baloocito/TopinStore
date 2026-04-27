import { db } from '@/db'
import { products, categories } from '@/db/schema'
import { eq, ilike, or, and, gt, lte } from 'drizzle-orm'

// Añadimos "page: number = 1" como cuarto parámetro
export async function getProducts(
  query?: string,
  stockFilter?: string,
  categoryFilter?: string,
  page: number = 1,
) {
  try {
    const conditions = []

    // Cuántas cartas quieres ver por página (ej. 12 para que queden 3 filas de 4 en monitor grande)
    const ITEMS_PER_PAGE = 12
    const offset = (page - 1) * ITEMS_PER_PAGE

    // 1. CONDICIÓN DE BÚSQUEDA
    if (query) {
      conditions.push(
        or(
          ilike(products.name, `%${query}%`),
          ilike(products.sku, `%${query}%`),
        ),
      )
    }

    // 2. CONDICIÓN DE STOCK
    if (stockFilter && stockFilter !== 'todos') {
      if (stockFilter === 'seguro') {
        conditions.push(gt(products.stock, 5))
      } else if (stockFilter === 'critico') {
        conditions.push(and(gt(products.stock, 0), lte(products.stock, 5)))
      } else if (stockFilter === 'agotado') {
        conditions.push(lte(products.stock, 0))
      }
    }

    // 3. CONDICIÓN DE CATEGORÍA
    if (categoryFilter && categoryFilter !== 'todas') {
      const cat = await db.query.categories.findFirst({
        where: eq(categories.slug, categoryFilter),
      })

      if (cat) {
        conditions.push(eq(products.categoryId, cat.id))
      } else {
        conditions.push(eq(products.id, -1))
      }
    }

    // 4. EJECUTAMOS LA CONSULTA CON PAGINACIÓN (limit y offset)
    const data = await db.query.products.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        category: true,
      },
      orderBy: (products, { desc }) => [desc(products.createdAt)],
      limit: ITEMS_PER_PAGE, // <-- Solo trae 12
      offset: offset, // <-- Se salta los anteriores dependiendo de la página
    })

    return data
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}
