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

// 1. CATEGORÍAS
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(), // ej: 'kawaii', 'feria'
})

// 2. PRODUCTOS PRINCIPALES
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  sku: varchar('sku', { length: 50 }).unique().notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  images: text('images').array().notNull().default([]),
  specs: jsonb('specs').default([]),
  categoryId: integer('category_id').references(() => categories.id),
  type: varchar('type', { length: 20 }).notNull().default('simple'), // 'simple' o 'pack'
  stock: integer('stock').notNull().default(0),
  price: decimal('price', { precision: 10, scale: 0 }).notNull(), // Scale 0 para pesos chilenos
  isAvailable: boolean('is_available').default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

// 3. TABLA INTERMEDIA PARA LOS PACKS (El "Estuche Armado")
export const bundleItems = pgTable('bundle_items', {
  id: serial('id').primaryKey(),
  bundleId: integer('bundle_id')
    .references(() => products.id)
    .notNull(), // ID del Estuche
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(), // ID del Lápiz
  quantity: integer('quantity').notNull().default(1),
})

// 4. RELACIONES (Para que Typescript entienda cómo se conectan)
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  bundleComponents: many(bundleItems, { relationName: 'bundleComponents' }), // Lo que compone al pack
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
