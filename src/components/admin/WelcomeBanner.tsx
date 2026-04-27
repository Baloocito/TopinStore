'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function WelcomeBanner() {
  const containerRef = useRef<HTMLDivElement>(null)

  // MOTOR DE FÍSICAS: Definimos nuestras 3 pelotas iniciales
  const ballsRef = useRef([
    // Esfera Rosa Grande
    {
      id: 1,
      x: 20,
      y: 20,
      vx: 2.5,
      vy: 2,
      size: 160,
      color: 'bg-toon-pink opacity-80',
      bounce: 0.6,
    },
    // Esfera Amarilla
    {
      id: 2,
      x: 250,
      y: 60,
      vx: -2,
      vy: 2.5,
      size: 96,
      color: 'bg-toon-yellow opacity-80',
      bounce: 0.7,
    },
    // Mini Esfera Blanca
    {
      id: 3,
      x: 150,
      y: 150,
      vx: 3,
      vy: -2,
      size: 48,
      color: 'bg-white opacity-20',
      bounce: 0.8,
    },
  ])

  // Estado solo para renderizar visualmente las coordenadas calcualdas
  const [positions, setPositions] = useState(ballsRef.current)

  useEffect(() => {
    let animationFrameId: number
    let gravity = { x: 0, y: 0 }
    let hasGyro = false

    // 1. ESCUCHAR EL GIROSCOPIO
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Si el dispositivo envía datos reales (es un celular)
      if (e.gamma !== null && e.beta !== null) {
        hasGyro = true
        // Convertimos los grados de inclinación a fuerza G
        gravity.x = Math.max(-1, Math.min(1, e.gamma / 45)) * 0.8
        // Restamos 40 a beta porque solemos sostener el celular inclinado, no plano
        gravity.y = Math.max(-1, Math.min(1, (e.beta - 40) / 45)) * 0.8
      }
    }

    window.addEventListener('deviceorientation', handleOrientation)

    // 2. EL BUCLE INFINITO DE FÍSICAS (60 FPS)
    const updatePhysics = () => {
      if (!containerRef.current) return

      const { clientWidth: width, clientHeight: height } = containerRef.current
      const balls = ballsRef.current

      balls.forEach((ball) => {
        // APLICAR FUERZAS
        if (hasGyro) {
          // Modo Gravedad Activa (Celular)
          ball.vx += gravity.x
          ball.vy += gravity.y
          // Fricción del aire y del suelo
          ball.vx *= 0.98
          ball.vy *= 0.98
        } else {
          // Modo Gravedad Cero (Escritorio)
          // Sistema para que nunca pierdan velocidad y floten siempre
          const speed = Math.hypot(ball.vx, ball.vy)
          if (speed < 2) {
            ball.vx *= 1.05
            ball.vy *= 1.05
          }
        }

        // Mover la pelota
        ball.x += ball.vx
        ball.y += ball.vy

        // COLISIONES CON LAS PAREDES (Rebote)
        // Pared Izquierda
        if (ball.x <= 0) {
          ball.x = 0
          ball.vx *= -ball.bounce
        }
        // Pared Derecha
        else if (ball.x + ball.size >= width) {
          ball.x = width - ball.size
          ball.vx *= -ball.bounce
        }

        // Techo
        if (ball.y <= 0) {
          ball.y = 0
          ball.vy *= -ball.bounce
        }
        // Suelo
        else if (ball.y + ball.size >= height) {
          ball.y = height - ball.size
          ball.vy *= -ball.bounce
        }
      })

      // Clonamos el array para forzar el re-render en React
      setPositions([...balls])
      animationFrameId = requestAnimationFrame(updatePhysics)
    }

    // Iniciar el motor
    animationFrameId = requestAnimationFrame(updatePhysics)

    // Apagar el motor si salimos de la página
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="bg-toon-blue text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 border-4 border-toon-border shadow-[8px_8px_0px_0px_rgba(30,30,30,1)] relative overflow-hidden"
    >
      {/* =======================================================
          NUESTRAS PELOTAS CON FÍSICA APLICADA
          ======================================================= */}
      {positions.map((ball) => (
        <div
          key={ball.id}
          className={cn(
            'absolute border-4 border-toon-border rounded-full pointer-events-none will-change-transform',
            ball.color,
          )}
          style={{
            width: ball.size,
            height: ball.size,
            // translate3d activa la aceleración por hardware (GPU) para que corra a 60 FPS fijos
            transform: `translate3d(${ball.x}px, ${ball.y}px, 0)`,
          }}
        />
      ))}

      {/* CONTENIDO DEL BANNER (Con z-index alto para estar sobre las pelotas) */}
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

      {/* BOTÓN DE ACCIÓN (pointer-events-auto para que se pueda clickear) */}
      <div className="relative z-10 flex gap-3 w-full md:w-auto mt-2 md:mt-0 pointer-events-auto">
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
