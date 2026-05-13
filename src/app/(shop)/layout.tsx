import { getCategories } from '@/lib/data'
import ShopLayoutClient from '@/components/store/ShopLayoutClient'
import Footer from '@/components/store/Footer' // 🔥 Importamos el Footer

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ⚔️ Obtenemos los datos en el servidor (Cero errores de montaje)
  const categories = await getCategories()

  return (
    <div className="flex flex-col min-h-screen">
      {/* Envolvemos el ShopLayoutClient y el Footer en un flex column
        para asegurar que el Footer siempre se empuje hasta abajo 
      */}
      <div className="flex-1">
        <ShopLayoutClient categories={categories}>{children}</ShopLayoutClient>
      </div>

      {/* 🔥 Renderizamos el Footer al final */}
      <Footer />
    </div>
  )
}
