'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import {
  updateOrderStatusAction,
  updateOrderLogisticsAction,
} from '@/app/actions/orders'
import {
  Swords,
  Hammer,
  Truck,
  CheckCircle2,
  Receipt,
  UserCircle,
  Coins,
  X,
  MapPin,
  PackageOpen,
  Save,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ==========================================
// TIPOS ACTUALIZADOS (Con datos para el Modal)
// ==========================================
export type OrderData = {
  id: number
  orderNumber: string
  customerName: string
  total: number
  status: string
  itemsCount: number
  shippingAddress: string
  customerNotes: string | null
  trackingNumber: string | null
  courier: string | null
  createdAt: Date
  items: {
    id: number
    productName: string
    priceAtTime: number
    quantity: number
    packRecipe: any
  }[]
}

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
  const [orders, setOrders] = useState<OrderData[]>(initialOrders)
  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null)

  // ESTADOS DEL MODAL
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isSavingLogistics, setIsSavingLogistics] = useState(false)

  // Datos del formulario logística
  const [courier, setCourier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ==========================================
  // LÓGICA DEL MODAL
  // ==========================================
  const openModal = (order: OrderData) => {
    setSelectedOrder(order)
    setCourier(order.courier || '')
    setTrackingNumber(order.trackingNumber || '')
  }

  const closeModal = () => {
    setSelectedOrder(null)
  }

  const handleSaveLogistics = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return

    setIsSavingLogistics(true)
    // toast.loading te permite mostrar que algo está cargando
    const loadingToastId = toast.loading('Guardando datos de la carreta...')

    const result = await updateOrderLogisticsAction(
      selectedOrder.id,
      courier,
      trackingNumber,
    )

    // Quitamos el loading manual
    toast.dismiss(loadingToastId)

    if (result.success) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id ? { ...o, courier, trackingNumber } : o,
        ),
      )
      setSelectedOrder((prev) =>
        prev ? { ...prev, courier, trackingNumber } : null,
      )

      // 🚀 AQUÍ ESTÁ EL TOAST DE ÉXITO
      toast.success('¡Datos de carreta guardados con éxito!')
    } else {
      // 🚨 AQUÍ ESTÁ EL TOAST DE ERROR
      toast.error(result.message || 'La carreta se rompió.')
    }
    setIsSavingLogistics(false)
  }

  // ==========================================
  // LÓGICA DE DRAG & DROP
  // ==========================================
  const handleDragStart = (e: React.DragEvent, orderId: number) => {
    setDraggedOrderId(orderId)
    e.currentTarget.classList.add('opacity-50', 'scale-95')
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedOrderId(null)
    e.currentTarget.classList.remove('opacity-50', 'scale-95')
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    if (!draggedOrderId) return

    const orderToMove = orders.find((o) => o.id === draggedOrderId)
    if (!orderToMove || orderToMove.status === targetStatus) return

    setOrders((prev) =>
      prev.map((o) =>
        o.id === draggedOrderId ? { ...o, status: targetStatus } : o,
      ),
    )

    const result = await updateOrderStatusAction(draggedOrderId, targetStatus)

    if (result.success) {
      // Opcional: Un pequeño toast de información cuando se mueve una misión
      toast.info(`Misión enviada a: ${targetStatus}`)
    } else {
      // 🚨 AQUÍ ESTÁ EL TOAST DE ERROR
      toast.error('Magia inestable. Revertiendo movimiento.')
      setOrders((prev) =>
        prev.map((o) =>
          o.id === draggedOrderId ? { ...o, status: orderToMove.status } : o,
        ),
      )
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
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
            "Arrastra los pergaminos o haz clic para ver los detalles"
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
                    /* TARJETA DE MISIÓN (DRAGGABLE & CLICKABLE) */
                    <div
                      key={order.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, order.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => openModal(order)}
                      className={cn(
                        'bg-white border-3 border-toon-border rounded-2xl p-4 cursor-grab active:cursor-grabbing shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all',
                        draggedOrderId === order.id
                          ? 'opacity-50 ring-4 ring-toon-pink'
                          : '',
                      )}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="bg-slate-100 text-toon-border font-black text-[10px] px-2 py-1 rounded-md border-2 border-toon-border tracking-widest pointer-events-none">
                          {order.orderNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-4 pointer-events-none">
                        <UserCircle className="text-gray-400" size={16} />
                        <span className="font-black text-sm text-toon-border uppercase truncate">
                          {order.customerName}
                        </span>
                      </div>

                      <div className="pt-3 border-t-2 border-dashed border-slate-200 flex justify-between items-center pointer-events-none">
                        <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                          Botín ({order.itemsCount})
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

      {/* ==========================================
          MODAL: PERGAMINO DE MISIÓN
          ========================================== */}
      {isMounted &&
        selectedOrder &&
        createPortal(
          <>
            <div
              className="fixed top-0 left-0 w-screen h-[100dvh] bg-toon-border/40 backdrop-blur-sm z-[100] transition-opacity"
              onClick={closeModal}
            />
            <div className="fixed right-0 top-0 h-[100dvh] w-full max-w-lg bg-white border-l-8 border-toon-border z-[110] shadow-[-10px_0px_0px_0px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-300">
              {/* Header del Modal */}
              <div className="p-6 border-b-4 border-toon-border flex justify-between items-center bg-toon-pink/20 shrink-0">
                <div>
                  <h2 className="font-black text-2xl uppercase tracking-tighter leading-none">
                    Detalles de Misión
                  </h2>
                  <p className="font-mono text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-widest">
                    {selectedOrder.orderNumber}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 border-3 border-toon-border rounded-xl hover:bg-toon-red shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all bg-white shrink-0 group"
                >
                  <X
                    size={20}
                    className="group-hover:text-white"
                    strokeWidth={3}
                  />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {/* 1. INFO DEL CLIENTE */}
                <section className="bg-slate-50 border-4 border-toon-border rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="font-black text-xs uppercase mb-3 text-toon-blue flex items-center gap-2">
                    <MapPin size={16} strokeWidth={3} /> Objetivo (Destino)
                  </h3>
                  <p className="font-black text-lg uppercase leading-tight mb-2">
                    {selectedOrder.customerName}
                  </p>
                  <p className="font-bold text-sm text-gray-600 mb-2 leading-snug">
                    {selectedOrder.shippingAddress}
                  </p>
                  {selectedOrder.customerNotes && (
                    <div className="mt-3 p-3 bg-toon-yellow/20 border-2 border-toon-yellow rounded-xl">
                      <span className="block text-[9px] font-black uppercase text-toon-border/50 mb-1">
                        Nota del Cliente:
                      </span>
                      <p className="font-bold text-xs italic text-toon-border">
                        "{selectedOrder.customerNotes}"
                      </p>
                    </div>
                  )}
                </section>

                {/* 2. BOTÍN (ÍTEMS) */}
                <section className="bg-white border-4 border-toon-border rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="font-black text-xs uppercase mb-4 text-toon-pink flex items-center gap-2">
                    <PackageOpen size={16} strokeWidth={3} /> Botín a Empacar
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-2 p-3 border-2 border-dashed border-toon-border/20 rounded-xl bg-slate-50"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-black text-sm uppercase">
                            {item.productName}
                          </span>
                          <span className="font-black text-lg text-toon-border bg-white px-2 py-0.5 rounded-lg border-2 border-toon-border">
                            x{item.quantity}
                          </span>
                        </div>

                        {/* Si es un Pack y tiene receta, mostramos qué eligió el cliente */}
                        {item.packRecipe && item.packRecipe.items && (
                          <div className="mt-2 pt-2 border-t-2 border-dashed border-slate-200">
                            <span className="block text-[9px] font-black uppercase text-toon-blue mb-1">
                              Contenido del Pack:
                            </span>
                            <ul className="space-y-1.5">
                              {item.packRecipe.items.map(
                                (ing: any, idx: number) => (
                                  <li
                                    key={idx}
                                    className="flex justify-between items-center gap-2 bg-white border-2 border-toon-border/10 rounded-md px-2 py-1"
                                  >
                                    <span className="text-xs font-bold text-gray-500 truncate flex-1">
                                      - {ing.name || `Ítem ID: ${ing.id}`}
                                    </span>
                                    <span className="font-black text-xs text-toon-border bg-slate-100 border-2 border-toon-border/20 px-1.5 rounded-md shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]">
                                      x{ing.qty}
                                    </span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. LOGÍSTICA (FORMULARIO) */}
                <section className="bg-slate-50 border-4 border-toon-border rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="font-black text-xs uppercase mb-4 text-toon-border flex items-center gap-2">
                    <Truck size={16} strokeWidth={3} /> Preparar Carreta
                  </h3>
                  <form onSubmit={handleSaveLogistics} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-500">
                        Empresa de Envío (Courier)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Starken, Chilexpress..."
                        value={courier}
                        onChange={(e) => setCourier(e.target.value)}
                        className="w-full p-3 border-3 border-toon-border rounded-xl font-bold focus:ring-4 ring-toon-blue outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-500">
                        Número de Seguimiento (Tracking)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: STK-12345678"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="w-full p-3 border-3 border-toon-border rounded-xl font-bold uppercase focus:ring-4 ring-toon-blue outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSavingLogistics}
                      className="w-full py-3 bg-toon-lime border-3 border-toon-border rounded-xl font-black text-sm uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-green-400 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      {isSavingLogistics ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} strokeWidth={3} />
                      )}
                      Guardar Datos de Envío
                    </button>
                  </form>
                </section>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}
