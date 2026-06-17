import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // We register manually via the React hook (PWAUpdater), so don't let the
      // plugin inject its own registration script too.
      injectRegister: false,
      // "prompt": when a new deploy is detected, surface an update toast instead
      // of silently reloading under the user. The user reloads when ready.
      registerType: 'prompt',
      // The app already ships a hand-authored manifest + icons in public/, so
      // let the plugin own only the service worker, not the manifest.
      manifest: false,
      workbox: {
        // Each build emits a precache manifest of content-hashed assets, so a
        // deploy changes the service worker → browser detects it → installs the
        // new precache and removes the previous one.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        cleanupOutdatedCaches: true,
        // SPA: serve index.html for navigations not matched by the precache.
        navigateFallback: '/index.html',
      },
      // Service worker stays off during `vite dev` so it never serves stale
      // source while developing; it only runs in production builds.
      devOptions: { enabled: false },
    }),
  ],
  test: {
    // jsdom gives tests access to window/localStorage/navigator so the
    // persistence layer and components can be exercised.
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
