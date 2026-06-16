import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom gives tests access to window/localStorage/navigator so the
    // persistence layer and components can be exercised.
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
