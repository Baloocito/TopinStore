'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createPackAction } from '@/app/actions/packs'
import { useUploadThing } from '@/utils/uploadthing'
import {
  Search,
  Plus,
  Trash2,
  Wand2,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  UploadCloud,
  Settings2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type InventoryItem = {
  id: number
  name: string
  price: number
  stock: number
}

// CRÍTICO: Ahora la receta guarda límites, no cantidades fijas
type CartItem = InventoryItem & { minQuantity: number; maxQuantity: number }

export default function PackCreatorClient({
  initialInventory,
}: {
  initialInventory: InventoryItem[]
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { startUpload } = useUploadThing('productImage')

  // ==========================================
  // ESTADOS DEL GRIMORIO
  // ==========================================
  const [packName, setPackName] = useState('')
  const [basePrice, setBasePrice] = useState<number>(3000) // Precio del contenedor vacío
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([])

  // Tiers de Descuento
  const [tier1, setTier1] = useState<number>(5) // Descuento al 33% de capacidad
  const [tier2, setTier2] = useState<number>(15) // Descuento al 66% de capacidad
  const [tier3, setTier3] = useState<number>(30) // Descuento Full 100%

  const [searchTerm, setSearchTerm] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [packImagePreview, setPackImagePreview] = useState<string | null>(null)
  const [packImageFile, setPackImageFile] = useState<File | null>(null)

  // ==========================================
  // MECÁNICAS DE SELECCIÓN Y REGLAS
  // ==========================================
  const addItem = (item: InventoryItem) => {
    setSelectedItems((prev) => {
      // Si ya está, no hacemos nada (las reglas se editan en el caldero)
      if (prev.find((i) => i.id === item.id)) return prev
      // Lo agregamos con regla por defecto: Mín 0, Máx 5 (limitado por stock real)
      const maxDefault = Math.min(5, item.stock)
      return [...prev, { ...item, minQuantity: 0, maxQuantity: maxDefault }]
    })
  }

  const removeItem = (id: number) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== id))
  }

  const updateLimits = (
    id: number,
    field: 'minQuantity' | 'maxQuantity',
    value: number,
  ) => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newItem = { ...item, [field]: value }
          // Lógica de seguridad: min no puede superar max, y max no puede superar stock
          if (newItem.minQuantity > newItem.maxQuantity) {
            if (field === 'minQuantity')
              newItem.maxQuantity = newItem.minQuantity
            else newItem.minQuantity = newItem.maxQuantity
          }
          if (newItem.maxQuantity > item.stock) newItem.maxQuantity = item.stock
          if (newItem.minQuantity < 0) newItem.minQuantity = 0

          return newItem
        }
        return item
      }),
    )
  }

  // ==========================================
  // MECÁNICA DE IMAGEN
  // ==========================================
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPackImageFile(file)
      setPackImagePreview(URL.createObjectURL(file))
    }
  }

  const removeImage = () => {
    setPackImageFile(null)
    setPackImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ==========================================
  // SIMULADOR MATEMÁTICO (XP y Tiers)
  // ==========================================
  const filteredInventory = initialInventory.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // ¿Cuánto costaría el Pack si el cliente elige el MÁXIMO de todo?
  const maxIngredientsValue = selectedItems.reduce(
    (acc, item) => acc + item.price * item.maxQuantity,
    0,
  )
  const maxTotalValue = basePrice + maxIngredientsValue

  // ==========================================
  // FLUJO DE GUARDADO (Subir a UploadThing + Neon)
  // ==========================================
  const handleSavePack = async () => {
    if (selectedItems.length < 2 || !packName || !packImageFile) {
      alert(
        'Asegúrate de tener un nombre, al menos 2 ingredientes permitidos y una imagen.',
      )
      return
    }

    setIsPending(true)

    try {
      const uploadRes = await startUpload([packImageFile])
      if (!uploadRes || !uploadRes[0])
        throw new Error('Falló subida de imagen.')

      const finalImageUrl = uploadRes[0].ufsUrl

      // Formateamos para el Backend
      const ingredientsParams = selectedItems.map((item) => ({
        id: item.id,
        minQuantity: item.minQuantity,
        maxQuantity: item.maxQuantity,
      }))

      // Llamada usando las nuevas reglas
      const result = await createPackAction(
        packName,
        basePrice,
        tier1,
        tier2,
        tier3,
        ingredientsParams,
        finalImageUrl,
      )

      if (result.success) {
        alert('¡Grimorio Actualizado! Reglas guardadas con éxito.')
        router.push('/dashboard/products')
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error(error)
      alert('Error en la forja. Revisa la consola.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER DEL CREADOR */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-toon-pink border-4 border-toon-border rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Wand2 size={28} className="text-white" strokeWidth={3} />
        </div>
        <div>
          <h1 className="font-black text-3xl uppercase tracking-tighter text-toon-border">
            Grimorio de Packs
          </h1>
          <p className="font-bold text-gray-500 text-sm italic">
            "Define las reglas, fija los límites y deja que el cliente cocine"
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* ==========================================
            ZONA IZQUIERDA: DESPENSA
            ========================================== */}
        <div className="xl:col-span-5 bg-slate-50 border-4 border-toon-border rounded-3xl p-6 shadow-toon flex flex-col h-[850px]">
          <h2 className="font-black text-xl uppercase tracking-tight mb-4 flex items-center gap-2">
            Despensa{' '}
            <span className="text-xs bg-toon-border text-white px-2 py-1 rounded-md">
              {filteredInventory.length} ítems
            </span>
          </h2>

          <div className="relative mb-6">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar ingrediente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-3 border-toon-border rounded-xl font-bold focus:ring-4 ring-toon-yellow outline-none transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-2">
            {filteredInventory.length === 0 ? (
              <p className="text-center text-gray-400 font-bold mt-10 uppercase text-xs">
                Sin resultados
              </p>
            ) : (
              filteredInventory.map((item) => {
                const isAdded = selectedItems.some((i) => i.id === item.id)

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center justify-between p-3 border-3 rounded-2xl transition-all',
                      isAdded
                        ? 'border-toon-border/20 bg-slate-100 opacity-60 grayscale'
                        : 'border-toon-border bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1',
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="font-black text-sm uppercase">
                        {item.name}
                      </span>
                      <span className="font-bold text-toon-pink drop-shadow-[1px_1px_0px_rgba(0,0,0,0.1)] text-xs">
                        ${item.price.toLocaleString('es-CL')} | Stock:{' '}
                        {item.stock}
                      </span>
                    </div>

                    <button
                      onClick={() => addItem(item)}
                      disabled={isAdded || item.stock === 0}
                      className={cn(
                        'p-2 border-2 border-toon-border rounded-lg transition-all',
                        isAdded
                          ? 'bg-gray-200'
                          : 'bg-toon-yellow hover:bg-yellow-300 active:translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                      )}
                    >
                      <Plus
                        size={18}
                        strokeWidth={3}
                        className={
                          isAdded ? 'text-gray-400' : 'text-toon-border'
                        }
                      />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ==========================================
            ZONA DERECHA: REGLAS DEL CALDERO
            ========================================== */}
        <div className="xl:col-span-7 bg-white border-4 border-toon-border rounded-3xl p-6 shadow-toon flex flex-col h-[850px]">
          {/* HEADER DEL PACK (Nombre e Imagen) */}
          <div className="flex gap-4 mb-6">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageSelect}
            />
            <div className="w-24 h-24 shrink-0 relative">
              {packImagePreview ? (
                <div className="relative w-full h-full border-4 border-toon-border rounded-2xl overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group">
                  <Image
                    src={packImagePreview}
                    alt="Portada"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={20} />
                    <span className="text-[8px] font-black uppercase mt-1">
                      Borrar
                    </span>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full bg-toon-pink/10 border-4 border-dashed border-toon-pink rounded-2xl flex flex-col items-center justify-center text-toon-pink relative overflow-hidden cursor-pointer hover:bg-toon-pink/20 transition-colors"
                >
                  <UploadCloud size={24} />
                  <span className="font-black text-[10px] mt-1 uppercase text-center leading-tight">
                    Subir
                    <br />
                    Portada
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <input
                type="text"
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                placeholder="Nombre (Ej: Estuche Super Pro)"
                className="w-full px-4 py-3 border-4 border-toon-border rounded-xl font-black text-lg focus:ring-4 ring-toon-pink outline-none transition-all"
              />
              <div className="flex items-center gap-2 bg-slate-50 border-3 border-toon-border rounded-xl px-3 py-2">
                <span className="font-bold text-xs uppercase text-gray-500">
                  Precio Envase Base $
                </span>
                <input
                  type="number"
                  min="0"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="bg-transparent font-black text-toon-border outline-none w-full"
                />
              </div>
            </div>
          </div>

          {/* LISTA DE REGLAS DE INGREDIENTES */}
          <div className="flex-1 bg-slate-50 border-4 border-dashed border-toon-border/20 rounded-2xl p-4 overflow-y-auto no-scrollbar mb-6">
            {selectedItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-2">
                <Settings2 size={40} />
                <p className="font-black uppercase text-center text-xs">
                  Define los ingredientes permitidos
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col md:flex-row md:items-center justify-between bg-white border-3 border-toon-border p-3 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] gap-3"
                  >
                    <div className="flex flex-col flex-1 truncate pr-2">
                      <span className="font-black text-sm uppercase truncate">
                        {item.name}
                      </span>
                      <span className="font-bold text-gray-400 text-[10px]">
                        ${item.price.toLocaleString('es-CL')} c/u
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Control Min */}
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black uppercase text-gray-400 mb-1">
                          Mínimo
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={item.maxQuantity}
                          value={item.minQuantity}
                          onChange={(e) =>
                            updateLimits(
                              item.id,
                              'minQuantity',
                              Number(e.target.value),
                            )
                          }
                          className="w-12 py-1 bg-slate-100 border-2 border-toon-border rounded-md text-center font-black text-xs outline-none"
                        />
                      </div>

                      {/* Control Max */}
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black uppercase text-gray-400 mb-1">
                          Máximo
                        </span>
                        <input
                          type="number"
                          min={item.minQuantity}
                          max={item.stock}
                          value={item.maxQuantity}
                          onChange={(e) =>
                            updateLimits(
                              item.id,
                              'maxQuantity',
                              Number(e.target.value),
                            )
                          }
                          className="w-12 py-1 bg-slate-100 border-2 border-toon-border rounded-md text-center font-black text-xs outline-none"
                        />
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 ml-1 border-2 border-toon-border rounded-lg bg-slate-50 hover:bg-toon-red hover:text-white transition-colors self-end"
                      >
                        <Trash2 size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SIMULADOR DE TIERS Y DESCUENTOS */}
          <div className="bg-[#fffdf5] border-4 border-toon-border rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
            <div className="flex justify-between items-end border-b-4 border-toon-border/10 pb-3">
              <div>
                <span className="block font-bold text-[10px] text-gray-500 uppercase tracking-widest">
                  Simulador: Valor Máximo Posible
                </span>
                <span className="block font-black text-2xl text-gray-400">
                  ${maxTotalValue.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="text-right">
                <span className="block font-bold text-[10px] text-toon-blue uppercase tracking-widest">
                  Descuento a fijar
                </span>
              </div>
            </div>

            {/* Los 3 Niveles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* TIER 1 */}
              <div className="bg-white border-3 border-toon-border rounded-xl p-3 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                <span className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                  Tier 1 (33%)
                </span>

                {/* Precios (Antes y Después) */}
                <div className="mb-2">
                  <span className="block text-xs font-bold text-gray-400 line-through decoration-toon-red decoration-2">
                    ${Math.round(maxTotalValue * 0.33).toLocaleString('es-CL')}
                  </span>
                  <span className="block text-sm font-black text-toon-border">
                    $
                    {Math.round(
                      maxTotalValue * 0.33 * (1 - tier1 / 100),
                    ).toLocaleString('es-CL')}
                  </span>
                </div>

                {/* Input de Descuento */}
                <div className="flex justify-center items-center bg-slate-100 border-2 border-toon-border rounded-md px-2 py-1 w-20 mx-auto">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tier1}
                    onChange={(e) => setTier1(Number(e.target.value))}
                    className="w-full bg-transparent text-center font-black text-toon-blue outline-none"
                  />
                  <span className="font-black text-toon-blue">%</span>
                </div>
              </div>

              {/* TIER 2 */}
              <div className="bg-white border-3 border-toon-border rounded-xl p-3 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                <span className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                  Tier 2 (66%)
                </span>

                {/* Precios (Antes y Después) */}
                <div className="mb-2">
                  <span className="block text-xs font-bold text-gray-400 line-through decoration-toon-red decoration-2">
                    ${Math.round(maxTotalValue * 0.66).toLocaleString('es-CL')}
                  </span>
                  <span className="block text-sm font-black text-toon-border">
                    $
                    {Math.round(
                      maxTotalValue * 0.66 * (1 - tier2 / 100),
                    ).toLocaleString('es-CL')}
                  </span>
                </div>

                {/* Input de Descuento */}
                <div className="flex justify-center items-center bg-slate-100 border-2 border-toon-border rounded-md px-2 py-1 w-20 mx-auto">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tier2}
                    onChange={(e) => setTier2(Number(e.target.value))}
                    className="w-full bg-transparent text-center font-black text-toon-blue outline-none"
                  />
                  <span className="font-black text-toon-blue">%</span>
                </div>
              </div>

              {/* TIER 3 (FULL) */}
              <div className="bg-toon-yellow border-3 border-toon-border rounded-xl p-3 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                <span className="block text-[10px] font-black uppercase text-toon-border/70 mb-1">
                  Full (100%)
                </span>

                {/* Precios (Antes y Después) */}
                <div className="mb-2">
                  <span className="block text-xs font-bold text-toon-border/50 line-through decoration-toon-red decoration-2">
                    ${maxTotalValue.toLocaleString('es-CL')}
                  </span>
                  <span className="block text-lg font-black text-toon-border drop-shadow-[1px_1px_0px_rgba(255,255,255,1)]">
                    $
                    {Math.round(
                      maxTotalValue * (1 - tier3 / 100),
                    ).toLocaleString('es-CL')}
                  </span>
                </div>

                {/* Input de Descuento */}
                <div className="flex justify-center items-center bg-white border-2 border-toon-border rounded-md px-2 py-1 w-20 mx-auto">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tier3}
                    onChange={(e) => setTier3(Number(e.target.value))}
                    className="w-full bg-transparent text-center font-black text-toon-pink outline-none"
                  />
                  <span className="font-black text-toon-pink">%</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSavePack}
              disabled={
                selectedItems.length < 2 ||
                !packName ||
                !packImageFile ||
                isPending
              }
              className="mt-2 w-full flex items-center justify-center gap-2 bg-toon-lime border-4 border-toon-border text-toon-border font-black uppercase text-lg py-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-400 disabled:opacity-50 disabled:grayscale transition-all active:translate-y-1 active:shadow-none"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> GUARDANDO
                  REGLAS...
                </>
              ) : (
                <>
                  <Sparkles size={20} /> Guardar Reglas de Crafteo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
