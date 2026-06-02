'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import {
  updateOrderStatusAction,
  updateOrderLogisticsAction,
  deleteOrderAndReleaseStockAction, // 👈 Importación de la nueva acción manual
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
  Clock,
  Wallet,
  Trash2, // 👈 Icono para la eliminación manual
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type OrderData = {
  id: number
  orderNumber: string
  customerName: string
  subtotal: number
  total: number
  status: string
  paymentStatus: string // (paid | unpaid)
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
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isSavingLogistics, setIsSavingLogistics] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false) // 👈 Estado de carga aislado para la eliminación
  const [courier, setCourier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')

  // Sincroniza el estado local si los datos del componente de servidor cambian
  useEffect(() => {
    setIsMounted(true)
    setOrders(initialOrders)
  }, [initialOrders])

  const openModal = (order: OrderData) => {
    setSelectedOrder(order)
    setCourier(order.courier || '')
    setTrackingNumber(order.trackingNumber || '')
  }

  const closeModal = () => setSelectedOrder(null)

  // Función para formatear fechas épicas
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  // 👈 Función manejadora para revocar la misión y reponer inventario
  const handleDeleteOrder = async () => {
    if (!selectedOrder) return

    const confirmar = confirm(
      `¿Estás seguro de que deseas eliminar la misión ${selectedOrder.orderNumber}? Esto DEVOLVERÁ inmediatamente el stock a la tienda.`,
    )
    if (!confirmar) return

    setIsDeleting(true)
    const toastId = toast.loading('Devolviendo botín al inventario...')

    const result = await deleteOrderAndReleaseStockAction(selectedOrder.id)
    toast.dismiss(toastId)

    if (result.success) {
      setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id))
      toast.success('¡Stock restaurado y misión archivada con éxito!')
      closeModal()
    } else {
      toast.error(result.message || 'La magia de la base de datos falló.')
    }
    setIsDeleting(false)
  }

  const handleSaveLogistics = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return

    setIsSavingLogistics(true)
    const loadingToastId = toast.loading('Guardando datos de la carreta...')
    const result = await updateOrderLogisticsAction(
      selectedOrder.id,
      courier,
      trackingNumber,
    )
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
      toast.success('¡Datos de carreta guardados con éxito!')
    } else {
      toast.error(result.message || 'La carreta se rompió.')
    }
    setIsSavingLogistics(false)
  }

  const handleDragStart = (e: React.DragEvent, orderId: number) => {
    setDraggedOrderId(orderId)
    e.currentTarget.classList.add('opacity-50', 'scale-95')
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedOrderId(null)
    e.currentTarget.classList.remove('opacity-50', 'scale-95')
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
      toast.info(`Misión enviada a: ${targetStatus}`)
    } else {
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
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, column.id)}
            >
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
                        <span
                          className={cn(
                            'font-black text-[9px] uppercase px-2 py-1 rounded border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                            order.paymentStatus === 'paid'
                              ? 'bg-toon-lime border-toon-border text-toon-border'
                              : 'bg-toon-red border-toon-border text-white',
                          )}
                        >
                          {order.paymentStatus === 'paid'
                            ? 'Pagado'
                            : 'Pendiente'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2 pointer-events-none">
                        <UserCircle className="text-gray-400" size={16} />
                        <span className="font-black text-sm text-toon-border uppercase truncate">
                          {order.customerName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-4 pointer-events-none">
                        <Clock className="text-gray-400" size={12} />
                        <span className="font-bold text-[10px] text-gray-500 uppercase">
                          {formatDate(order.createdAt)}
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

      {isMounted &&
        selectedOrder &&
        createPortal(
          <>
            <div
              className="fixed top-0 left-0 w-screen h-[100dvh] bg-toon-border/40 backdrop-blur-sm z-[100] transition-opacity"
              onClick={closeModal}
            />
            <div className="fixed right-0 top-0 h-[100dvh] w-full max-w-lg bg-white border-l-8 border-toon-border z-[110] shadow-[-10px_0px_0px_0px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b-4 border-toon-border flex justify-between items-center bg-toon-pink/20 shrink-0">
                <div>
                  <h2 className="font-black text-2xl uppercase tracking-tighter leading-none">
                    Detalles de Misión
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                      {selectedOrder.orderNumber}
                    </p>
                    <span className="text-gray-300">|</span>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">
                      {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>
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
                {/* 1. LA TESORERÍA (CON BOTÓN DE ELIMINACIÓN Y DEVOLUCIÓN MANUAL) */}
                <section className="bg-toon-yellow/20 border-4 border-toon-border rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                  <h3 className="font-black text-xs uppercase text-toon-border flex items-center gap-2">
                    <Wallet size={16} strokeWidth={3} /> Tesorería y Cobros
                  </h3>

                  <div className="flex justify-between items-center bg-white border-2 border-toon-border p-3 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="font-bold text-[10px] uppercase text-gray-500">
                      Estado del Pago
                    </span>
                    {selectedOrder.paymentStatus === 'paid' ? (
                      <span className="bg-toon-lime text-toon-border px-3 py-1 rounded-md font-black text-xs uppercase border-2 border-toon-border">
                        <CheckCircle2
                          size={12}
                          className="inline mr-1 mb-0.5"
                        />{' '}
                        Pagado Exitosamente
                      </span>
                    ) : (
                      <span className="bg-toon-red text-white px-3 py-1 rounded-md font-black text-xs uppercase border-2 border-toon-border">
                        Pago Pendiente
                      </span>
                    )}
                  </div>

                  <div className="bg-white border-2 border-toon-border rounded-xl p-3 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span>Subtotal Productos</span>
                      <span>
                        ${selectedOrder.subtotal.toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span>Envío / Descuentos</span>
                      <span>$0</span>
                    </div>
                    <div className="border-t-2 border-dashed border-gray-200 pt-2 flex justify-between items-end">
                      <span className="font-black text-sm uppercase text-toon-border">
                        Total Recibido
                      </span>
                      <span className="font-black text-xl text-toon-border">
                        ${selectedOrder.total.toLocaleString('es-CL')}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase text-right pt-1">
                      Método: Mercado Pago
                    </p>
                  </div>

                  {/* 🔥 BOTÓN TOON-RED PARA BORRAR Y LIBERAR STOCK */}
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeleteOrder}
                    className="w-full py-2.5 bg-toon-red text-white border-3 border-toon-border rounded-xl font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-red-500 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isDeleting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} strokeWidth={3} />
                    )}
                    Eliminar Misión y Devolver Stock
                  </button>
                </section>

                {/* 2. INFO DEL CLIENTE */}
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

                {/* 3. BOTÍN (ÍTEMS) */}
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
                        <span className="font-bold text-[10px] text-gray-400 -mt-1">
                          ${item.priceAtTime.toLocaleString('es-CL')} c/u
                        </span>

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
                                    <span className="font-black text-xs text-toon-border bg-slate-100 border-2 border-toon-border/20 px-1.5 rounded-md shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                      x{ing.qty}
                                    </span>
                                    nesting: true{' '}
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

                {/* 4. LOGÍSTICA (FORMULARIO) */}
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
                      )}{' '}
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
