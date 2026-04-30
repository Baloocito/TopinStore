'use client'

import { useState } from 'react'
import {
  Search,
  Users,
  MapPin,
  Receipt,
  Shield,
  Crown,
  Medal,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Tipos basados en la consulta que hicimos en data.ts
export type NPCData = {
  id: number
  name: string
  email: string
  phone: string | null
  totalSpent: string | null
  ordersCount: number | null
  createdAt: Date | null
  orders: any[] // Las últimas 5 compras
}

// LÓGICA DE RANGOS DEL GREMIO (Basada en Oro Gastado)
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

  // Filtro en el cliente para búsquedas súper rápidas
  const filteredNPCs = initialNPCs.filter(
    (npc) =>
      npc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      npc.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER DEL CÓDICE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border-4 border-toon-border p-6 rounded-3xl shadow-toon">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-toon-purple border-4 border-toon-border rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Users size={28} className="text-white" strokeWidth={3} />
          </div>
          <div>
            <h1 className="font-black text-3xl uppercase tracking-tighter text-toon-border leading-none">
              Códice de NPCs
            </h1>
            <p className="font-bold text-gray-500 text-xs mt-1">
              "Conoce a los aventureros que financian tu gremio"
            </p>
          </div>
        </div>

        {/* BUSCADOR */}
        <div className="relative w-full md:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
            strokeWidth={3}
          />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
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
                className="bg-white border-4 border-toon-border rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col h-full group"
              >
                {/* CABECERA (Nombre y Rango) */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <h2 className="font-black text-xl uppercase text-toon-border truncate">
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
                  <div className="bg-slate-50 border-3 border-toon-border rounded-xl p-3 flex flex-col items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-[9px] font-black uppercase text-gray-500 mb-1">
                      Misiones (Pedidos)
                    </span>
                    <div className="flex items-center gap-1 text-toon-blue">
                      <Receipt size={14} strokeWidth={3} />
                      <span className="font-black text-xl leading-none">
                        {npc.ordersCount || 0}
                      </span>
                    </div>
                  </div>

                  <div className="bg-toon-yellow/20 border-3 border-toon-yellow rounded-xl p-3 flex flex-col items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-[9px] font-black uppercase text-toon-yellow mb-1 drop-shadow-sm">
                      Oro Donado
                    </span>
                    <span className="font-black text-xl leading-none text-toon-border">
                      ${oroGastado.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t-4 border-toon-border/10">
                  {/* MISIONES RECIENTES (Última compra) */}
                  {npc.orders && npc.orders.length > 0 ? (
                    <div>
                      <span className="block text-[10px] font-black uppercase text-gray-400 mb-2">
                        Última Misión
                      </span>
                      <div className="flex justify-between items-center bg-slate-100 p-2 border-2 border-slate-300 rounded-lg">
                        <span className="font-bold text-xs text-toon-border">
                          {npc.orders[0].orderNumber}
                        </span>
                        <span className="font-black text-xs text-toon-lime uppercase tracking-tighter">
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
    </div>
  )
}
