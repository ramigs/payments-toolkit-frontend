import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // The single app chunk (~225 kB gzipped: Vue, reka-ui, @tanstack/ai,
    // vue-sonner, @supabase/supabase-js) is fine for this internal tool —
    // lift the 500 kB warning.
    chunkSizeWarningLimit: 900,
  },
})
