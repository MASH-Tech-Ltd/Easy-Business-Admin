import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
            if (id.includes('leaflet')) return 'vendor-maps';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-core';
          }
        }
      }
    }
  },
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8000/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            const cookies = proxyRes.headers['set-cookie'];
            if (cookies && Array.isArray(cookies)) {
              proxyRes.headers['set-cookie'] = cookies.map((cookieStr) => {
                if (
                  cookieStr.includes('Max-Age=0') ||
                  cookieStr.includes('max-age=0') ||
                  cookieStr.includes('Expires=Thu, 01 Jan 1970')
                ) {
                  return cookieStr;
                }
                if (!cookieStr.toLowerCase().includes('max-age')) {
                  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
                  return `${cookieStr}; Max-Age=86400; Expires=${expires}; SameSite=Lax`;
                }
                return cookieStr;
              });
            }
          });
        }
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