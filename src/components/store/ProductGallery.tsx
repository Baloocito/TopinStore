'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProductGallery({
  images,
  type,
  name,
}: {
  images: string[]
  type: string
  name: string
}) {
  const [mainImage, setMainImage] = useState(images?.[0] || null)

  return (
    <div className="w-full md:w-1/2 flex flex-col gap-4">
      {/* IMAGEN PRINCIPAL */}
      <div className="aspect-square bg-slate-50 border-4 border-toon-border rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
        {mainImage ? (
          <img
            src={mainImage}
            alt={name}
            className="w-full h-full object-cover animate-in fade-in duration-300"
            key={mainImage} // Fuerza la animación al cambiar la foto
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">
            📦
          </div>
        )}

        {/* Tag Flotante */}
        <div className="absolute top-4 left-4 bg-toon-yellow border-2 border-toon-border px-3 py-1 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black text-xs uppercase flex items-center gap-1">
          <Star size={14} className="fill-toon-border text-toon-border" />
          {type === 'pack' ? 'Pack Dinámico' : 'Ítem Único'}
        </div>
      </div>

      {/* MINIATURAS (CARRUSEL) */}
      {images && images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1">
          {images.map((img: string, i: number) => (
            <div
              key={i}
              onClick={() => setMainImage(img)}
              className={cn(
                'w-20 h-20 shrink-0 border-3 rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1',
                mainImage === img
                  ? 'border-toon-pink shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] scale-105'
                  : 'border-toon-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-60 hover:opacity-100',
              )}
            >
              <img
                src={img}
                alt={`Vista ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
