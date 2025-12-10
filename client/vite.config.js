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
      // Proxy API requests ke backend server
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
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
        ws: true,
        // Ignore proxy errors untuk Socket.IO (client akan auto-retry)
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            // Ignore connection errors - Socket.IO client akan handle retry
            if (err.code !== 'ECONNREFUSED' && err.code !== 'ECONNRESET') {
              console.error('Socket.IO proxy error:', err.message);
            }
          });
        }
      },
      // Proxy sounds dan static files ke backend
      '/sounds': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      // Proxy uploads ke backend
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})

