import { createUploadthing, type FileRouter } from 'uploadthing/next'
// 🛡️ Importamos la armadura pesada
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

const f = createUploadthing()

export const ourFileRouter = {
  // Definimos una ruta para imágenes de productos
  productImage: f({ image: { maxFileSize: '4MB', maxFileCount: 4 } })
    .middleware(async ({ req }) => {
      // 🛡️ EL VERDADERO ADUANERO: Verificamos con Google
      const session = await getServerSession(authOptions)

      // ✨ Tu arreglo maestro para el Type Narrowing de TypeScript
      const email = session?.user?.email

      // Filtro absoluto: Si no eres tú (o viene vacío), los pateamos
      if (!email || email !== process.env.ADMIN_EMAIL) {
        console.warn(`🚨 Intento de subida de archivo bloqueado.`)
        throw new Error(
          'Unauthorized: Solo el Maestro del Gremio puede subir pergaminos.',
        )
      }

      // Si pasas, le decimos a UploadThing de forma segura quién está subiendo
      return { userEmail: email }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Este código corre DESPUÉS de que el archivo ya se subió seguro
      console.log('✅ Archivo subido con éxito por:', metadata.userEmail)
      console.log('URL de la imagen:', file.ufsUrl)

      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
