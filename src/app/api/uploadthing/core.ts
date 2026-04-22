import { createUploadthing, type FileRouter } from 'uploadthing/next'

const f = createUploadthing()

// Aquí podrías validar la sesión con Auth.js en el futuro
const auth = (req: Request) => ({ id: 'admin_user' })

export const ourFileRouter = {
  // Definimos una ruta para imágenes de productos
  productImage: f({ image: { maxFileSize: '4MB', maxFileCount: 4 } })
    .middleware(async ({ req }) => {
      const user = await auth(req)
      if (!user) throw new Error('Unauthorized')
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Cambiamos file.url por file.ufsUrl
      console.log('Archivo subido con éxito:', file.ufsUrl)
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
