import Navbar from '@/components/layout/Navbar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex">
        {/* Sidebar Toon Style */}
        <aside className="w-64 border-r-4 border-toon-border bg-white p-6 hidden md:block min-h-[calc(100vh-100px)]">
          <nav className="space-y-4 font-bold">
            <div className="p-3 bg-toon-yellow border-2 border-toon-border rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer">
              📦 Inventario
            </div>
            <div className="p-3 hover:bg-gray-100 border-2 border-transparent rounded-xl cursor-pointer transition-all">
              💰 Ventas
            </div>
            <div className="p-3 hover:bg-gray-100 border-2 border-transparent rounded-xl cursor-pointer transition-all">
              🚚 Envíos
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
