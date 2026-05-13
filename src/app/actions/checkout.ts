'use server'

import { db } from '@/db'
import { orders, orderItems, customers, products } from '@/db/schema'
import { eq, sql, inArray } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { MercadoPagoConfig, Preference } from 'mercadopago'

// Iniciamos el cliente de forma segura
const mpToken = process.env.MP_ACCESS_TOKEN
let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
// Limpiamos la URL por si tiene un slash final
if (siteUrl.endsWith('/')) siteUrl = siteUrl.slice(0, -1)

const client = new MercadoPagoConfig({
  accessToken: mpToken || '',
  options: { timeout: 10000 },
})

type ActionResponse =
  | { success: true; orderNumber: string; orderId: number; initPoint: string }
  | { success: false; message: string }

export async function createOrderAction(
  formData: any,
  cartItems: any[],
): Promise<ActionResponse> {
  try {
    // 🛑 1. VALIDACIÓN DE TOKEN BANCARIO
    if (!mpToken) {
      console.error('CRÍTICO: No hay MP_ACCESS_TOKEN en el .env.local')
      return { success: false, message: 'Falta la llave secreta del banco.' }
    }

    if (!cartItems || cartItems.length === 0) {
      return { success: false, message: 'La mochila está vacía.' }
    }

    // 🛡️ 2. EL ESCUDO ANTI-HACKERS: Extraer IDs y buscar la VERDAD en la Base de Datos
    const productIds = cartItems.map((item) => item.productId)
    const realProductsDB = await db.query.products.findMany({
      where: inArray(products.id, productIds),
    })

    // Variable para calcular el TOTAL REAL, no el del cliente
    let realTotal = 0
    const validatedItems = []

    for (const item of cartItems) {
      // Buscamos el producto real en la DB
      const dbProduct = realProductsDB.find((p) => p.id === item.productId)

      // Validaciones de seguridad
      if (!dbProduct) {
        return {
          success: false,
          message: `El producto ${item.name} ya no existe en el Gremio.`,
        }
      }
      if (dbProduct.stock < item.quantity) {
        return {
          success: false,
          message: `No hay stock suficiente de ${dbProduct.name}. Solo quedan ${dbProduct.stock}.`,
        }
      }

      // 🛠️ EL PARCHE: Convertimos explícitamente a número para evitar que TypeScript llore
      // y prevenir que Drizzle nos pase un string matemático.
      const realPrice = Number(dbProduct.price)
      const quantity = Number(item.quantity)

      // Sumamos usando el PRECIO REAL de la base de datos
      realTotal += realPrice * quantity

      // Guardamos el item validado para procesarlo después
      validatedItems.push({
        ...item,
        realPrice: realPrice, // Forzamos el precio de la DB ya como número
        realName: dbProduct.name,
      })
    }

    // 🛡️ 3. OPERACIONES DE BASE DE DATOS (Secuenciales)

    // A. Manejar al Cliente
    let customer = await db.query.customers.findFirst({
      where: eq(customers.email, formData.email),
    })

    if (!customer) {
      const insertedCustomers = await db
        .insert(customers)
        .values({
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
        })
        .returning()
      customer = insertedCustomers[0]
    }

    // B. Crear la Orden (Usando el realTotal validado)
    const generatedOrderNumber = `TOPIN-${nanoid(6).toUpperCase()}`

    // ⏱️ Calculamos la hora de expiración (Ahora + 30 minutos)
    const expirationTime = new Date(Date.now() + 30 * 60 * 1000)

    const [insertedOrder] = await db
      .insert(orders)
      .values({
        orderNumber: generatedOrderNumber,
        customerId: customer.id,
        status: 'pending',
        paymentStatus: 'unpaid',
        subtotal: realTotal.toString(),
        total: realTotal.toString(),
        shippingAddress: formData,
      })
      .returning()

    // C. Insertar Items y Preparar Mercado Pago
    const preparedMpItems = []

    for (const item of validatedItems) {
      // Guardar Item en la orden
      await db.insert(orderItems).values({
        orderId: insertedOrder.id,
        productId: item.productId,
        productName: item.realName, // Usamos nombre real
        priceAtTime: item.realPrice.toString(), // Usamos precio real
        quantity: item.quantity,
        packRecipe: item.packConfig || null,
      })

      // Actualizar Stock del producto (De forma atómica matemática)
      await db
        .update(products)
        .set({
          stock: sql`${products.stock} - ${item.quantity}`,
          salesCount: sql`${products.salesCount} + ${item.quantity}`,
        })
        .where(eq(products.id, item.productId))

      // Empaquetar para Mercado Pago (Con precio real)
      preparedMpItems.push({
        id: item.productId.toString(),
        title: item.realName,
        quantity: item.quantity,
        unit_price: Number(item.realPrice),
        currency_id: 'CLP', // Oro chileno
      })
    }

    // 🚀 4. LLAMADA A MERCADO PAGO
    try {
      // Armamos URLs dinámicas usando la variable de entorno
      const successUrl = `${siteUrl}/checkout/success?order=${generatedOrderNumber}`
      const failureUrl = `${siteUrl}/checkout/error`
      const pendingUrl = `${siteUrl}/checkout/pending`

      const preferenceBody = {
        items: preparedMpItems,
        payer: {
          name: formData.name,
          email: formData.email,
        },
        back_urls: {
          success: `${siteUrl}/checkout/success`,
          failure: `${siteUrl}/checkout/error`,
          pending: `${siteUrl}/checkout/pending`,
        },
        auto_return: 'approved', // Esto hace que si es exitoso, los mande a Success solo
        external_reference: insertedOrder.id.toString(),
      }

      const preference = new Preference(client)
      const mpResponse = await preference.create({ body: preferenceBody })

      if (!mpResponse.init_point) {
        throw new Error('La API de Mercado Pago no devolvió la URL de pago.')
      }

      return {
        success: true,
        orderNumber: generatedOrderNumber,
        orderId: insertedOrder.id,
        initPoint: mpResponse.init_point,
      }
    } catch (mpError: any) {
      console.error('🔥 ERROR DE MERCADO PAGO 🔥', mpError.message || mpError)
      return {
        success: false,
        message: 'Fallo al generar el link de pago con Mercado Pago.',
      }
    }
  } catch (error) {
    console.error('Error interno de la forja:', error)
    return {
      success: false,
      message: 'Fallo al guardar la orden. Revisa el stock.',
    }
  }
}
