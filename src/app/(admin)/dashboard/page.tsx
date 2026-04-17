import { db } from '@/db'
import NewProductForm from '@/components/admin/NewProductForm'

export default async function AdminDashboard() {
  // Fetch de categorías en el servidor (Rápido y Seguro)
  const categories = await db.query.categories.findMany()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white border-4 border-toon-border p-8 rounded-3xl shadow-toon">
        <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter">
          Nuevo Producto ✨
        </h2>

        {/* Llamamos al componente de cliente pasándole las categorías */}
        <NewProductForm categories={categories} />
      </div>
    </div>
  )
}
