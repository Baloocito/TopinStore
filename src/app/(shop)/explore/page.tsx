import { getProducts, getCategories } from '@/lib/data'
import ExploreClient from '@/components/store/ExploreClient'

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const resolvedParams = await searchParams
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ])

  return (
    <div className="max-w-7xl mx-auto space-y-10 pt-6">
      <header className="px-2">
        <h1 className="font-black text-4xl md:text-6xl uppercase tracking-tighter text-toon-border leading-none">
          Explorar el Gremio
        </h1>
        <p className="font-bold text-gray-500 uppercase tracking-widest text-xs md:text-sm mt-2">
          Encuentra el equipamiento perfecto para tu aventura
        </p>
      </header>

      <ExploreClient
        initialProducts={products}
        categories={categories}
        initialCategory={resolvedParams.category}
      />
    </div>
  )
}
