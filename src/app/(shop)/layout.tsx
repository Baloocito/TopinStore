export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-toon-bg">
      {/* Navbar con estilo Neobrutalista */}
      <nav className="sticky top-0 z-50 bg-white border-b-4 border-toon-border p-4 shadow-toon mb-8">
        <div className="container mx-auto flex justify-between items-center">
          <span className="font-black text-2xl tracking-tighter">
            TOPIN STORE 🧸
          </span>
          <div className="space-x-4 font-bold">
            <button className="hover:text-toon-pink transition-colors">
              Categorías
            </button>
            <button className="bg-toon-yellow border-2 border-toon-border px-4 py-1 rounded-lg shadow-[4px_4px_0px_0px_rgba(30,30,30,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
              Carrito
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pb-20">{children}</main>
    </div>
  )
}
