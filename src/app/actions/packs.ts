'use server'

import { db } from '@/db'
import { products, bundleItems } from '@/db/schema'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'

// La nueva estructura que recibiremos del cliente (Min y Max)
type RecipeIngredient = {
  id: number
  minQuantity: number
  maxQuantity: number
}

export async function createPackAction(
  name: string,
  basePrice: number, // El precio inicial (ej. el estuche vacío a $3000)
  tier1: number, // % descuento nivel 1
  tier2: number, // % descuento nivel 2
  tier3: number, // % descuento nivel 3 (Full)
  ingredients: RecipeIngredient[], // La lista de ítems permitidos con sus límites
  imageUrl: string,
) {
  try {
    // 1. GENERAR SLUGS (Usando una lógica de limpieza similar a tu actions.ts)
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

    const uniqueSuffix = Date.now().toString().slice(-4)
    const slug = `${baseSlug}-${uniqueSuffix}`
    const sku = `BYOB-${Date.now().toString().slice(-6)}` // BYOB = Build Your Own Bundle

    // 2. FORJAR EL CONTENEDOR (El Pack Base) en Neon
    const [newPack] = await db
      .insert(products)
      .values({
        name: name,
        slug: slug,
        sku: sku,
        price: basePrice.toString(),
        type: 'pack', // CRÍTICO: Lo marca como un pack dinámico

        // Guardamos las reglas del juego (Tiers)
        tier1Discount: tier1,
        tier2Discount: tier2,
        tier3Discount: tier3,

        // Un pack dinámico en teoría es "infinito" hasta que se acaban sus ingredientes reales
        stock: 999,
        isAvailable: true,
        images: [imageUrl],
      })
      .returning({ id: products.id })

    // 3. PREPARAR LAS REGLAS DE LOS INGREDIENTES
    const recipe = ingredients.map((item) => ({
      bundleId: newPack.id,
      productId: item.id,
      minQuantity: item.minQuantity,
      maxQuantity: item.maxQuantity,
    }))

    // 4. INTENTAR GUARDAR LOS INGREDIENTES (Con Rollback de seguridad)
    try {
      if (recipe.length > 0) {
        await db.insert(bundleItems).values(recipe)
      }
    } catch (recipeError) {
      // 🚨 ROLLBACK MANUAL: Si explota la receta, borramos el contenedor base
      console.error('Error al guardar las reglas del grimorio:', recipeError)
      await db.delete(products).where(eq(products.id, newPack.id))
      throw new Error(
        'Falló la asignación de ingredientes. Se limpió el caldero.',
      )
    }

    // 5. ACTUALIZAR CACHÉ
    revalidatePath('/dashboard/products')
    revalidatePath('/dashboard/packs')

    return {
      success: true,
      message: '¡Grimorio actualizado! Pack forjado con éxito.',
    }
  } catch (error) {
    console.error('Error fatal al forjar el pack:', error)
    return {
      success: false,
      message: 'El caldero explotó. Revisa la consola del servidor.',
    }
  }
}
