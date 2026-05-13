import Link from 'next/link'
import { Camera, MapPin, Mail, Ghost, MonitorPlay } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t-8 border-toon-border mt-20 pt-12 pb-8 px-4 md:px-8 relative overflow-hidden">
      {/* Fondo decorativo (Marca de agua) */}
      <div className="absolute -left-10 -bottom-10 opacity-5 pointer-events-none rotate-12 text-[150px]">
        👾
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
        {/* COLUMNA 1: LA MARCA */}
        <div className="space-y-4">
          <h3 className="font-black text-3xl md:text-4xl uppercase tracking-tighter text-toon-border leading-none">
            TOPIN<span className="text-toon-pink">STORE</span>
          </h3>
          <p className="font-bold text-gray-500 text-sm max-w-xs leading-snug">
            Tesoros, cosas kawaii y el mejor botín para tu setup. Desde la feria
            de las pulgas, directo a tu inventario.
          </p>
          <div className="flex gap-3 pt-2">
            <a
              href="https://instagram.com/topingames"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-toon-pink border-3 border-toon-border rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all text-white"
            >
              <Camera size={22} strokeWidth={2.5} />
            </a>
            <a
              href="https://youtube.com/@topingames"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-toon-red border-3 border-toon-border rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all text-white"
            >
              <MonitorPlay size={22} strokeWidth={2.5} />
            </a>
            <a
              href="https://tiktok.com/@topingames"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-black border-3 border-toon-border rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all text-white"
            >
              <Ghost size={22} strokeWidth={2.5} />
            </a>
          </div>
        </div>

        {/* COLUMNA 2: EL ESCUDO LEGAL (Tus nuevos pergaminos) */}
        <div className="space-y-4">
          <h4 className="font-black text-xl md:text-2xl uppercase tracking-tighter text-toon-border">
            El Escudo Legal
          </h4>
          <ul className="space-y-3 font-bold text-sm text-gray-600">
            <li>
              <Link
                href="/legal/envios"
                className="hover:text-toon-pink hover:translate-x-1 transition-all inline-flex items-center gap-2"
              >
                <span className="text-toon-pink text-xs">▶</span> Políticas de
                Envío
              </Link>
            </li>
            <li>
              <Link
                href="/legal/garantia"
                className="hover:text-toon-lime hover:translate-x-1 transition-all inline-flex items-center gap-2"
              >
                <span className="text-toon-lime text-xs">▶</span> Garantía y
                Devoluciones
              </Link>
            </li>
            <li>
              <Link
                href="/legal/terminos"
                className="hover:text-toon-yellow hover:translate-x-1 transition-all inline-flex items-center gap-2"
              >
                <span className="text-toon-yellow text-xs">▶</span> Términos y
                Condiciones
              </Link>
            </li>
          </ul>
        </div>

        {/* COLUMNA 3: LA FORJA (Contacto) */}
        <div className="space-y-4">
          <h4 className="font-black text-xl md:text-2xl uppercase tracking-tighter text-toon-border">
            Señal de Humo
          </h4>
          <ul className="space-y-4 font-bold text-sm text-gray-600">
            <li className="flex items-start gap-3">
              <div className="bg-toon-blue/20 p-2 rounded-lg border-2 border-toon-blue shrink-0">
                <MapPin className="text-toon-blue" size={18} strokeWidth={3} />
              </div>
              <span className="mt-1 leading-snug">
                Santiago, Región Metropolitana
                <br />
                Chile
              </span>
            </li>
            <li className="flex items-center gap-3">
              <div className="bg-toon-lime/20 p-2 rounded-lg border-2 border-toon-lime shrink-0">
                <Mail className="text-toon-lime" size={18} strokeWidth={3} />
              </div>
              <span className="mt-1">ventas@topinstore.cl</span>
            </li>
          </ul>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t-4 border-dashed border-slate-200 text-center relative z-10">
        <p className="font-black text-[10px] md:text-xs text-gray-400 uppercase tracking-widest">
          © {new Date().getFullYear()} Topin Store SpA. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  )
}
