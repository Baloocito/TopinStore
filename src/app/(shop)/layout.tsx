import { getCategories } from '@/lib/data'
import ShopLayoutClient from '@/components/store/ShopLayoutClient'

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ⚔️ Obtenemos los datos en el servidor (Cero errores de montaje)
  const categories = await getCategories()

  return <ShopLayoutClient categories={categories}>{children}</ShopLayoutClient>
}
