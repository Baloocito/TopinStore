import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token, // Si hay token (sesión), está autorizado
  },
})

// Especificamos qué rutas proteger
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
