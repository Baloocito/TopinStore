import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Creamos el controlador pasando nuestras opciones
const handler = NextAuth(authOptions)

// Next.js App Router requiere que exportemos los métodos HTTP explícitamente
export { handler as GET, handler as POST }
