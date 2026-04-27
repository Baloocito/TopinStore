'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'

export default function WelcomeBanner() {
  // Estado para guardar la inclinación (X e Y)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // 1. MOTOR PARA ESCRITORIO (Rastreo de Mouse)
    const handleMouseMove = (e: MouseEvent) => {
      // Calculamos la distancia desde el centro de la pantalla
      const x = (window.innerWidth / 2 - e.pageX) / 30
      const y = (window.innerHeight / 2 - e.pageY) / 30
      setTilt({ x, y })
    }

    // 2. MOTOR PARA MÓVIL (Giroscopio)
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!e.gamma || !e.beta) return
      // gamma es la inclinación izquierda/derecha
      // beta es la inclinación adelante/atrás (restamos 40 para simular la forma en que sostienes el teléfono)
      const x = e.gamma / 1.5
      const y = (e.beta - 40) / 1.5

      // Limitamos el movimiento máximo para que las esferas no se salgan del banner
      const clampedX = Math.max(-30, Math.min(30, x))
      const clampedY = Math.max(-30, Math.min(30, y))

      setTilt({ x: -clampedX, y: -clampedY })
    }

    // Encendemos los sensores
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('deviceorientation', handleOrientation)

    return () => {
      // Limpieza al desmontar para no consumir batería
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [])

  return (
    <div className="bg-toon-blue text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 border-4 border-toon-border shadow-[8px_8px_0px_0px_rgba(30,30,30,1)] relative overflow-hidden">
      {/* =======================================================
          ELEMENTOS FLOTANTES INTERACTIVOS (PARALLAX)
          Usamos duration-100 ease-out para que el rebote sea suave
          ======================================================= */}

      {/* Esfera Rosa - Capa Lejana (Se mueve rápido: multiplicador 1.5) */}
      <div
        className="absolute -right-8 -top-8 w-40 h-40 bg-toon-pink border-4 border-toon-border rounded-full opacity-80 transition-transform duration-100 ease-out"
        style={{ transform: `translate(${tilt.x * 1.5}px, ${tilt.y * 1.5}px)` }}
      />

      {/* Esfera Amarilla - Capa Media (Se mueve normal: multiplicador 0.8) */}
      <div
        className="absolute right-24 -bottom-10 w-24 h-24 bg-toon-yellow border-4 border-toon-border rounded-full opacity-80 transition-transform duration-100 ease-out"
        style={{ transform: `translate(${tilt.x * 0.8}px, ${tilt.y * 0.8}px)` }}
      />

      {/* Mini Esfera Blanca - Capa Cercana (Se mueve invertido para efecto 3D total) */}
      <div
        className="absolute left-1/2 top-[-20px] w-12 h-12 bg-white border-4 border-toon-border rounded-full opacity-20 transition-transform duration-100 ease-out"
        style={{
          transform: `translate(${tilt.x * -0.5}px, ${tilt.y * -0.5}px)`,
        }}
      />

      <div className="relative z-10 space-y-4 text-center md:text-left pointer-events-none">
        {/* BADGE DE NIVEL */}
        <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border-3 border-toon-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <Star
            size={16}
            className="text-toon-yellow fill-toon-yellow drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"
          />
          <span className="font-black text-[10px] uppercase tracking-widest text-toon-border">
            Nivel de Tienda: Épico
          </span>
        </div>

        {/* TÍTULO */}
        <h2 className="font-black text-4xl md:text-5xl uppercase tracking-tighter drop-shadow-[2px_2px_0px_rgba(30,30,30,1)]">
          ¡Hola de nuevo, <br className="hidden md:block" />
          <span className="text-toon-yellow drop-shadow-[3px_3px_0px_rgba(30,30,30,1)]">
            Eusebio
          </span>
          !
        </h2>

        {/* TEXTO */}
        <p className="font-bold text-sm md:text-base text-white drop-shadow-[1px_1px_0px_rgba(30,30,30,1)] max-w-lg leading-relaxed">
          Tus tesoros están arrasando en el mercado. Tienes{' '}
          <span className="inline-block bg-toon-pink text-white px-2 py-0.5 border-2 border-toon-border rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-2 mx-1">
            4 misiones
          </span>{' '}
          nuevas esperando ser completadas. ¡Equípate y dale con todo!
        </p>
      </div>

      {/* BOTÓN DE ACCIÓN */}
      <div className="relative z-10 flex gap-3 w-full md:w-auto mt-2 md:mt-0">
        <Link
          href="/dashboard/products?new=true"
          className="flex-1 md:flex-none px-6 py-4 bg-toon-lime border-4 border-toon-border rounded-xl font-black text-toon-border text-sm md:text-base uppercase hover:bg-green-400 transition-colors text-center shadow-[6px_6px_0px_0px_rgba(30,30,30,1)] active:shadow-none active:translate-y-1.5 active:translate-x-1.5"
        >
          + FORJAR TESORO
        </Link>
      </div>
    </div>
  )
}
