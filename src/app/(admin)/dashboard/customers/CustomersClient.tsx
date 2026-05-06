'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import {
  Search,
  Users,
  Receipt,
  Shield,
  Crown,
  Medal,
  User,
  X,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  Copy,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ==========================================
// TIPOS
// ==========================================
export type NPCData = {
  id: number
  name: string
  email: string
  phone: string | null
  totalSpent: string | null
  ordersCount: number | null
  createdAt: Date | null
  orders: any[] // Misiones realizadas
}

// LÓGICA DE RANGOS DEL GREMIO
const getRangoNPC = (oroGastado: number) => {
  if (oroGastado >= 100000)
    return {
      titulo: 'Héroe Ballena',
      color: 'bg-toon-yellow',
      icon: Crown,
      border: 'border-toon-yellow',
    }
  if (oroGastado >= 50000)
    return {
      titulo: 'Aventurero Élite',
      color: 'bg-toon-purple',
      icon: Shield,
      border: 'border-toon-purple',
    }
  if (oroGastado >= 10000)
    return {
      titulo: 'Comprador Frecuente',
      color: 'bg-toon-blue',
      icon: Medal,
      border: 'border-toon-blue',
    }
  return {
    titulo: 'Novato',
    color: 'bg-slate-200',
    icon: User,
    border: 'border-slate-300',
  }
}

