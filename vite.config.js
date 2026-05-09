import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // En dev, redirige /api vers le serveur Express (port 3000)
      '/api': 'http://localhost:3000',
    },
  },
})
