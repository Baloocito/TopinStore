import { db } from './index'
import {
  categories,
  products,
  bundleItems,
  customers,
  orders,
  orderItems,
} from './schema'

async function main() {
  console.log('🧹 Limpiando la base de datos (Wipe total)...')

  // El orden es vital por las dependencias (Relational DB)
  await db.delete(orderItems)
  await db.delete(orders)
  await db.delete(customers)
  await db.delete(bundleItems)
  await db.delete(products)
  await db.delete(categories)

  console.log('🌱 Sembrando el Gremio...')

  // ==========================================
  // 1. CATEGORÍAS
  // ==========================================
  const [catPapeleria, catAccesorios, catPacks] = await db
    .insert(categories)
    .values([
      { name: 'Papelería Mágica', slug: 'papeleria-magica' },
      { name: 'Accesorios Épicos', slug: 'accesorios-epicos' },
      { name: 'Cajas de Botín', slug: 'cajas-de-botin' },
    ])
    .returning()

  // ==========================================
  // 2. PRODUCTOS (Con Vistas y Ventas simuladas)
  // ==========================================
  const [lapiz, goma, cuaderno, estucheBase, cajaLoot] = await db
    .insert(products)
    .values([
      {
        sku: 'ITM-001',
        slug: 'lapiz-destacador-neon',
        name: 'Lápiz Destacador Neón',
        categoryId: catPapeleria.id,
        type: 'simple',
        stock: 150,
        price: '1500',
        cost: '500',
        isAvailable: true,
        // ESTADÍSTICAS: Excelente conversión (aprox 3.3%)
        viewsCount: 1240,
        salesCount: 42,
      },
      {
        sku: 'ITM-002',
        slug: 'goma-borrar-magica',
        name: 'Goma de Borrar Mágica',
        categoryId: catPapeleria.id,
        type: 'simple',
        stock: 80,
        price: '800',
        cost: '200',
        isAvailable: true,
        // ESTADÍSTICAS: Conversión normal
        viewsCount: 350,
        salesCount: 12,
      },
      {
        sku: 'ITM-003',
        slug: 'cuaderno-cuadriculado-top',
        name: 'Cuaderno Cuadriculado Top',
        categoryId: catPapeleria.id,
        type: 'simple',
        stock: 50,
        price: '4500',
        cost: '1500',
        isAvailable: true,
        // ESTADÍSTICAS: Buena conversión
        viewsCount: 410,
        salesCount: 15,
      },
      {
        sku: 'CNT-001',
        slug: 'estuche-kawaii-base',
        name: 'Estuche Kawaii (Contenedor)',
        categoryId: catAccesorios.id,
        type: 'simple',
        stock: 40,
        price: '3000',
        cost: '1000',
        isAvailable: true,
        viewsCount: 80,
        salesCount: 5,
      },
      {
        sku: 'CNT-002',
        slug: 'caja-loot-misteriosa',
        name: 'Caja Loot (Contenedor)',
        categoryId: catPacks.id,
        type: 'simple',
        stock: 200,
        price: '1500',
        cost: '400',
        isAvailable: true,
        viewsCount: 45,
        salesCount: 2,
      },
    ])
    .returning()

  // ==========================================
  // 3. PACKS (GRIMORIO)
  // ==========================================
  const [packEscolar, packLegendario] = await db
    .insert(products)
    .values([
      {
        sku: 'BYOB-001',
        slug: 'pack-supervivencia-escolar',
        name: 'Pack Supervivencia Escolar',
        categoryId: catPacks.id,
        type: 'pack',
        stock: 999,
        price: '3000',
        cost: '1000',
        tier1Discount: 5,
        tier2Discount: 10,
        tier3Discount: 20,
        // ESTADÍSTICAS: Producto popular
        viewsCount: 850,
        salesCount: 28,
      },
      {
        sku: 'BYOB-002',
        slug: 'caja-legendaria-sorpresa',
        name: 'Caja Legendaria Sorpresa',
        categoryId: catPacks.id,
        type: 'pack',
        stock: 999,
        price: '1500',
        cost: '400',
        tier1Discount: 10,
        tier2Discount: 20,
        tier3Discount: 30,
        // ESTADÍSTICAS: Problema de negocio (Muchísimas vistas, casi nulas ventas = 0.3%)
        viewsCount: 1100,
        salesCount: 3,
      },
    ])
    .returning()

  // ==========================================
  // 4. RECETAS DE LOS PACKS
  // ==========================================
  await db.insert(bundleItems).values([
    {
      bundleId: packEscolar.id,
      productId: lapiz.id,
      minQuantity: 1,
      maxQuantity: 5,
    },
    {
      bundleId: packEscolar.id,
      productId: goma.id,
      minQuantity: 0,
      maxQuantity: 2,
    },
    {
      bundleId: packEscolar.id,
      productId: cuaderno.id,
      minQuantity: 1,
      maxQuantity: 3,
    },
    {
      bundleId: packLegendario.id,
      productId: cuaderno.id,
      minQuantity: 2,
      maxQuantity: 5,
    },
    {
      bundleId: packLegendario.id,
      productId: lapiz.id,
      minQuantity: 2,
      maxQuantity: 10,
    },
  ])

  // ==========================================
  // 5. NPCs (CLIENTES)
  // ==========================================
  const [npc1, npc2, npc3, npc4] = await db
    .insert(customers)
    .values([
      {
        name: 'Momo Deviluke',
        email: 'momo@galaxy.com',
        totalSpent: '56000',
        ordersCount: 3,
        createdAt: new Date('2026-03-05T10:00:00Z'),
      },
      {
        name: 'Goku Son',
        email: 'goku@capsule.com',
        totalSpent: '125000',
        ordersCount: 5,
        createdAt: new Date('2026-03-10T12:00:00Z'),
      },
      {
        name: 'Naruto Uzumaki',
        email: 'ramen@konoha.com',
        totalSpent: '8500',
        ordersCount: 1,
        createdAt: new Date('2026-04-15T09:00:00Z'),
      },
      {
        name: 'Luffy Monkey',
        email: 'pirate@sea.com',
        totalSpent: '32000',
        ordersCount: 2,
        createdAt: new Date('2026-04-20T14:00:00Z'),
      },
    ])
    .returning()

  // ==========================================
  // 6. MISIONES (PEDIDOS MARZO Y ABRIL)
  // ==========================================
  const [order1, order2, order3, order4] = await db
    .insert(orders)
    .values([
      {
        orderNumber: 'ORD-20260315-001',
        customerId: npc1.id,
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'MercadoPago',
        subtotal: '20000',
        discount: '2000',
        shippingCost: '3500',
        total: '21500',
        shippingAddress: 'Planeta Deviluke 123',
        courier: 'Starken',
        trackingNumber: 'STK-99991',
        createdAt: new Date('2026-03-15T15:30:00Z'),
      },
      {
        orderNumber: 'ORD-20260410-002',
        customerId: npc2.id,
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'Transferencia',
        subtotal: '45000',
        discount: '5000',
        shippingCost: '0',
        total: '40000',
        shippingAddress: 'Montaña Paoz',
        courier: 'Chilexpress',
        trackingNumber: 'CHX-88882',
        createdAt: new Date('2026-04-10T11:20:00Z'),
      },
      {
        orderNumber: 'ORD-20260429-003',
        customerId: npc4.id,
        status: 'shipped',
        paymentStatus: 'paid',
        paymentMethod: 'MercadoPago',
        subtotal: '15000',
        discount: '0',
        shippingCost: '3000',
        total: '18000',
        shippingAddress: 'Thousand Sunny',
        courier: 'Bluexpress',
        trackingNumber: 'BLU-77773',
        createdAt: new Date('2026-04-29T16:45:00Z'),
      },
      {
        orderNumber: 'ORD-20260501-004',
        customerId: npc3.id,
        status: 'pending',
        paymentStatus: 'paid',
        paymentMethod: 'MercadoPago',
        subtotal: '8500',
        discount: '0',
        shippingCost: '2500',
        total: '11000',
        shippingAddress: 'Aldea Oculta de la Hoja',
        courier: 'Starken',
        customerNotes: 'Tocar el timbre fuerte',
        createdAt: new Date(),
      },
    ])
    .returning()

  // ==========================================
  // 7. LOOT DE LAS MISIONES (ITEMS VENDIDOS)
  // ==========================================
  await db.insert(orderItems).values([
    {
      orderId: order1.id,
      productId: cuaderno.id,
      productName: cuaderno.name,
      priceAtTime: '4500',
      quantity: 2,
    },
    {
      orderId: order1.id,
      productId: lapiz.id,
      productName: lapiz.name,
      priceAtTime: '1500',
      quantity: 4,
    },
    {
      orderId: order2.id,
      productId: packEscolar.id,
      productName: packEscolar.name,
      priceAtTime: '22000',
      quantity: 2,
      packRecipe: {
        items: [
          { id: cuaderno.id, qty: 3 },
          { id: lapiz.id, qty: 5 },
        ],
      },
    },
    {
      orderId: order3.id,
      productId: goma.id,
      productName: goma.name,
      priceAtTime: '800',
      quantity: 5,
    },
    {
      orderId: order3.id,
      productId: lapiz.id,
      productName: lapiz.name,
      priceAtTime: '1500',
      quantity: 2,
    },
    {
      orderId: order4.id,
      productId: cuaderno.id,
      productName: cuaderno.name,
      priceAtTime: '4500',
      quantity: 1,
    },
  ])

  console.log('✅ ¡Gremio sembrado con éxito! Tienes oro, clientes y misiones.')
  process.exit(0)
}

main().catch((e) => {
  console.error('❌ Error fatal al sembrar la base de datos:', e)
  process.exit(1)
})
