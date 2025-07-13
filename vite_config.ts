// File: vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2,woff,ttf,otf,webp,avif}'],
          runtimeCaching: [
            // OpenRouter API Caching (für KI-Anfragen)
            {
              urlPattern: ({ url }) => url.origin === 'https://openrouter.ai',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'openrouter-api-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 1 // 1 Stunde
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Supabase API Caching
            {
              urlPattern: ({ url }) => {
                const projectRef = env.VITE_SUPABASE_PROJECT_REF;
                if (!projectRef) return false;
                const supabaseHostname = `${projectRef}.supabase.co`;
                return url.hostname === supabaseHostname;
              },
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 // 24 Stunden
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Statische Assets
            {
              urlPattern: /\.(?:png|gif|jpg|jpeg|svg|webp|avif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Tage
                }
              }
            },
            // Fonts
            {
              urlPattern: /\.(?:woff|woff2|ttf|otf)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'font-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 Jahr
                }
              }
            },
            // CSS und JS Files
            {
              urlPattern: /\.(?:js|css)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-resources',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 1 Woche
                }
              }
            }
          ]
        },
        includeAssets: [
          'favicon.svg', 
          'apple-touch-icon.png', 
          'icons/icon-maskable-512x512.png'
        ],
        manifest: {
          name: 'Das Magische Zauberbuch',
          short_name: 'Zauberbuch',
          description: 'Ein textbasiertes PWA Abenteuerspiel mit KI-gesteuerter Story-Generierung',
          theme_color: '#2D5A27',
          background_color: '#F8F6F0',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait-primary',
          icons: [
            {
              src: 'icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'favicon'
            },
            {
              src: 'icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'favicon'
            },
            {
              src: 'icons/icon-maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: 'icons/icon-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          categories: ['games', 'entertainment', 'productivity'],
          lang: 'de-DE',
          dir: 'ltr',
          prefer_related_applications: false,
          related_applications: [],
          screenshots: [
            {
              src: 'screenshots/desktop-1.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Spieloberfläche Desktop'
            },
            {
              src: 'screenshots/mobile-1.png',
              sizes: '375x812',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Spieloberfläche Mobile'
            }
          ]
        },
        devOptions: {
          enabled: command === 'serve'
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@services': path.resolve(__dirname, './src/services'),
        '@types': path.resolve(__dirname, './src/types'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@contexts': path.resolve(__dirname, './src/contexts'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@data': path.resolve(__dirname, './src/data')
      }
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    },
    server: {
      port: 3000,
      host: true,
      fs: {
        strict: false
      }
    },
    preview: {
      port: 4173,
      host: true
    },
    build: {
      target: 'esnext',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@mui/material', '@mui/icons-material'],
            supabase: ['@supabase/supabase-js'],
            utils: ['uuid', 'zod']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@mui/material',
        '@mui/icons-material',
        '@supabase/supabase-js'
      ]
    },
    css: {
      modules: {
        localsConvention: 'camelCase'
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`
        }
      }
    }
  }
})