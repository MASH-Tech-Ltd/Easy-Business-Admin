import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8000/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, '')
      },
      '/_content-sync': {
        target: 'http://localhost:8000/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_content-sync/, '')
      },
      '/socket.io': {
        target: 'http://localhost:8000',
        ws: true,
      }
    }
  },
  preview: {
    host: true,
    port: 3005,
    allowedHosts: ['adminsec.masheco.com']
  }
})