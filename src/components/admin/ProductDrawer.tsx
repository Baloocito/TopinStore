'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  X,
  Save,
  Trash2,
  Image as ImageIcon,
  ListTree,
  Settings2,
  Plus,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { UploadDropzone } from '@/lib/uploadthing' // <-- IMPORTAMOS EL DROPZONE
import {
  updateProduct,
  deleteProduct,
  deleteAbandonedFiles,
} from '@/lib/actions'

export default function ProductDrawer({
  products,
  categories,
}: {
  products: any[]
  categories: any[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editSlug = searchParams.get('edit')

  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'specs'>('info')
  const [pendingUploads, setPendingUploads] = useState<string[]>([])
  const [currentProduct, setCurrentProduct] = useState<any>(null)
  const [localImages, setLocalImages] = useState<string[]>([])
  const [localSpecs, setLocalSpecs] = useState<
    { label: string; value: string }[]
  >([])

  // Sincronización de datos al abrir la gaveta
  useEffect(() => {
    if (editSlug) {
      const found = products.find((p) => p.slug === editSlug)
      if (found) {
        setCurrentProduct(found)
        setLocalImages(found.images || [])
        setLocalSpecs(found.specs || [])
        setPendingUploads([])
      }
    } else {
      setCurrentProduct(null)
    }
  }, [editSlug, products])

  // --- HANDLER DE CERRAR GAVETA (CANCELAR) ---
  const closeDrawer = () => {
    // Si hay imágenes que se subieron y el usuario cancela la edición, las destruimos en la nube
    if (pendingUploads.length > 0) {
      deleteAbandonedFiles(pendingUploads)
    }
    router.push('/dashboard/products')
  }

  // --- HANDLERS DE MEDIA ---
  const removeImage = (index: number) => {
    const urlToRemove = localImages[index]

    // 1. La quitamos de la interfaz
    setLocalImages((prev) => prev.filter((_, i) => i !== index))

    // 2. Si es una imagen "nueva" (recién subida), la borramos de UploadThing de inmediato
    if (pendingUploads.includes(urlToRemove)) {
      deleteAbandonedFiles([urlToRemove])
      setPendingUploads((prev) => prev.filter((url) => url !== urlToRemove))
    }
    // Nota: Si es una imagen "vieja", no la borramos de la nube todavía.
    // Se borrará sola cuando el usuario presione el botón "GUARDAR CAMBIOS" gracias a la acción updateProduct.
  }

  const moveImageLeft = (index: number) => {
    if (index === 0) return
    const newImages = [...localImages]
    const temp = newImages[index - 1]
    newImages[index - 1] = newImages[index]
    newImages[index] = temp
    setLocalImages(newImages)
  }

  const moveImageRight = (index: number) => {
    if (index === localImages.length - 1) return
    const newImages = [...localImages]
    const temp = newImages[index + 1]
    newImages[index + 1] = newImages[index]
    newImages[index] = temp
    setLocalImages(newImages)
  }

  // --- HANDLERS DE SPECS ---
  const addSpec = () => setLocalSpecs([...localSpecs, { label: '', value: '' }])
  const removeSpec = (index: number) =>
    setLocalSpecs((prev) => prev.filter((_, i) => i !== index))
  const updateSpec = (index: number, field: 'label' | 'value', val: string) => {
    const updated = [...localSpecs]
    updated[index][field] = val
    setLocalSpecs(updated)
  }

  // Guard: No renderizar si no hay producto
  if (!editSlug || !currentProduct) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-toon-border/40 backdrop-blur-sm z-[60] transition-opacity"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white border-l-8 border-toon-border z-[70] shadow-[-10px_0px_0px_0px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b-4 border-toon-border flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="font-black text-2xl uppercase tracking-tighter">
              Editar Tesoro
            </h2>
            <p className="font-mono text-[10px] text-gray-400 uppercase font-bold">
              {currentProduct.sku}
            </p>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 border-3 border-toon-border rounded-xl hover:bg-toon-red shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-4 gap-2 bg-white border-b-2 border-toon-border/5">
          <TabButton
            active={activeTab === 'info'}
            onClick={() => setActiveTab('info')}
            icon={<ListTree size={16} />}
            label="Detalles"
          />
          <TabButton
            active={activeTab === 'media'}
            onClick={() => setActiveTab('media')}
            icon={<ImageIcon size={16} />}
            label="Fotos"
          />
          <TabButton
            active={activeTab === 'specs'}
            onClick={() => setActiveTab('specs')}
            icon={<Settings2 size={16} />}
            label="Specs"
          />
        </div>

        {/* Formulario Principal de Edición */}
        <form
          action={updateProduct}
          id="edit-form"
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          <input type="hidden" name="id" value={currentProduct.id} />
          <input type="hidden" name="images" value={localImages.join(',')} />
          <input
            type="hidden"
            name="specs"
            value={JSON.stringify(localSpecs)}
          />

          {/* TAB 1: INFO (Ahora ocultamos con CSS en lugar de desmontar) */}
          <div
            className={cn(
              'space-y-4 animate-in fade-in',
              activeTab === 'info' ? 'block' : 'hidden',
            )}
          >
            {/* Nombre y SKU */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase">Nombre</label>
                <input
                  name="name"
                  defaultValue={currentProduct.name}
                  required
                  className="w-full p-3 border-3 border-toon-border rounded-xl font-bold focus:ring-4 ring-toon-yellow outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase">SKU</label>
                <input
                  name="sku"
                  defaultValue={currentProduct.sku}
                  required
                  className="w-full p-3 border-3 border-toon-border rounded-xl font-bold uppercase focus:ring-4 ring-toon-yellow outline-none"
                />
              </div>
            </div>

            {/* Precio y Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase">
                  Precio (CLP)
                </label>
                <input
                  name="price"
                  type="number"
                  defaultValue={currentProduct.price}
                  required
                  className="w-full p-3 border-3 border-toon-border rounded-xl font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase">Stock</label>
                <input
                  name="stock"
                  type="number"
                  defaultValue={currentProduct.stock}
                  required
                  className="w-full p-3 border-3 border-toon-border rounded-xl font-bold"
                />
              </div>
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase">Categoría</label>
              <select
                name="categoryId"
                defaultValue={currentProduct.categoryId || ''}
                className="w-full p-3 border-3 border-toon-border rounded-xl font-bold bg-white"
              >
                <option value="" disabled>
                  Selecciona una categoría
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase">
                Descripción
              </label>
              <textarea
                name="description"
                defaultValue={currentProduct.description}
                className="w-full p-3 border-3 border-toon-border rounded-xl font-bold h-32"
              />
            </div>
          </div>

          {/* TAB 2: MEDIA */}
          <div
            className={cn(
              'animate-in fade-in space-y-6',
              activeTab === 'media' ? 'block' : 'hidden',
            )}
          >
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase italic">
                La primera imagen será la portada. Usa las flechas para ordenar.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {localImages.map((url, i) => (
                <div
                  key={url}
                  className="group relative aspect-square border-4 border-toon-border rounded-2xl overflow-hidden shadow-toon bg-slate-50"
                >
                  <img
                    src={url}
                    className="object-cover w-full h-full"
                    alt="Producto"
                  />

                  <div className="absolute inset-0 bg-toon-border/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={() => moveImageLeft(i)}
                      disabled={i === 0}
                      className="p-2 bg-white border-2 border-toon-border rounded-xl hover:bg-toon-yellow disabled:opacity-50 disabled:hover:bg-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                    >
                      <ArrowLeft size={16} className="text-toon-border" />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="p-2 bg-toon-red border-2 border-toon-border rounded-xl hover:bg-red-500 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none text-white"
                    >
                      <Trash2 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => moveImageRight(i)}
                      disabled={i === localImages.length - 1}
                      className="p-2 bg-white border-2 border-toon-border rounded-xl hover:bg-toon-yellow disabled:opacity-50 disabled:hover:bg-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                    >
                      <ArrowRight size={16} className="text-toon-border" />
                    </button>
                  </div>

                  {i === 0 && (
                    <span className="absolute top-2 left-2 bg-toon-yellow border-2 border-toon-border px-2 py-0.5 rounded-full text-[8px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      Portada
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* UPLOAD DIRECTO */}
            <div className="pt-4 border-t-4 border-toon-border/10">
              <h3 className="font-black text-xs uppercase mb-4 text-toon-border">
                Añadir más fotos
              </h3>
              <UploadDropzone
                endpoint="productImage"
                onClientUploadComplete={(res) => {
                  if (res) {
                    const newUrls = res.map((f) => f.ufsUrl)
                    setLocalImages((prev) => [...prev, ...newUrls])

                    // NUEVO: Registramos que estas imágenes son "Huérfanas" hasta que se guarden
                    setPendingUploads((prev) => [...prev, ...newUrls])
                  }
                }}
                onUploadError={(error: Error) =>
                  alert(`Error al subir: ${error.message}`)
                }
                className="ut-button:bg-toon-pink ut-label:text-toon-border ut-label:font-black border-4 border-dashed border-toon-border bg-slate-50"
              />
            </div>
          </div>

          {/* TAB 3: SPECS */}
          <div
            className={cn(
              'space-y-4 animate-in fade-in',
              activeTab === 'specs' ? 'block' : 'hidden',
            )}
          >
            <button
              type="button"
              onClick={addSpec}
              className="w-full py-3 bg-toon-blue border-2 border-toon-border rounded-lg font-black text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} /> AÑADIR ATRIBUTO
            </button>
            <div className="space-y-2">
              {localSpecs.map((spec, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="Label"
                    value={spec.label}
                    onChange={(e) => updateSpec(i, 'label', e.target.value)}
                    className="flex-1 p-2 border-2 border-toon-border rounded-lg text-xs font-bold"
                  />
                  <input
                    placeholder="Valor"
                    value={spec.value}
                    onChange={(e) => updateSpec(i, 'value', e.target.value)}
                    className="flex-1 p-2 border-2 border-toon-border rounded-lg text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpec(i)}
                    className="p-2 text-toon-red hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer de Acciones */}
        <div className="p-6 border-t-4 border-toon-border bg-slate-50 flex gap-4">
          <button
            type="submit"
            form="edit-form"
            className="flex-1 bg-toon-lime border-4 border-toon-border py-4 rounded-2xl font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} /> GUARDAR CAMBIOS
          </button>

          {/* BOTÓN DE ELIMINAR */}
          <form action={deleteProduct}>
            <input type="hidden" name="id" value={currentProduct.id} />
            <button
              type="submit"
              className="p-4 h-full bg-white border-4 border-toon-border rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-toon-red hover:text-white transition-all flex items-center justify-center"
              title="Eliminar producto"
            >
              <Trash2 size={24} />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all border-2',
        active
          ? 'bg-toon-yellow border-toon-border shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
          : 'border-transparent text-gray-400 hover:text-toon-border',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
