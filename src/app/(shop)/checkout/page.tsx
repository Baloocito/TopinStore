'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { ShieldCheck, Truck, MapPin, User, Package, Coins } from 'lucide-react'
import { toast } from 'sonner'
import { createOrderAction } from '@/app/actions/checkout'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // ESTADO DEL FORMULARIO
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    depto: '',
    comuna: '',
    region: 'RM',
    documentType: 'boleta', // boleta o factura
    rut: '', // Obligatorio para factura, opcional para boleta
  })

  // Evitar error de hidratación
  useEffect(() => setIsMounted(true), [])

  // Si la mochila está vacía, no tiene sentido estar aquí
  if (isMounted && items.length === 0) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-3xl font-black uppercase text-toon-border">
          Tu mochila está vacía
        </h2>
        <p className="text-gray-500 font-bold mb-6">
          Regresa a la tienda para recolectar botín.
        </p>
        <button
          onClick={() => router.push('/explore')}
          className="bg-toon-yellow border-3 border-toon-border px-6 py-2 rounded-xl font-black uppercase text-sm shadow-toon"
        >
          Volver al Gremio
        </button>
      </div>
    )
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // EL MOTOR DE PAGO
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (formData.documentType === 'factura' && formData.rut.length < 8) {
      toast.error('Debes ingresar un RUT válido para la factura.')
      setIsSubmitting(false)
      return
    }

    try {
      const result = await createOrderAction(formData, items)

      if (result.success) {
        toast.success('¡Orden Forjada! Redirigiendo al portal de pago...')

        clearCart() // Vaciamos la mochila porque la orden ya existe en la DB

        // 🚀 AQUÍ ESTÁ LA MAGIA: Lo empujamos a Mercado Pago
        window.location.href = result.initPoint
      } else {
        toast.error(result.message)
        setIsSubmitting(false)
      }
    } catch (error) {
      toast.error('Los servidores del gremio están caídos. Intenta de nuevo.')
      setIsSubmitting(false)
    }
  }

  if (!isMounted) return null

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="font-black text-4xl md:text-5xl uppercase tracking-tighter text-toon-border flex items-center gap-3">
          <Truck className="text-toon-pink" size={40} /> Envío y Pago
        </h1>
        <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">
          Asegura tu botín antes de que otros aventureros se lo lleven.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="lg:col-span-2 space-y-6">
          <form
            id="checkout-form"
            onSubmit={handleSubmit}
            className="bg-white border-4 border-toon-border rounded-3xl p-6 md:p-8 shadow-toon space-y-8"
          >
            {/* SECCIÓN: DATOS DEL AVENTURERO */}
            <section>
              <h2 className="font-black text-xl uppercase flex items-center gap-2 mb-4 border-b-4 border-toon-border/10 pb-2">
                <User size={20} /> 1. Datos del Aventurero
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-black text-[10px] uppercase text-gray-500">
                    Nombre Completo
                  </label>
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    type="text"
                    className="w-full border-3 border-toon-border bg-slate-50 rounded-xl px-4 py-2 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-toon-yellow/30 transition-all"
                    placeholder="Ej: Goku Pérez"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-[10px] uppercase text-gray-500">
                    Correo Mágico
                  </label>
                  <input
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    className="w-full border-3 border-toon-border bg-slate-50 rounded-xl px-4 py-2 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-toon-yellow/30"
                    placeholder="goku@capsulecorp.com"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="font-black text-[10px] uppercase text-gray-500">
                    Teléfono (Para el Courier)
                  </label>
                  <input
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    type="tel"
                    className="w-full border-3 border-toon-border bg-slate-50 rounded-xl px-4 py-2 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-toon-yellow/30"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>
            </section>

            {/* SECCIÓN: DESTINO DEL BOTÍN */}
            <section>
              <h2 className="font-black text-xl uppercase flex items-center gap-2 mb-4 border-b-4 border-toon-border/10 pb-2">
                <MapPin size={20} /> 2. Destino del Botín
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="font-black text-[10px] uppercase text-gray-500">
                    Calle y Número
                  </label>
                  <input
                    required
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    type="text"
                    className="w-full border-3 border-toon-border bg-slate-50 rounded-xl px-4 py-2 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-toon-yellow/30"
                    placeholder="Av. Principal 123"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-[10px] uppercase text-gray-500">
                    Depto / Casa (Opcional)
                  </label>
                  <input
                    name="depto"
                    value={formData.depto}
                    onChange={handleChange}
                    type="text"
                    className="w-full border-3 border-toon-border bg-slate-50 rounded-xl px-4 py-2 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-toon-yellow/30"
                    placeholder="Depto 4B"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-[10px] uppercase text-gray-500">
                    Comuna
                  </label>
                  <input
                    required
                    name="comuna"
                    value={formData.comuna}
                    onChange={handleChange}
                    type="text"
                    className="w-full border-3 border-toon-border bg-slate-50 rounded-xl px-4 py-2 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-toon-yellow/30"
                    placeholder="Ej: Santiago Centro"
                  />
                </div>
              </div>
            </section>

            {/* SECCIÓN: IMPUESTOS DEL REINO */}
            <section>
              <h2 className="font-black text-xl uppercase flex items-center gap-2 mb-4 border-b-4 border-toon-border/10 pb-2">
                <ShieldCheck size={20} /> 3. Documento del Reino
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold bg-slate-50 border-3 border-toon-border p-3 rounded-xl flex-1 hover:bg-white">
                    <input
                      type="radio"
                      name="documentType"
                      value="boleta"
                      checked={formData.documentType === 'boleta'}
                      onChange={handleChange}
                      className="w-4 h-4 accent-toon-pink"
                    />
                    Boleta Electrónica
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold bg-slate-50 border-3 border-toon-border p-3 rounded-xl flex-1 hover:bg-white">
                    <input
                      type="radio"
                      name="documentType"
                      value="factura"
                      checked={formData.documentType === 'factura'}
                      onChange={handleChange}
                      className="w-4 h-4 accent-toon-pink"
                    />
                    Factura (Empresas)
                  </label>
                </div>

                {formData.documentType === 'factura' && (
                  <div className="space-y-1 animate-in slide-in-from-top-2">
                    <label className="font-black text-[10px] uppercase text-toon-red">
                      RUT Empresa (Sin puntos, con guión)
                    </label>
                    <input
                      required
                      name="rut"
                      value={formData.rut}
                      onChange={handleChange}
                      type="text"
                      className="w-full border-3 border-toon-red bg-red-50 rounded-xl px-4 py-2 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-toon-red/30"
                      placeholder="76123456-K"
                    />
                  </div>
                )}
              </div>
            </section>
          </form>
        </div>

        {/* COLUMNA DERECHA: RESUMEN Y BOTÓN DE PAGO */}
        <div className="space-y-6">
          <div className="bg-toon-yellow border-4 border-toon-border rounded-3xl p-6 shadow-toon sticky top-24">
            <h3 className="font-black text-2xl uppercase flex items-center gap-2 mb-4 border-b-4 border-toon-border/20 pb-2">
              <Package size={24} /> Resumen
            </h3>

            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex justify-between items-center bg-white/50 border-2 border-toon-border p-2 rounded-xl"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-black bg-white border-2 border-toon-border px-1.5 rounded text-xs">
                      {item.quantity}x
                    </span>
                    <span className="font-bold text-sm truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-black text-sm shrink-0">
                    ${(item.price * item.quantity).toLocaleString('es-CL')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t-4 border-dashed border-toon-border/30 pt-4 mb-6">
              <div className="flex justify-between items-center text-gray-600 font-bold mb-1">
                <span>Subtotal</span>
                <span>${getTotal().toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 font-bold">
                <span>Envío</span>
                <span className="text-toon-red italic">
                  Por pagar al recibir
                </span>
              </div>
              <div className="flex justify-between items-end mt-4">
                <span className="font-black text-lg uppercase">Total</span>
                <span className="font-black text-4xl drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)] leading-none">
                  ${getTotal().toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            <button
              form="checkout-form"
              disabled={isSubmitting}
              className="w-full bg-toon-lime border-4 border-toon-border font-black text-xl uppercase py-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-400 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
            >
              {isSubmitting ? 'Forjando Orden...' : 'Pagar Ahora'}{' '}
              <Coins strokeWidth={3} />
            </button>
            <p className="text-center text-[10px] font-black uppercase text-gray-500 mt-3 flex justify-center items-center gap-1">
              <ShieldCheck size={12} /> Serás redirigido a Mercado Pago
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
