import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { db } from './index'
import { categories, products } from './schema'
import { eq } from 'drizzle-orm'

async function main() {
  console.log('🌱 Iniciando siembra maestra...')

  try {
    // 1. Insertar Categorías
    await db
      .insert(categories)
      .values([
        { name: 'Peluches & Kawaii', slug: 'kawaii' },
        { name: 'Tesoros de Feria', slug: 'feria' },
      ])
      .onConflictDoNothing()

    // 2. Obtener los IDs para asociar
    const catKawaii = await db.query.categories.findFirst({
      where: eq(categories.slug, 'kawaii'),
    })
    const catFeria = await db.query.categories.findFirst({
      where: eq(categories.slug, 'feria'),
    })

    if (!catKawaii || !catFeria)
      throw new Error('No se encontraron las categorías')

    // 3. Insertar Productos de prueba con Specs e Imágenes
    await db
      .insert(products)
      .values([
        {
          sku: 'TOT-001',
          slug: 'estuche-totoro-toon',
          name: 'Estuche Totoro Toon',
          description: 'Un estuche ultra suave para tus lápices mágicos.',
          price: '12500',
          stock: 10,
          categoryId: catKawaii.id,
          images: [
            'https://placehold.co/600x600/png?text=Totoro+1',
            'https://placehold.co/600x600/png?text=Totoro+2',
          ],
          specs: [
            { label: 'Material', value: 'Felpa' },
            { label: 'Rareza', value: 'Común' },
          ],
        },
        {
          sku: 'FER-099',
          slug: 'camara-vintage-feria',
          name: 'Cámara Zenit 12xp',
          description: 'Joyita de la feria. Funciona (creemos).',
          price: '45000',
          stock: 1,
          categoryId: catFeria.id,
          images: ['https://placehold.co/600x600/png?text=Camara+Vintage'],
          specs: [
            { label: 'Año', value: '1980' },
            { label: 'Estado', value: 'Usado' },
          ],
        },
      ])
      .onConflictDoNothing()

    console.log('✅ Base de datos poblada con éxito')
  } catch (error) {
    console.error('❌ Error en seed:', error)
  }
  process.exit(0)
}

main()
