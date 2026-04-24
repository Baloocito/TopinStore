import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 selection:bg-toon-pink relative">
      {/* Sidebar (Ahora maneja su propia lógica responsiva) */}
      <AdminSidebar />

      {/* Área de Contenido Dinámico revisar*/}
      <main className="flex-1 overflow-y-auto w-full md:w-auto">
        {/* En móvil damos un pl-24 para hacer espacio al botón del menú flotante */}
        <header className="p-6 md:p-8 pb-0 pl-24 md:pl-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="font-black text-3xl md:text-4xl uppercase tracking-tighter">
              Panel de Control
            </h1>
            <div className="flex items-center space-x-4 self-end sm:self-auto">
              <div className="text-right">
                <p className="font-black text-xs uppercase text-gray-400">
                  Eusebio Dev
                </p>
                <p className="font-bold text-[10px] bg-toon-pink px-2 py-0.5 rounded-full border-2 border-toon-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block">
                  SpA OWNER
                </p>
              </div>
              <div className="w-12 h-12 bg-toon-yellow border-3 border-toon-border rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
            </div>
          </div>
        </header>

        <section className="p-4 md:p-8">{children}</section>
      </main>
    </div>
  )
}
