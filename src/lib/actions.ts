'use server'

import { db } from '@/db'
import { products, categories } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { UTApi } from 'uploadthing/server'

// 🛡️ Importamos las herramientas de seguridad
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

const utapi = new UTApi()

// 1. UTILIDAD: Generador de Slugs profesional
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/\s+/g, '-') // Espacios por guiones
    .replace(/[^\w-]+/g, '') // Quitar caracteres especiales
    .replace(/--+/g, '-') // Quitar guiones duplicados
    .trim()
}

// 2. UTILIDAD: Parseo seguro de imágenes
function parseImages(imagesRaw: FormDataEntryValue | null): string[] {
  if (!imagesRaw || typeof imagesRaw !== 'string') return []
  return imagesRaw
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url !== '')
}

// 3. UTILIDAD: Parseo seguro de Specs (JSON)
function parseSpecs(specsRaw: FormDataEntryValue | null): any[] {
  if (!specsRaw || typeof specsRaw !== 'string') return []
  try {
    return JSON.parse(specsRaw)
  } catch (e) {
    console.error('Error parseando specs:', e)
    return []
  }
}

// ==========================================
// 🛡️ GUARDIÁN CENTRAL (Filtro Reutilizable)
// ==========================================
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    throw new Error(
      '❌ ¡ALTO AHÍ! Magia oscura detectada. No eres el Maestro del Gremio.',
    )
  }
}

// --- SERVER ACTIONS ---

export async function createProduct(formData: FormData) {
  await requireAdmin() // 🛡️ Candado puesto

  const name = formData.get('name') as string
  if (!name) throw new Error('El nombre es obligatorio')

  const slug = `${slugify(name)}-${Date.now().toString().slice(-4)}`

  await db.insert(products).values({
    name: name,
    sku: formData.get('sku') as string,
    slug: slug,
    price: formData.get('price') as string,
    cost: (formData.get('cost') as string) || '0',
    stock: parseInt(formData.get('stock') as string) || 0,
    categoryId: parseInt(formData.get('categoryId') as string) || null,
    description: formData.get('description') as string,
    images: parseImages(formData.get('images')),
    specs: parseSpecs(formData.get('specs')),
  })

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function updateProduct(formData: FormData) {
  await requireAdmin() // 🛡️ Candado puesto

  const idRaw = formData.get('id')
  if (!idRaw) throw new Error('ID del producto no proporcionado')

  const id = parseInt(idRaw as string)
  const newImages = parseImages(formData.get('images'))

  const currentProduct = await db.query.products.findFirst({
    where: eq(products.id, id),
  })

  if (currentProduct?.images) {
    const oldImages = currentProduct.images
    const imagesToDelete = oldImages.filter(
      (oldUrl: string) => !newImages.includes(oldUrl),
    )

    if (imagesToDelete.length > 0) {
      const keysToDelete = imagesToDelete
        .map((url: string) => url.split('/').pop())
        .filter(Boolean) as string[]
      if (keysToDelete.length > 0) {
        await utapi.deleteFiles(keysToDelete)
      }
    }
  }

  await db
    .update(products)
    .set({
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      price: formData.get('price') as string,
      cost: (formData.get('cost') as string) || '0',
      stock: parseInt(formData.get('stock') as string) || 0,
      categoryId: parseInt(formData.get('categoryId') as string) || null,
      description: formData.get('description') as string,
      images: newImages,
      specs: parseSpecs(formData.get('specs')),
    })
    .where(eq(products.id, id))

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin() // 🛡️ Candado puesto

  const idRaw = formData.get('id')
  if (!idRaw) throw new Error('ID del producto no proporcionado')

  const id = parseInt(idRaw as string)

  await db
    .update(products)
    .set({
      isArchived: true,
      isAvailable: false,
    })
    .where(eq(products.id, id))

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

export async function restoreProduct(id: number) {
  await requireAdmin() // 🛡️ Candado puesto

  await db
    .update(products)
    .set({ isArchived: false })
    .where(eq(products.id, id))

  revalidatePath('/dashboard/products')
}

export async function deleteAbandonedFiles(urls: string[]) {
  await requireAdmin() // 🛡️ Candado puesto

  if (!urls || urls.length === 0) return

  const keys = urls
    .map((url) => url.split('/').pop())
    .filter(Boolean) as string[]

  if (keys.length > 0) {
    await utapi.deleteFiles(keys)
  }
}

// --- ACCIONES DE CATEGORÍAS ---

export async function createCategory(formData: FormData) {
  await requireAdmin() // 🛡️ Candado puesto

  const name = formData.get('name') as string
  if (!name) throw new Error('El nombre de la categoría es obligatorio')

  const slug = `${slugify(name)}-${Date.now().toString().slice(-4)}`

  await db.insert(categories).values({
    name: name,
    slug: slug,
  })

  revalidatePath('/dashboard/products')
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin() // 🛡️ Candado puesto

  const idRaw = formData.get('id')
  if (!idRaw) throw new Error('ID de categoría no proporcionado')

  const id = parseInt(idRaw as string)

  await db
    .update(products)
    .set({ categoryId: null })
    .where(eq(products.categoryId, id))

  await db.delete(categories).where(eq(categories.id, id))

  revalidatePath('/dashboard/products')
}
