'use client'

import { signIn } from 'next-auth/react'
import { LogIn, ShieldAlert } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-black text-4xl md:text-6xl uppercase tracking-tighter text-toon-border">
          Acceso Restringido 🛡️
        </h1>
        <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">
          Solo los Maestros del Gremio pueden pasar
        </p>
      </div>

      <button
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        className="flex items-center gap-4 bg-white border-4 border-toon-border p-6 rounded-2xl shadow-toon hover:-translate-y-1 hover:translate-x-1 hover:shadow-none transition-all active:translate-y-1"
      >
        <div className="bg-slate-50 p-2 border-2 border-toon-border rounded-lg">
          <img
            src="https://authjs.dev/img/providers/google.svg"
            className="w-6 h-6"
            alt="Google"
          />
        </div>
        <span className="font-black text-xl uppercase">Entrar con Google</span>
        <LogIn size={24} />
      </button>

      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-toon-red bg-red-50 border-2 border-toon-red px-4 py-2 rounded-full">
        <ShieldAlert size={14} /> Sistema de seguridad activo
      </div>
    </div>
  )
}
