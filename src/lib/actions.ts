'use server'

import { db } from '@/db'
import { products, categories } from '@/db/schema'

import { eq } from 'drizzle-orm' // <--- EL IMPORT FALTANTE QUE CAUSABA EL ERROR
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { UTApi } from 'uploadthing/server'

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

// --- SERVER ACTIONS ---

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string
  if (!name) throw new Error('El nombre es obligatorio') // Validación básica de seguridad

  // Ahora SÍ usamos nuestra función slugify + un timestamp corto para evitar colisiones
  const slug = `${slugify(name)}-${Date.now().toString().slice(-4)}`

  await db.insert(products).values({
    name: name,
    sku: formData.get('sku') as string,
    slug: slug,
    price: formData.get('price') as string,
    cost: (formData.get('cost') as string) || '0', // <--- ¡AQUÍ ESTÁ EL NUEVO DATO!
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
  const idRaw = formData.get('id')
  if (!idRaw) throw new Error('ID del producto no proporcionado')

  const id = parseInt(idRaw as string)

  // 1. Extraemos las imágenes nuevas usando nuestra función segura
  const newImages = parseImages(formData.get('images'))

  // 2. Buscamos el producto actual ANTES de actualizarlo
  const currentProduct = await db.query.products.findFirst({
    where: eq(products.id, id),
  })

  // 3. Comparamos las fotos viejas con las nuevas para limpiar UploadThing
  if (currentProduct?.images) {
    const oldImages = currentProduct.images

    // Si una imagen vieja NO está en el array de imágenes nuevas, hay que borrarla
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

  // 4. Actualizamos el producto en Neon
  await db
    .update(products)
    .set({
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      price: formData.get('price') as string,
      cost: (formData.get('cost') as string) || '0', // <--- ¡AQUÍ ESTÁ EL NUEVO DATO!
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
  const idRaw = formData.get('id')
  if (!idRaw) throw new Error('ID del producto no proporcionado')

  const id = parseInt(idRaw as string)

  // SOFT DELETE: En lugar de borrar, actualizamos isArchived a true y lo ocultamos de la tienda
  await db
    .update(products)
    .set({
      isArchived: true,
      isAvailable: false, // Inmediatamente dejamos de venderlo
    })
    .where(eq(products.id, id))

  // Nota de Arquitectura: Ya no borramos las imágenes de UploadThing porque
  // el producto "archivado" las sigue necesitando para mostrarse en recibos antiguos.

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}

// Opcional: Una acción para restaurar un producto si fue un error
export async function restoreProduct(id: number) {
  await db
    .update(products)
    .set({ isArchived: false })
    .where(eq(products.id, id))

  revalidatePath('/dashboard/products')
}

export async function deleteAbandonedFiles(urls: string[]) {
  if (!urls || urls.length === 0) return

  // Extraemos las llaves (keys) de las URLs
  const keys = urls
    .map((url) => url.split('/').pop())
    .filter(Boolean) as string[]

  if (keys.length > 0) {
    await utapi.deleteFiles(keys)
  }
}

// --- ACCIONES DE CATEGORÍAS ---

export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string
  if (!name) throw new Error('El nombre de la categoría es obligatorio')

  // Usamos la misma función slugify que ya tienes arriba
  const slug = `${slugify(name)}-${Date.now().toString().slice(-4)}`

  await db.insert(categories).values({
    name: name,
    slug: slug,
  })

  revalidatePath('/dashboard/products')
}

// --- ACCIONES DE CATEGORÍAS ---
// Las categorías no tienen Soft Delete en tu schema actual.
// Para no complicar la BD ahora mismo, dejaremos que se borren físicamente,
// PERO las desvincularemos de los productos primero (dejando categoryId en null).
export async function deleteCategory(formData: FormData) {
  const idRaw = formData.get('id')
  if (!idRaw) throw new Error('ID de categoría no proporcionado')

  const id = parseInt(idRaw as string)

  // 1. Quitar la categoría de todos los productos que la usen (Evita el error de Foranea)
  await db
    .update(products)
    .set({ categoryId: null })
    .where(eq(products.categoryId, id))

  // 2. Ahora sí, borramos la categoría con seguridad
  await db.delete(categories).where(eq(categories.id, id))

  revalidatePath('/dashboard/products')
}
