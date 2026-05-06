import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Estructura de un Objeto en la Mochila
export type CartItem = {
  cartItemId: string // ID único (por si agrega el mismo pack con diferentes recetas)
  productId: number
  name: string
  price: number
  quantity: number
  image: string
  type: 'normal' | 'pack'
  maxStock: number
  packConfig?: any // Aquí guardaremos la receta si es un pack
}

interface CartState {
  isOpen: boolean // ¿El inventario está abierto en pantalla?
  items: CartItem[]

  // Acciones de la Interfaz
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void

  // Acciones del Juego (Matemáticas)
  addItem: (item: CartItem) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      items: [],

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (newItem) => {
        const { items } = get()
        // Buscamos si el ítem ya está en la mochila (y si es normal, no un pack personalizado)
        const existingItem = items.find(
          (i) => i.productId === newItem.productId && i.type === 'normal',
        )

        if (existingItem) {
          // Si ya existe y hay stock, le sumamos la cantidad
          set({
            items: items.map((i) =>
              i.cartItemId === existingItem.cartItemId
                ? {
                    ...i,
                    quantity: Math.min(
                      i.quantity + newItem.quantity,
                      i.maxStock,
                    ),
                  }
                : i,
            ),
          })
        } else {
          // Si es nuevo o es un pack único, lo añadimos como un nuevo slot
          set({ items: [...items, newItem] })
        }
      },

      removeItem: (cartItemId) => {
        set({ items: get().items.filter((i) => i.cartItemId !== cartItemId) })
      },

      updateQuantity: (cartItemId, quantity) => {
        set({
          items: get().items.map((i) =>
            i.cartItemId === cartItemId ? { ...i, quantity } : i,
          ),
        })
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        )
      },
    }),
    {
      name: 'topin-loot-storage', // Nombre del archivo guardado en el navegador
      partialize: (state) => ({ items: state.items }), // Solo guardamos los ítems, no si está abierto o cerrado
    },
  ),
)
