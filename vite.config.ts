import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom domain (dumbmoney.online) and local: BASE_PATH=/
const base = process.env.BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    {
      name: 'spa-github-pages-fallback',
      closeBundle() {
        const index = resolve(__dirname, 'dist/index.html')
        if (existsSync(index)) {
          copyFileSync(index, resolve(__dirname, 'dist/404.html'))
        }
      },
    },
  ],
})
