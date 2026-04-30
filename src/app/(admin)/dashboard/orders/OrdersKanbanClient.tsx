'use client'

import { useState } from 'react'
import { updateOrderStatusAction } from '@/app/actions/orders'
import {
  Swords,
  Hammer,
  Truck,
  CheckCircle2,
  Receipt,
  UserCircle,
  Coins,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Tipos de nuestro esquema
export type OrderData = {
  id: number
  orderNumber: string
  customerName: string
  total: number
  status: string // 'pending', 'packing', 'shipped', 'delivered'
  itemsCount: number
}

// MOCK DATA PARA PROBAR EL JUEGO (Se usa si la BD está vacía)
const MOCK_ORDERS: OrderData[] = [
  {
    id: 1,
    orderNumber: 'ORD-001',
    customerName: 'Momo Deviluke',
    total: 15500,
    status: 'pending',
    itemsCount: 3,
  },
  {
    id: 2,
    orderNumber: 'ORD-002',
    customerName: 'Goku Son',
    total: 45000,
    status: 'pending',
    itemsCount: 12,
  },
  {
    id: 3,
    orderNumber: 'ORD-003',
    customerName: 'Naruto Uzumaki',
    total: 8000,
    status: 'packing',
    itemsCount: 1,
  },
  {
    id: 4,
    orderNumber: 'ORD-004',
    customerName: 'Luffy Uzumaki',
    total: 22000,
    status: 'shipped',
    itemsCount: 5,
  },
]

const COLUMNS = [
  {
    id: 'pending',
    title: 'Nuevas Misiones',
    icon: Swords,
    color: 'bg-toon-pink',
    border: 'border-toon-pink',
  },
  {
    id: 'packing',
    title: 'En la Forja',
    icon: Hammer,
    color: 'bg-toon-yellow',
    border: 'border-toon-yellow',
  },
  {
    id: 'shipped',
    title: 'En la Carreta',
    icon: Truck,
    color: 'bg-toon-blue',
    border: 'border-toon-blue',
  },
  {
    id: 'delivered',
    title: 'Misión Cumplida',
    icon: CheckCircle2,
    color: 'bg-toon-lime',
    border: 'border-toon-lime',
  },
]

export default function OrdersKanbanClient({
  initialOrders,
}: {
  initialOrders: OrderData[]
}) {
  // Usamos el Mock si no hay datos en la BD
  const [orders, setOrders] = useState<OrderData[]>(
    initialOrders.length > 0 ? initialOrders : MOCK_ORDERS,
  )

  // Estado para saber qué tarjeta estamos arrastrando
  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null)

  // ==========================================
  // LÓGICA DE DRAG & DROP (HTML5 NATivo)
  // ==========================================
  const handleDragStart = (e: React.DragEvent, orderId: number) => {
    setDraggedOrderId(orderId)
    // Efecto visual: la tarjeta se hace semitransparente al arrastrar
    e.currentTarget.classList.add('opacity-50', 'scale-95')
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedOrderId(null)
    e.currentTarget.classList.remove('opacity-50', 'scale-95')
  }

  const handleDragOver = (e: React.DragEvent) => {
    // CRÍTICO: Prevenir el comportamiento por defecto permite soltar
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    if (!draggedOrderId) return

    // 1. Encontrar la orden
    const orderToMove = orders.find((o) => o.id === draggedOrderId)
    if (!orderToMove || orderToMove.status === targetStatus) return

    // 2. Actualización Optimista (Cambia en pantalla al instante para que se sienta fluido)
    setOrders((prev) =>
      prev.map((o) =>
        o.id === draggedOrderId ? { ...o, status: targetStatus } : o,
      ),
    )

    // 3. Guardar en Base de Datos por debajo de la mesa
    const result = await updateOrderStatusAction(draggedOrderId, targetStatus)

    // Si falla la BD, revertimos el movimiento
    if (!result.success) {
      alert('Error de conexión. Revertiendo movimiento.')
      setOrders((prev) =>
        prev.map((o) =>
          o.id === draggedOrderId ? { ...o, status: orderToMove.status } : o,
        ),
      )
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER DEL GREMIO */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-toon-border border-4 border-toon-border rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Receipt size={28} className="text-white" strokeWidth={3} />
        </div>
        <div>
          <h1 className="font-black text-3xl uppercase tracking-tighter text-toon-border">
            Tablero de Misiones
          </h1>
          <p className="font-bold text-gray-500 text-sm italic">
            "Arrastra los pergaminos para completar los pedidos del reino"
          </p>
        </div>
      </div>

      {/* TABLERO KANBAN */}
      <div className="flex flex-col xl:flex-row gap-6 overflow-x-auto pb-8 snap-x snap-mandatory">
        {COLUMNS.map((column) => {
          const ColumnIcon = column.icon
          const columnOrders = orders.filter((o) => o.status === column.id)
          const totalOro = columnOrders.reduce(
            (acc, curr) => acc + curr.total,
            0,
          )

          return (
            <div
              key={column.id}
              className="flex-1 min-w-[300px] xl:min-w-0 bg-slate-50 border-4 border-toon-border rounded-3xl flex flex-col h-[700px] shadow-toon snap-center overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* CABECERA DE LA COLUMNA */}
              <div
                className={cn(
                  'p-4 border-b-4 border-toon-border flex flex-col gap-2',
                  column.color,
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-1.5 rounded-lg border-2 border-toon-border/50">
                    <ColumnIcon
                      size={20}
                      className="text-toon-border"
                      strokeWidth={3}
                    />
                  </div>
                  <h2 className="font-black text-lg uppercase text-toon-border tracking-tight flex-1">
                    {column.title}
                  </h2>
                  <span className="bg-white px-2 py-1 rounded-md font-black text-xs border-2 border-toon-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {columnOrders.length}
                  </span>
                </div>

                {/* BOTÍN TOTAL DE LA COLUMNA */}
                <div className="bg-white/40 border-2 border-toon-border/30 rounded-lg px-3 py-1 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-toon-border/70">
                    Oro Acumulado
                  </span>
                  <span className="font-black text-sm text-toon-border">
                    ${totalOro.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              {/* ZONA DE DROP (TARJETAS) */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar bg-[url('/grid-pattern.svg')]">
                {columnOrders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50 space-y-2 border-4 border-dashed border-gray-300 rounded-2xl">
                    <ColumnIcon size={40} />
                    <p className="font-black uppercase text-center text-xs">
                      Sin Misiones
                    </p>
                  </div>
                ) : (
                  columnOrders.map((order) => (
                    /* TARJETA DE MISIÓN (DRAGGABLE) */
                    <div
                      key={order.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, order.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'bg-white border-3 border-toon-border rounded-2xl p-4 cursor-grab active:cursor-grabbing shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all',
                        // Efecto visual si la tarjeta está siendo arrastrada
                        draggedOrderId === order.id
                          ? 'opacity-50 ring-4 ring-toon-pink'
                          : '',
                      )}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="bg-slate-100 text-toon-border font-black text-[10px] px-2 py-1 rounded-md border-2 border-toon-border tracking-widest">
                          {order.orderNumber}
                        </span>
                        <div className="flex -space-x-2">
                          {/* Miniatura de items (Simulado visualmente) */}
                          {[...Array(Math.min(3, order.itemsCount))].map(
                            (_, i) => (
                              <div
                                key={i}
                                className="w-6 h-6 rounded-full bg-toon-lime border-2 border-toon-border shadow-sm flex items-center justify-center text-[8px] font-black text-toon-border"
                              >
                                ?
                              </div>
                            ),
                          )}
                          {order.itemsCount > 3 && (
                            <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-toon-border flex items-center justify-center text-[8px] font-black text-toon-border z-10">
                              +{order.itemsCount - 3}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <UserCircle className="text-gray-400" size={16} />
                        <span className="font-black text-sm text-toon-border uppercase truncate">
                          {order.customerName}
                        </span>
                      </div>

                      <div className="pt-3 border-t-2 border-dashed border-slate-200 flex justify-between items-center">
                        <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                          Botín
                        </span>
                        <div className="flex items-center gap-1 text-toon-yellow">
                          <Coins
                            size={14}
                            className="fill-toon-yellow text-toon-border"
                            strokeWidth={2}
                          />
                          <span className="font-black text-lg text-toon-border drop-shadow-[1px_1px_0px_rgba(0,0,0,0.1)]">
                            ${order.total.toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
