'use client'

import { useState } from 'react'
import { UploadDropzone } from '@/lib/uploadthing'
import { createProduct } from '@/lib/actions'

interface Category {
  id: number
  name: string
}

export default function NewProductForm({
  categories,
}: {
  categories: Category[]
}) {
  const [imageUrls, setImageUrls] = useState<string[]>([])

  return (
    <form
      action={createProduct}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {/* Nombre */}
      <div className="flex flex-col space-y-2">
        <label className="font-black uppercase text-sm">
          Nombre del Tesoro
        </label>
        <input
          name="name"
          required
          className="border-3 border-toon-border p-3 rounded-xl font-bold"
          placeholder="Ej: Estuche Totoro..."
        />
      </div>

      {/* SKU */}
      <div className="flex flex-col space-y-2">
        <label className="font-black uppercase text-sm">SKU</label>
        <input
          name="sku"
          required
          className="border-3 border-toon-border p-3 rounded-xl font-bold uppercase"
          placeholder="KAW-001"
        />
      </div>

      {/* Precio */}
      <div className="flex flex-col space-y-2">
        <label className="font-black uppercase text-sm">Precio (CLP)</label>
        <input
          name="price"
          type="number"
          required
          className="border-3 border-toon-border p-3 rounded-xl font-bold"
        />
      </div>

      {/* Stock */}
      <div className="flex flex-col space-y-2">
        <label className="font-black uppercase text-sm">Stock Inicial</label>
        <input
          name="stock"
          type="number"
          required
          className="border-3 border-toon-border p-3 rounded-xl font-bold"
        />
      </div>

      {/* Categoría */}
      <div className="flex flex-col space-y-2 md:col-span-2">
        <label className="font-black uppercase text-sm">Categoría</label>
        <select
          name="categoryId"
          className="border-3 border-toon-border p-3 rounded-xl font-bold bg-white"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* IMÁGENES */}
      <div className="flex flex-col space-y-2 md:col-span-2">
        <label className="font-black uppercase text-sm">
          Fotos del Producto ✨
        </label>

        <UploadDropzone
          endpoint="productImage"
          onUploadBegin={(name) => {
            console.log('🚀 Iniciando subida de:', name)
          }}
          onClientUploadComplete={(res) => {
            console.log('✅ UploadThing respondió:', res) // AQUÍ VEREMOS LA URL
            if (res && res.length > 0) {
              const urls = res.map((f) => f.url)
              setImageUrls(urls)
              console.log('🔗 URLs guardadas en el estado:', urls)
            }
          }}
          onUploadError={(error: Error) => {
            // ESTO ES LO QUE BUSCAMOS
            console.error('❌ ERROR DETECTADO EN UPLOADTHING:', error.message)
            console.error('Detalles del error:', error)
            alert(`Error de subida: ${error.message}`)
          }}
          className="border-4 border-dashed border-toon-border bg-slate-50 
                     ut-button:bg-toon-pink 
                     ut-label:text-toon-border 
                     ut-label:font-black"
        />

        {/* Input oculto para server action */}
        <input type="hidden" name="images" value={imageUrls.join(',')} />

        {/* Preview mejorado */}
        <div className="flex gap-4 mt-6 overflow-x-auto p-2">
          {imageUrls.length > 0 ? (
            imageUrls.map((url, i) => (
              <div
                key={i}
                className="border-4 border-toon-border rounded-xl overflow-hidden w-24 h-24 shadow-toon"
              >
                <img
                  src={url}
                  alt="Previa"
                  className="w-full h-full object-cover"
                />
              </div>
            ))
          ) : (
            <p className="text-gray-400 italic text-sm">
              Esperando subida de imágenes...
            </p>
          )}
        </div>
      </div>

      {/* Descripción */}
      <div className="flex flex-col space-y-2 md:col-span-2">
        <label className="font-black uppercase text-sm">Descripción</label>
        <textarea
          name="description"
          className="border-3 border-toon-border p-3 rounded-xl font-bold h-32"
        />
      </div>

      <button
        type="submit"
        className="md:col-span-2 bg-toon-yellow border-4 border-toon-border py-4 rounded-2xl font-black text-xl shadow-toon hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
      >
        GUARDAR PRODUCTO 🚀
      </button>
    </form>
  )
}
