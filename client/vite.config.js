import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set publicDir untuk development (Vite akan serve dari sini)
  publicDir: '../public',
  build: {
    outDir: '../public/react-build',
    emptyOutDir: false, // Jangan hapus folder, karena ada logo dan file lain
    copyPublicDir: true, // Copy public files ke build output agar images accessible
    // Optimasi bundle size
    rollupOptions: {
      output: {
        // Code splitting untuk chunk yang lebih kecil
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
          'utils-vendor': ['jspdf', 'jspdf-autotable', 'xlsx', 'socket.io-client'],
          'editor-vendor': ['react-quill', 'dompurify'],
          'alert-vendor': ['sweetalert2']
        }
      }
    },
    // Minify dan optimize (gunakan esbuild default, lebih cepat)
    minify: 'esbuild', // esbuild lebih cepat dari terser dan sudah included
    // Jika ingin gunakan terser, install: npm install -D terser
    // terserOptions: {
    //   compress: {
    //     drop_console: true,
    //     drop_debugger: true
    //   }
    // },
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000
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

