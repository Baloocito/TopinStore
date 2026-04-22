import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 selection:bg-toon-pink">
      {/* Sidebar Fijo */}
      <AdminSidebar />

      {/* Área de Contenido Dinámico */}
      <main className="flex-1 overflow-y-auto">
        <header className="p-8 pb-0">
          {/* Aquí podrías poner un breadcrumb toon o el nombre del usuario */}
          <div className="flex justify-between items-center">
            <h1 className="font-black text-4xl uppercase tracking-tighter">
              Panel de Control
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-black text-xs uppercase text-gray-400">
                  Eusebio Dev
                </p>
                <p className="font-bold text-[10px] bg-toon-pink px-2 py-0.5 rounded-full border-2 border-toon-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  SpA OWNER
                </p>
              </div>
              <div className="w-12 h-12 bg-toon-yellow border-3 border-toon-border rounded-full" />
            </div>
          </div>
        </header>

        <section className="p-8">{children}</section>
      </main>
    </div>
  )
}
