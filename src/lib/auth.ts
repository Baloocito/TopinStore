import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET, // 🛡️ Evita bugs en producción de Vercel
  callbacks: {
    async signIn({ user }) {
      // 🛡️ FILTRO ABSOLUTO: Solo el correo definido en .env puede entrar
      const isAdmin = user.email === process.env.ADMIN_EMAIL

      if (isAdmin) {
        return true
      }

      // Si no es el admin, denegamos el acceso
      return false
    },
  },
  pages: {
    signIn: '/login', // Página personalizada de login
  },
}
