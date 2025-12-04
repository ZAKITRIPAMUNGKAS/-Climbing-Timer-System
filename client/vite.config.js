import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: '../public', // Gunakan public folder dari root untuk assets
  build: {
    outDir: '../public/react-build',
    emptyOutDir: false, // Jangan hapus folder, karena ada logo dan file lain
    copyPublicDir: true // Copy public folder ke build output
  },
  server: {
    proxy: {
      // Proxy /timersistem dan semua sub-routes ke backend server
      '/timersistem': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      // Proxy socket.io ke backend
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true
      },
      // Proxy sounds dan static files ke backend
      '/sounds': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})

