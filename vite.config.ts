import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Pages serves this repo from /simple-dnd/, so assets need that prefix in production.
// Dev and preview stay at / so local URLs are short.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/simple-dnd/' : '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        editor: resolve(__dirname, 'editor/index.html'),
      },
    },
  },
}))
