import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
  decimal,
  text,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ==========================================
// 1. CATEGORÍAS
// ==========================================
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
})

// ==========================================
// 2. PRODUCTOS PRINCIPALES (El Grimorio)
// ==========================================
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  sku: varchar('sku', { length: 50 }).unique().notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  images: text('images').array().notNull().default([]),
  specs: jsonb('specs').default([]),
  categoryId: integer('category_id').references(() => categories.id),
  type: varchar('type', { length: 20 }).notNull().default('simple'),
  stock: integer('stock').notNull().default(0),

  // FINANZAS
  price: decimal('price', { precision: 10, scale: 0 }).notNull(),
  cost: decimal('cost', { precision: 10, scale: 0 }).default('0'),

  // ESTADOS DEL PRODUCTO
  isAvailable: boolean('is_available').default(true),
  isArchived: boolean('is_archived').default(false),

  // 🔥 NUEVO: BATTLE STATS (Métricas de Rendimiento)
  viewsCount: integer('views_count').notNull().default(0), // Defensa: Vistas de la página
  salesCount: integer('sales_count').notNull().default(0), // Impactos: Unidades vendidas históricas

  // DESCUENTOS POR TIERS (Packs)
  tier1Discount: integer('tier1_discount').default(0),
  tier2Discount: integer('tier2_discount').default(0),
  tier3Discount: integer('tier3_discount').default(0),

  createdAt: timestamp('created_at').defaultNow(),
})
// ==========================================
// 3. TABLA INTERMEDIA (Reglas de Crafteo)
// ==========================================
export const bundleItems = pgTable('bundle_items', {
  id: serial('id').primaryKey(),
  bundleId: integer('bundle_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),

  minQuantity: integer('min_quantity').notNull().default(0),
  maxQuantity: integer('max_quantity').notNull().default(5),
})

// ==========================================
// 4. RELACIONES DE INVENTARIO
// ==========================================
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  bundleComponents: many(bundleItems, { relationName: 'bundleComponents' }),
}))

export const bundleItemsRelations = relations(bundleItems, ({ one }) => ({
  bundle: one(products, {
    fields: [bundleItems.bundleId],
    references: [products.id],
    relationName: 'bundleComponents',
  }),
  product: one(products, {
    fields: [bundleItems.productId],
    references: [products.id],
  }),
}))

// ==========================================
// 5. NPCs (CLIENTES)
// ==========================================
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  totalSpent: decimal('total_spent', { precision: 10, scale: 0 }).default('0'),
  ordersCount: integer('orders_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
})

// ==========================================
// 6. MISIONES (PEDIDOS)
// ==========================================
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }).unique().notNull(),
  customerId: integer('customer_id')
    .references(() => customers.id)
    .notNull(),

  // ESTADOS DEL JUEGO
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  paymentStatus: varchar('payment_status', { length: 50 })
    .notNull()
    .default('unpaid'),
  paymentMethod: varchar('payment_method', { length: 50 }),

  // MATEMÁTICAS
  subtotal: decimal('subtotal', { precision: 10, scale: 0 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 0 }).default('0'),
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 0 }).default(
    '0',
  ),
  total: decimal('total', { precision: 10, scale: 0 }).notNull(),

  // LOGÍSTICA
  shippingAddress: text('shipping_address').notNull(),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  courier: varchar('courier', { length: 50 }),
  customerNotes: text('customer_notes'),
  internalNotes: text('internal_notes'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ==========================================
// 7. LOOT DEL PEDIDO (QUÉ COMPRARON)
// ==========================================
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),

  // PROTECCIÓN CRÍTICA: Si borras el producto físico, el recibo mantiene un NULL y no explota
  productId: integer('product_id').references(() => products.id, {
    onDelete: 'set null',
  }),

  productName: varchar('product_name', { length: 255 }).notNull(),
  priceAtTime: decimal('price_at_time', { precision: 10, scale: 0 }).notNull(),
  quantity: integer('quantity').notNull(),
  packRecipe: jsonb('pack_recipe'),
})

// ==========================================
// 8. RELACIONES DEL SISTEMA DE VENTAS
// ==========================================
export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}))
