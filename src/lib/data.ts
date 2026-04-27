import { db } from '@/db'
import { products, categories } from '@/db/schema'
import { eq, ilike, or, and, gt, lte } from 'drizzle-orm'

// ==========================================
// 1. MOTOR DE BÚSQUEDA Y FILTROS (Dashboard)
// ==========================================
export async function getProducts(
  query?: string,
  stockFilter?: string,
  categoryFilter?: string,
  page: number = 1,
) {
  try {
    const conditions = []

    // Cuántas cartas quieres ver por página
    const ITEMS_PER_PAGE = 12
    const offset = (page - 1) * ITEMS_PER_PAGE

    if (query) {
      conditions.push(
        or(
          ilike(products.name, `%${query}%`),
          ilike(products.sku, `%${query}%`),
        ),
      )
    }

    if (stockFilter && stockFilter !== 'todos') {
      if (stockFilter === 'seguro') {
        conditions.push(gt(products.stock, 5))
      } else if (stockFilter === 'critico') {
        conditions.push(and(gt(products.stock, 0), lte(products.stock, 5)))
      } else if (stockFilter === 'agotado') {
        conditions.push(lte(products.stock, 0))
      }
    }

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

    const data = await db.query.products.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        category: true,
      },
      orderBy: (products, { desc }) => [desc(products.createdAt)],
      limit: ITEMS_PER_PAGE,
      offset: offset,
    })

    return data
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

// ==========================================
// 2. BUSCADOR DE PRODUCTO INDIVIDUAL (Página Pública)
// ==========================================
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
