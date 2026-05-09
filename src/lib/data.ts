import { db } from '@/db'
import { products, categories, customers } from '@/db/schema'
import { SQL, eq, ilike, or, and, gt, lte, desc } from 'drizzle-orm'
// ==========================================
// UTILIDAD: MOTOR DE STOCK DINÁMICO (Packs)
// ==========================================
function calculateDynamicPackStock(pack: any) {
  if (!pack.bundleComponents || pack.bundleComponents.length === 0) {
    return pack.stock
  }

  const requiredIngredients = pack.bundleComponents.filter(
    (component: any) => component.minQuantity > 0,
  )

  if (requiredIngredients.length === 0) {
    return pack.stock
  }

  const maxPossiblePacks = requiredIngredients.map((component: any) => {
    return Math.floor(component.product.stock / component.minQuantity)
  })

  return Math.min(...maxPossiblePacks)
}

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
    // 2. TIPAMOS EL ARRAY: Le decimos a TS que esto solo aceptará sentencias SQL válidas
    const conditions: SQL[] = [eq(products.isArchived, false)]
    const ITEMS_PER_PAGE = 12
    const offset = (page - 1) * ITEMS_PER_PAGE

    if (query) {
      // 3. APLICAMOS LA DEFENSA: Guardamos la condición en una variable primero
      const queryCondition = or(
        ilike(products.name, `%${query}%`),
        ilike(products.sku, `%${query}%`),
      )
      // Solo la empujamos si realmente existe
      if (queryCondition) {
        conditions.push(queryCondition)
      }
    }

    if (stockFilter && stockFilter !== 'todos') {
      if (stockFilter === 'seguro') {
        conditions.push(gt(products.stock, 5))
      } else if (stockFilter === 'critico') {
        // Hacemos la misma defensa aquí por si acaso con el and()
        const criticoCondition = and(
          gt(products.stock, 0),
          lte(products.stock, 5),
        )
        if (criticoCondition) {
          conditions.push(criticoCondition)
        }
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

    const rawData = await db.query.products.findMany({
      where: and(...conditions),
      with: {
        category: true,
        bundleComponents: {
          with: { product: true },
        },
      },
      orderBy: (products, { desc }) => [desc(products.createdAt)],
      limit: ITEMS_PER_PAGE,
      offset: offset,
    })

    const formattedData = rawData.map((item) => {
      if (item.type === 'pack') {
        const realStock = calculateDynamicPackStock(item)
        return {
          ...item,
          stock: realStock,
          isAvailable: realStock > 0 && item.isAvailable,
        }
      }
      return item
    })

    return formattedData
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

// ==========================================
// 2. BUSCADOR DE PRODUCTO INDIVIDUAL (Tienda)
// ==========================================
export async function getProductBySlug(slug: string) {
  try {
    const rawProduct = await db.query.products.findFirst({
      where: eq(products.slug, slug),
      with: {
        category: true,
        bundleComponents: {
          with: { product: true },
        },
      },
    })

    if (!rawProduct) return null

    if (rawProduct.type === 'pack') {
      const realStock = calculateDynamicPackStock(rawProduct)
      return {
        ...rawProduct,
        stock: realStock,
        isAvailable: realStock > 0 && rawProduct.isAvailable,
      }
    }

    return rawProduct
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// ==========================================
// 3. CÓDICE DE NPCs (Buscador de Clientes)
// ==========================================
export async function getCustomers(query?: string, page: number = 1) {
  try {
    const ITEMS_PER_PAGE = 12
    const offset = (page - 1) * ITEMS_PER_PAGE
    const conditions = []

    // Permite buscar por nombre o correo electrónico
    if (query) {
      conditions.push(
        or(
          ilike(customers.name, `%${query}%`),
          ilike(customers.email, `%${query}%`),
        ),
      )
    }

    const data = await db.query.customers.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      // Ordenamos primero por los que han gastado más oro (Descendente)
      orderBy: (customers, { desc }) => [
        desc(customers.totalSpent),
        desc(customers.createdAt),
      ],
      limit: ITEMS_PER_PAGE,
      offset: offset,
      // Opcional: Traemos sus órdenes para ver su historial en el Front-End
      with: {
        orders: {
          limit: 5, // Traemos sus últimas 5 misiones
          orderBy: (orders, { desc }) => [desc(orders.createdAt)],
        },
      },
    })

    return data
  } catch (error) {
    console.error('Error fetching NPCs:', error)
    return []
  }
}
// ==========================================
// 4. EL CÓDICE DE CATEGORÍAS (Para Filtros)
// ==========================================
export async function getCategories() {
  try {
    return await db.query.categories.findMany({
      orderBy: [desc(categories.name)],
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}
