'use client'

import { Search } from 'lucide-react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export default function ProductSearch() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams)

    if (term) {
      params.set('q', term) // Agrega ?q=lo-que-escribas
    } else {
      params.delete('q') // Limpia la URL si borras el texto
    }

    // Reemplaza la URL sin recargar la página
    replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative flex-1">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        size={18}
      />
      <input
        type="text"
        placeholder="Buscar por SKU o nombre..."
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('q')?.toString()}
        className="w-full pl-10 pr-4 py-3 border-3 border-toon-border rounded-xl font-bold focus:ring-4 ring-toon-yellow outline-none transition-all text-sm md:text-base"
      />
    </div>
  )
}
