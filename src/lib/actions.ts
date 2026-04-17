'use server'

import { db } from '@/db'
import { products } from '@/db/schema'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

export async function createProduct(formData: FormData) {
  // Campos base
  const name = formData.get('name') as string
  const price = formData.get('price') as string
  const stock = parseInt(formData.get('stock') as string)
  const sku = formData.get('sku') as string
  const categoryId = parseInt(formData.get('categoryId') as string)
  const description = formData.get('description') as string

  // ✅ Manejo robusto de imágenes
  const imagesString = formData.get('images') as string
  const images = imagesString
    ? imagesString
        .split(',')
        .map((img) => img.trim())
        .filter((img) => img !== '')
    : []

  // ✅ Slug único y limpio
  const slug = `${slugify(name)}-${Date.now().toString().slice(-4)}`

  await db.insert(products).values({
    name,
    sku,
    slug,
    price,
    stock,
    categoryId,
    description,
    images,
    specs: [], // después puedes hacerlo dinámico
  })

  revalidatePath('/')
  redirect('/dashboard')
}
