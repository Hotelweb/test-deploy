import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const serverUrl = env.VITE_SERVER_URL || 'http://localhost:3000'
  const analyzeBundle =
    mode === 'analyze' || env.VITE_BUNDLE_ANALYZE === 'true' || process.env.ANALYZE === 'true'

  return {
    plugins: [
      react(),
      tailwindcss(),
      analyzeBundle &&
        visualizer({
          filename: 'dist/stats.html',
          gzipSize: true,
          brotliSize: true,
          template: 'treemap',
        }),
    ],
    build: {
      target: 'baseline-widely-available',
      sourcemap: mode !== 'production' && mode !== 'analyze',
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined
            }

            if (id.includes('react') || id.includes('scheduler')) {
              return 'react-vendor'
            }
            if (id.includes('react-router-dom') || id.includes('@remix-run')) {
              return 'router'
            }
            if (id.includes('socket.io-client') || id.includes('engine.io-client')) {
              return 'realtime'
            }
            if (
              id.includes('react-markdown') ||
              id.includes('remark-') ||
              id.includes('micromark') ||
              id.includes('mdast-util') ||
              id.includes('unified')
            ) {
              return 'markdown'
            }

            return 'vendor'
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
    server: {
      hmr: {
        overlay: true,
      },
      proxy: {
        '/hotels': serverUrl,
        '/services': serverUrl,
        '/chat': serverUrl,
        '/food-order': serverUrl,
        '/uploads': serverUrl,
        '/auth': serverUrl,
        '/hotel-users': serverUrl,
        '/socket.io': {
          target: serverUrl,
          ws: true,
        },
      },
    },
  }
})
