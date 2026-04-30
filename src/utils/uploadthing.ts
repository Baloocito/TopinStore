import {
  generateUploadButton,
  generateUploadDropzone,
} from '@uploadthing/react'
import { generateReactHelpers } from '@uploadthing/react'

// Importamos los tipos de tu archivo core.ts para que TypeScript nos ayude
import type { OurFileRouter } from '@/app/api/uploadthing/core'

// Exportamos los botones visuales (por si los usas en otro lado)
export const UploadButton = generateUploadButton<OurFileRouter>()
export const UploadDropzone = generateUploadDropzone<OurFileRouter>()

// Exportamos el hook invisible que estamos usando en nuestra Mesa de Crafteo
export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>()
