/// <reference types="vite/client" />
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'esnext',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': '/src',
      '@/core': '/src/core',
      '@/objects': '/src/objects',
      '@/controls': '/src/controls',
      '@/physics': '/src/physics',
      '@/data': '/src/data',
      '@/ui': '/src/ui'
    }
  }
})
