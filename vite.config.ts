import { defineConfig } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

import lucidePreprocess from 'vite-plugin-lucide-preprocess'

export default defineConfig({
  plugins: [
    lucidePreprocess(),
    react(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
  ],
  optimizeDeps: {
    exclude: ['dockview'],
  },
})
