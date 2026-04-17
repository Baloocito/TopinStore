import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        toon: {
          yellow: '#FFE800',
          pink: '#FF69B4',
          blue: '#4D96FF',
          bg: '#F4F4F0', // Fondo pastel para hacer resaltar los productos
          border: '#1E1E1E', // Negro casi puro para los bordes
        },
      },
      boxShadow: {
        // Sombra sólida hacia abajo a la derecha para el efecto 3D Toon
        toon: '6px 6px 0px 0px rgba(30,30,30,1)',
        'toon-hover': '2px 2px 0px 0px rgba(30,30,30,1)',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
export default config
