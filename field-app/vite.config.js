import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Project Aegis - Field Responder',
        short_name: 'Aegis Field',
        description: 'Offline-First Disaster Response Field App',
        theme_color: '#0ea5e9',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/app/',
        start_url: '/app/',
        id: '/app/',
        categories: ['emergency', 'safety', 'utilities'],
        icons: [
          {
            src: '/app/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/app/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/app/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Cache all static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json,webmanifest}'],
        // CRITICAL: Navigate fallback for SPA
        navigateFallback: '/app/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/socket\.io\//],
        // Skip waiting and claim clients immediately for instant activation
        skipWaiting: true,
        clientsClaim: true,
        // CRITICAL: Modify URLs to include base path
        modifyURLPrefix: {
          '': '/app/'
        },
        // Enable offline Google Analytics (prevents errors)
        offlineGoogleAnalytics: false,
        runtimeCaching: [
          {
            // CRITICAL: Cache app shell (HTML) - CacheFirst for instant offline
            urlPattern: /\/app\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-shell',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
          {
            // Cache API calls - NetworkFirst (try network, fallback to cache)
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache map tiles
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache external fonts/resources
            urlPattern: /^https:\/\/(fonts|apis)\.google/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          i18n: ['i18next', 'react-i18next'],
          storage: ['dexie', 'zustand']
        }
      }
    }
  }
});
