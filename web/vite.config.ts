import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const serverUrl = env.VITE_SERVER_URL || 'http://localhost:3000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
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
