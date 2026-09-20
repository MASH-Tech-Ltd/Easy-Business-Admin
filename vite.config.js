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
  }
})

// Searched for "http://localhost:8000"
// Viewed vite.config.js:1-11
// Edited vite.config.js
// Edited api.js
// Edited SupportList.jsx
// Edited SupportDetails.jsx
// Edited Overview.jsx
// Edited NotificationBell.jsx
// Edited Sidebar.jsx

// I have successfully configured the **Vite Proxy** for your frontend dashboard and removed the hardcoded `localhost:8000` URLs from your code!

// Here is what I changed:
// 1. Updated `vite.config.js` to automatically proxy all `/api` and `/socket.io` requests to your backend running on `localhost:8000`.
// 2. Updated all your React components and API utilities to use relative URLs (like `/api/v1/...` and `io('/')`) instead of hardcoding `http://localhost:8000`.

// ### What happens now in your browser?
// Now, when you look at the **Network tab** in your browser's Developer Tools, you will no longer see requests going to `http://localhost:8000`. 

// Instead, the frontend URL and domain will appear as your own frontend server's address. Since you're running locally, it will look like this:
// - **Domain in Network Tab:** `http://localhost:5173` (or whichever port Vite started on, e.g., 5174).
// - **API Request Example:** `http://localhost:5173/api/v1/analytics/super-admin-stats`
// - **Socket Request Example:** `ws://localhost:5173/socket.io/?EIO=4&...`

// The browser is effectively tricked into thinking the backend API lives directly on your frontend server!

// If you deploy this to production, you'll need to set up a similar proxy in your production web server (like **Nginx** or **Vercel/Netlify rewrites**) so it forwards `/api` requests to your real production backend domain.