export default function CustomersClient({
  initialNPCs,
}: {
  initialNPCs: NPCData[]
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNPC, setSelectedNPC] = useState<NPCData | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Buscador rápido
  const filteredNPCs = initialNPCs.filter(
    (npc) =>
      npc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      npc.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Acciones Rápidas
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${type} copiado al portapapeles`)
  }

  const handleCloseModal = () => {
    setSelectedNPC(null)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* HEADER DEL CÓDICE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border-4 border-toon-border p-6 rounded-3xl shadow-toon">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-toon-purple border-4 border-toon-border rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Users size={28} className="text-white" strokeWidth={3} />
          </div>
          <div>
            <h1 className="font-black text-2xl md:text-3xl uppercase tracking-tighter text-toon-border leading-none">
              Códice de NPCs
            </h1>
            <p className="font-bold text-gray-500 text-xs md:text-sm mt-1 leading-tight">
              "Conoce a los aventureros que financian tu gremio"
            </p>
          </div>
        </div>

        {/* BUSCADOR */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
            strokeWidth={3}
          />
          <input
            type="text"
            placeholder="Buscar aventurero..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-3 border-toon-border rounded-xl font-bold focus:ring-4 ring-toon-purple/30 outline-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>
      </div>

      {/* GRILLA DE TARJETAS DE AVENTURERO */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredNPCs.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-4 border-4 border-dashed border-gray-300 rounded-3xl">
            <Users size={48} />
            <p className="font-black uppercase text-sm">
              No se encontraron aventureros
            </p>
          </div>
        ) : (
          filteredNPCs.map((npc) => {
            const oroGastado = Number(npc.totalSpent) || 0
            const rango = getRangoNPC(oroGastado)
            const IconoRango = rango.icon

            return (
              <div
                key={npc.id}
                onClick={() => setSelectedNPC(npc)}
                className="bg-white border-4 border-toon-border rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50 transition-all flex flex-col h-full group cursor-pointer"
              >
                {/* CABECERA (Nombre y Rango) */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <h2 className="font-black text-xl uppercase text-toon-border truncate group-hover:text-toon-purple transition-colors">
                      {npc.name}
                    </h2>
                    <span className="text-xs font-bold text-gray-400 truncate block">
                      {npc.email}
                    </span>
                  </div>
                  {/* MEDALLA DE RANGO */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={cn(
                        'p-2 border-3 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-toon-border',
                        rango.color,
                        rango.border,
                      )}
                    >
                      <IconoRango size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-tighter mt-1 max-w-[60px] text-center leading-tight">
                      {rango.titulo}
                    </span>
                  </div>
                </div>

                {/* STATS DE COMBATE (Ventas) */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 border-3 border-toon-border rounded-xl p-3 flex flex-col items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:bg-white transition-colors">
                    <span className="text-[9px] font-black uppercase text-gray-500 mb-1 text-center">
                      Misiones Pagadas
                    </span>
                    <div className="flex items-center gap-1 text-toon-blue">
                      <Receipt size={14} strokeWidth={3} />
                      <span className="font-black text-xl leading-none">
                        {npc.ordersCount || 0}
                      </span>
                    </div>
                  </div>
                  <div className="bg-toon-yellow/20 border-3 border-toon-yellow rounded-xl p-3 flex flex-col items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:bg-toon-yellow/40 transition-colors">
                    <span className="text-[9px] font-black uppercase text-toon-yellow mb-1 drop-shadow-sm text-center">
                      Oro Donado
                    </span>
                    <span className="font-black text-xl leading-none text-toon-border">
                      ${oroGastado.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t-4 border-toon-border/10">
                  {/* MISIONES RECIENTES */}
                  {npc.orders && npc.orders.length > 0 ? (
                    <div>
                      <span className="block text-[10px] font-black uppercase text-gray-400 mb-2">
                        Última Misión
                      </span>
                      <div className="flex justify-between items-center bg-slate-100 p-2 border-2 border-slate-300 rounded-lg">
                        <span className="font-bold text-xs text-toon-border">
                          {npc.orders[0].orderNumber}
                        </span>
                        <span className="font-black text-[10px] md:text-xs text-toon-lime uppercase tracking-tighter bg-white px-2 py-0.5 rounded border-2 border-toon-border shadow-sm">
                          {npc.orders[0].status}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                      <span className="text-[10px] font-black uppercase text-gray-400">
                        Sin misiones registradas
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ==========================================
          MODAL: EXPEDIENTE DEL AVENTURERO (CRM)
          ========================================== */}
      {isMounted && selectedOrderModal()}
    </div>
  )

  function selectedOrderModal() {
    if (!selectedNPC) return null

    const oroGastado = Number(selectedNPC.totalSpent) || 0
    const rango = getRangoNPC(oroGastado)
    const IconoRango = rango.icon

    return createPortal(
      <>
        <div
          className="fixed top-0 left-0 w-screen h-[100dvh] bg-toon-border/40 backdrop-blur-sm z-[100] transition-opacity"
          onClick={handleCloseModal}
        />
        <div className="fixed right-0 top-0 h-[100dvh] w-full max-w-xl bg-white border-l-8 border-toon-border z-[110] shadow-[-10px_0px_0px_0px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-300">
          {/* HEADER DEL MODAL */}
          <div
            className={cn(
              'p-6 border-b-4 border-toon-border flex justify-between items-start shrink-0',
              rango.color.replace('bg-', 'bg-').replace('100', '20') ||
                'bg-slate-100',
            )}
          >
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-white border-4 border-toon-border rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <IconoRango
                  size={32}
                  className="text-toon-border"
                  strokeWidth={2.5}
                />
              </div>
              <div>
                <h2 className="font-black text-2xl uppercase tracking-tighter text-toon-border leading-none mb-1">
                  {selectedNPC.name}
                </h2>
                <span className="inline-block bg-toon-border text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] tracking-widest">
                  Rango: {rango.titulo}
                </span>
              </div>
            </div>
            <button
              onClick={handleCloseModal}
              className="p-2 border-3 border-toon-border rounded-xl hover:bg-toon-red shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all bg-white shrink-0 group"
            >
              <X size={20} className="group-hover:text-white" strokeWidth={3} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 no-scrollbar bg-[url('/grid-pattern.svg')]">
            {/* 1. SECCIÓN DE CONTACTO Y ACCIONES */}
            <div className="bg-white border-4 border-toon-border rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <h3 className="font-black text-xs uppercase text-toon-border border-b-2 border-dashed border-slate-200 pb-2 flex items-center gap-2">
                <User size={16} /> Datos de Contacto
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {/* Correo */}
                <div className="flex items-center justify-between bg-slate-50 border-2 border-toon-border rounded-xl p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Mail size={16} className="text-toon-purple shrink-0" />
                    <span className="font-bold text-sm text-gray-700 truncate">
                      {selectedNPC.email}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(selectedNPC.email, 'Correo')}
                    className="p-2 bg-white border-2 border-toon-border rounded-lg hover:bg-toon-purple hover:text-white transition-colors shrink-0"
                  >
                    <Copy size={14} />
                  </button>
                </div>

                {/* Teléfono */}
                <div className="flex items-center justify-between bg-slate-50 border-2 border-toon-border rounded-xl p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Phone size={16} className="text-toon-blue shrink-0" />
                    <span className="font-bold text-sm text-gray-700 truncate">
                      {selectedNPC.phone || 'Sin número registrado'}
                    </span>
                  </div>
                  {selectedNPC.phone && (
                    <button
                      onClick={() => handleCopy(selectedNPC.phone!, 'Teléfono')}
                      className="p-2 bg-white border-2 border-toon-border rounded-lg hover:bg-toon-blue hover:text-white transition-colors shrink-0"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>

                {/* Fecha de Ingreso */}
                <div className="flex items-center gap-3 bg-slate-50 border-2 border-toon-border rounded-xl p-3">
                  <Calendar size={16} className="text-toon-lime shrink-0" />
                  <span className="font-bold text-sm text-gray-700">
                    Unido al gremio:{' '}
                    {selectedNPC.createdAt
                      ? new Date(selectedNPC.createdAt).toLocaleDateString(
                          'es-CL',
                        )
                      : 'Desconocido'}
                  </span>
                </div>
              </div>

              {/* Botón de Mailing (Preparando el terreno) */}
              <button
                disabled
                className="w-full mt-4 bg-slate-200 border-4 border-slate-300 text-slate-400 font-black uppercase text-sm py-4 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed relative overflow-hidden"
              >
                <Send size={18} strokeWidth={3} />
                Enviar Pergamino Mágico (Mailing)
                <span className="absolute top-1 right-[-25px] bg-toon-pink text-white text-[8px] font-black px-8 py-0.5 rotate-45 border border-toon-border">
                  PRÓXIMAMENTE
                </span>
              </button>
            </div>

            {/* 2. HISTORIAL DE COMPRAS (MISIONES) */}
            <div className="bg-white border-4 border-toon-border rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-end border-b-2 border-dashed border-slate-200 pb-3 mb-4">
                <h3 className="font-black text-xs uppercase text-toon-border flex items-center gap-2">
                  <ShoppingBag size={16} /> Historial de Misiones
                </h3>
                <span className="font-black text-xs bg-toon-yellow border-2 border-toon-border px-2 py-1 rounded-md shadow-sm">
                  TOTAL: ${oroGastado.toLocaleString('es-CL')}
                </span>
              </div>

              <div className="space-y-3">
                {!selectedNPC.orders || selectedNPC.orders.length === 0 ? (
                  <p className="text-center text-xs font-bold text-gray-400 py-4 uppercase">
                    Aún no ha completado misiones
                  </p>
                ) : (
                  selectedNPC.orders.map((order: any) => (
                    <div
                      key={order.id}
                      className="bg-slate-50 border-2 border-toon-border rounded-xl p-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                    >
                      <div>
                        <span className="block font-black text-xs text-toon-border uppercase mb-1">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString(
                            'es-CL',
                            { year: 'numeric', month: 'short', day: 'numeric' },
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1">
                        <span className="font-black text-sm text-toon-lime">
                          ${Number(order.total).toLocaleString('es-CL')}
                        </span>
                        <span className="text-[9px] font-black uppercase text-white px-2 py-0.5 rounded border border-toon-border bg-toon-blue">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </>,
      document.body,
    )
  }
}
