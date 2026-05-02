'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Star, Swords } from 'lucide-react'
import { cn } from '@/lib/utils'

// Ahora el banner recibe datos reales del servidor
export default function WelcomeBanner({
  pendingMissions = 0,
}: {
  pendingMissions?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  // MOTOR DE FÍSICAS (Se mantiene intacto, es oro puro)
  const ballsRef = useRef([
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

  const [positions, setPositions] = useState(ballsRef.current)

  useEffect(() => {
    let animationFrameId: number
    let gravity = { x: 0, y: 0 }
    let hasGyro = false

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        hasGyro = true
        gravity.x = Math.max(-1, Math.min(1, e.gamma / 45)) * 0.8
        gravity.y = Math.max(-1, Math.min(1, (e.beta - 40) / 45)) * 0.8
      }
    }

    window.addEventListener('deviceorientation', handleOrientation)

    const updatePhysics = () => {
      if (!containerRef.current) return
      const { clientWidth: width, clientHeight: height } = containerRef.current
      const balls = ballsRef.current

      balls.forEach((ball) => {
        if (hasGyro) {
          ball.vx += gravity.x
          ball.vy += gravity.y
          ball.vx *= 0.98
          ball.vy *= 0.98
        } else {
          const speed = Math.hypot(ball.vx, ball.vy)
          if (speed < 2) {
            ball.vx *= 1.05
            ball.vy *= 1.05
          }
        }

        ball.x += ball.vx
        ball.y += ball.vy

        if (ball.x <= 0) {
          ball.x = 0
          ball.vx *= -ball.bounce
        } else if (ball.x + ball.size >= width) {
          ball.x = width - ball.size
          ball.vx *= -ball.bounce
        }
        if (ball.y <= 0) {
          ball.y = 0
          ball.vy *= -ball.bounce
        } else if (ball.y + ball.size >= height) {
          ball.y = height - ball.size
          ball.vy *= -ball.bounce
        }
      })

      setPositions([...balls])
      animationFrameId = requestAnimationFrame(updatePhysics)
    }

    animationFrameId = requestAnimationFrame(updatePhysics)
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="bg-toon-blue text-white rounded-3xl p-6 md:p-8 flex flex-col xl:flex-row justify-between items-center gap-6 border-4 border-toon-border shadow-[8px_8px_0px_0px_rgba(30,30,30,1)] relative overflow-hidden"
    >
      {positions.map((ball) => (
        <div
          key={ball.id}
          className={cn(
            'absolute top-0 left-0 border-4 border-toon-border rounded-full pointer-events-none will-change-transform',
            ball.color,
          )}
          style={{
            width: ball.size,
            height: ball.size,
            transform: `translate3d(${ball.x}px, ${ball.y}px, 0)`,
          }}
        />
      ))}

      <div className="relative z-10 space-y-4 text-center xl:text-left pointer-events-none w-full xl:w-auto">
        <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border-3 border-toon-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <Star
            size={16}
            className="text-toon-yellow fill-toon-yellow drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"
          />
          <span className="font-black text-[10px] uppercase tracking-widest text-toon-border">
            Nivel de Tienda: Épico
          </span>
        </div>

        <h2 className="font-black text-4xl md:text-5xl uppercase tracking-tighter drop-shadow-[2px_2px_0px_rgba(30,30,30,1)]">
          ¡Hola de nuevo, <br className="hidden xl:block" />
          <span className="text-toon-yellow drop-shadow-[3px_3px_0px_rgba(30,30,30,1)]">
            Eusebio
          </span>
          !
        </h2>

        <p className="font-bold text-sm md:text-base text-white drop-shadow-[1px_1px_0px_rgba(30,30,30,1)] max-w-lg leading-relaxed mx-auto xl:mx-0">
          Tus tesoros están arrasando en el mercado. Tienes{' '}
          <span className="inline-block bg-toon-pink text-white px-2 py-0.5 border-2 border-toon-border rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-2 mx-1">
            {pendingMissions} misiones
          </span>{' '}
          nuevas esperando ser completadas. ¡Equípate y dale con todo!
        </p>
      </div>

      {/* LOS NUEVOS BOTONES APILADOS PARA MÓVIL */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full xl:w-auto mt-2 xl:mt-0 pointer-events-auto">
        <Link
          href="/dashboard/orders"
          className="flex-1 px-6 py-4 bg-white border-4 border-toon-border rounded-xl font-black text-toon-border text-sm md:text-base uppercase hover:bg-slate-100 transition-colors text-center shadow-[6px_6px_0px_0px_rgba(30,30,30,1)] active:shadow-none active:translate-y-1.5 active:translate-x-1.5 flex items-center justify-center gap-2"
        >
          <Swords size={20} strokeWidth={3} /> VER MISIONES
        </Link>
        <Link
          href="/dashboard/products?new=true"
          className="flex-1 px-6 py-4 bg-toon-lime border-4 border-toon-border rounded-xl font-black text-toon-border text-sm md:text-base uppercase hover:bg-green-400 transition-colors text-center shadow-[6px_6px_0px_0px_rgba(30,30,30,1)] active:shadow-none active:translate-y-1.5 active:translate-x-1.5"
        >
          + FORJAR TESORO
        </Link>
      </div>
    </div>
  )
}
