import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // API and SSH WebSocket go to the backend (`npm run dev:server`)
      '/api': {
        target: 'http://127.0.0.1:3001',
        ws: true,
      },
    },
  },
})
