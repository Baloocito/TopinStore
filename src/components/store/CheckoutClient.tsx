'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import {
  MapPin,
  User,
  Mail,
  Phone,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Home,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { createOrderAction } from '@/app/actions/checkout'

export default function CheckoutClient() {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  const [isMounted, setIsMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ESTADOS DEL FORMULARIO
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    region: '',
    comuna: '',
    address: '',
    depto: '',
  })

  useEffect(() => {
    setIsMounted(true)
    // Si la mochila está vacía, los devolvemos a la tienda
    if (items.length === 0) {
      router.push('/')
    }
  }, [items, router])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const result = await createOrderAction(formData, items)

    if (result.success) {
      toast.success('¡Orden creada! Redirigiendo al portal de pago...')
      // Aquí redirigirías a la URL de Mercado Pago
      // window.location.href = result.initPoint
      router.push(`/checkout/success?order=${result.orderNumber}`)
      clearCart()
    } else {
      toast.error(result.message)
      setIsSubmitting(false)
    }
  }

  if (!isMounted || items.length === 0) return null

  const total = getTotal()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* ==========================================
          COLUMNA IZQUIERDA: FORMULARIO (8 columnas)
          ========================================== */}
      <div className="lg:col-span-7 space-y-8">
        <div>
          <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter text-toon-border leading-none mb-2">
            Punto de Control
          </h1>
          <p className="font-bold text-gray-500 uppercase tracking-widest text-xs md:text-sm">
            Ingresa tus datos para asegurar el botín
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECCIÓN 1: DATOS DEL AVENTURERO */}
          <div className="bg-white border-4 border-toon-border rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="font-black text-xl uppercase text-toon-border flex items-center gap-2 mb-6 border-b-4 border-toon-border/10 pb-4">
              <User className="text-toon-pink" size={24} strokeWidth={2.5} />
              Identificación (NPC)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block font-black text-xs uppercase text-gray-500 mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="tucorreo@gremio.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-3 border-toon-border rounded-xl font-bold focus:ring-4 ring-toon-pink/30 focus:bg-white outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-xs uppercase text-gray-500 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej. Goku Pérez"
                    className="w-full px-4 py-3 bg-slate-50 border-3 border-toon-border rounded-xl font-bold focus:ring-4 ring-toon-pink/30 focus:bg-white outline-none transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block font-black text-xs uppercase text-gray-500 mb-1">
                    Teléfono (Móvil)
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+56 9 1234 5678"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-3 border-toon-border rounded-xl font-bold focus:ring-4 ring-toon-pink/30 focus:bg-white outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: LOGÍSTICA (DESTINO) */}
          <div className="bg-white border-4 border-toon-border rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="font-black text-xl uppercase text-toon-border flex items-center gap-2 mb-6 border-b-4 border-toon-border/10 pb-4">
              <MapPin className="text-toon-blue" size={24} strokeWidth={2.5} />
              Zona de Envío
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-xs uppercase text-gray-500 mb-1">
                    Región *
                  </label>
                  <select
                    required
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border-3 border-toon-border rounded-xl font-bold focus:ring-4 ring-toon-blue/30 focus:bg-white outline-none transition-all shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Selecciona tu Región
                    </option>
                    <option value="RM">Región Metropolitana</option>
                    <option value="V">Valparaíso</option>
                    <option value="VIII">Biobío</option>
                    {/* Agregar las demás regiones luego */}
                  </select>
                </div>
                <div>
                  <label className="block font-black text-xs uppercase text-gray-500 mb-1">
                    Comuna *
                  </label>
                  <input
                    required
                    type="text"
                    name="comuna"
                    value={formData.comuna}
                    onChange={handleInputChange}
                    placeholder="Ej. Santiago Centro"
                    className="w-full px-4 py-3 bg-slate-50 border-3 border-toon-border rounded-xl font-bold focus:ring-4 ring-toon-blue/30 focus:bg-white outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-black text-xs uppercase text-gray-500 mb-1">
                    Calle y Número *
                  </label>
                  <div className="relative">
                    <Home
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      required
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Av. Principal 123"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-3 border-toon-border rounded-xl font-bold focus:ring-4 ring-toon-blue/30 focus:bg-white outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-black text-xs uppercase text-gray-500 mb-1">
                    Depto / Casa
                  </label>
                  <input
                    type="text"
                    name="depto"
                    value={formData.depto}
                    onChange={handleInputChange}
                    placeholder="Opcional"
                    className="w-full px-4 py-3 bg-slate-50 border-3 border-toon-border rounded-xl font-bold focus:ring-4 ring-toon-blue/30 focus:bg-white outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BOTÓN MÓVIL (Solo se ve en pantallas pequeñas) */}
          <div className="block lg:hidden">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-toon-lime border-4 border-toon-border text-toon-border font-black text-xl uppercase py-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-400 transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 group disabled:opacity-70 disabled:pointer-events-none"
            >
              {isSubmitting ? 'Invocando Portal...' : 'Ir a Pagar'}
              {!isSubmitting && (
                <ArrowRight
                  strokeWidth={3}
                  className="group-hover:translate-x-2 transition-transform"
                />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ==========================================
          COLUMNA DERECHA: RESUMEN DE LA MOCHILA (4 columnas)
          ========================================== */}
      <div className="lg:col-span-5">
        <div className="bg-[#fffdf5] border-4 border-toon-border rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sticky top-28">
          <h2 className="font-black text-xl uppercase text-toon-border flex items-center gap-2 mb-6 border-b-4 border-toon-border/10 pb-4">
            <ShoppingBag
              className="text-toon-yellow fill-toon-yellow text-toon-border"
              size={24}
              strokeWidth={2}
            />
            Resumen del Botín
          </h2>

          <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
            {items.map((item) => (
              <div
                key={item.cartItemId}
                className="flex gap-3 items-center bg-white border-2 border-toon-border p-2 rounded-xl"
              >
                <div className="w-12 h-12 bg-slate-100 border-2 border-toon-border rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '📦'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-xs uppercase text-toon-border truncate">
                    {item.name}
                  </h4>
                  <span className="font-bold text-[10px] text-gray-500">
                    Cant: {item.quantity}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="block font-black text-sm text-toon-lime">
                    ${(item.price * item.quantity).toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t-4 border-dashed border-toon-border/20 space-y-3">
            <div className="flex justify-between items-center font-bold text-gray-500 text-sm">
              <span>Subtotal</span>
              <span>${total.toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-gray-500 text-sm">
              <span>Envío (Calculado después)</span>
              <span>Por Pagar</span>
            </div>
            <div className="flex justify-between items-end pt-2">
              <span className="font-black text-xs uppercase text-gray-400 tracking-widest">
                A Pagar Hoy
              </span>
              <span className="font-black text-3xl text-toon-border">
                ${total.toLocaleString('es-CL')}
              </span>
            </div>
          </div>

          {/* BOTÓN DESKTOP */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="hidden lg:flex w-full mt-6 bg-toon-lime border-4 border-toon-border text-toon-border font-black text-xl uppercase py-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-400 transition-all active:translate-y-1 active:shadow-none items-center justify-center gap-2 group disabled:opacity-70 disabled:pointer-events-none"
          >
            {isSubmitting ? 'Invocando Portal...' : 'Ir a Pagar'}
            {!isSubmitting && (
              <ArrowRight
                strokeWidth={3}
                className="group-hover:translate-x-2 transition-transform"
              />
            )}
          </button>

          <div className="mt-4 flex items-center justify-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
            <ShieldCheck size={14} className="text-toon-lime" /> Transacción
            encriptada y segura
          </div>
        </div>
      </div>
    </div>
  )
}
