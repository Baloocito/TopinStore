import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

// Cargamos el .env.local para que Drizzle Kit sepa dónde conectarse
dotenv.config({ path: '.env.local' })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing')
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './supabase/migrations',
  dialect: 'postgresql', // <-- Usamos 'dialect' en vez de 'driver'
  dbCredentials: {
    url: process.env.DATABASE_URL, // <-- Usamos 'url' en vez de 'connectionString'
  },
})
