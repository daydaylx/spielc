// File: src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'

import App from './App'
import { GameContextProvider } from './contexts/GameContext'
import { AuthContextProvider } from './contexts/AuthContext'
import { ThemeContextProvider } from './contexts/ThemeContext'
import { OfflineContextProvider } from './contexts/OfflineContext'
import { NotificationContextProvider } from './contexts/NotificationContext'
import ErrorBoundary from './components/common/ErrorBoundary'

import './styles/globals.css'
import './styles/animations.css'
import './styles/fonts.css'

// React Query Konfiguration für optimale Performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 Minuten
      cacheTime: 10 * 60 * 1000, // 10 Minuten
      retry: (failureCount, error: any) => {
        // Retry Logic für verschiedene Fehlertypen
        if (error?.status === 404) return false
        if (error?.status >= 500) return failureCount < 2
        if (failureCount < 3) return true
        return false
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    },
    mutations: {
      retry: 1,
      retryDelay: 1000
    }
  }
})

// Performance Monitoring
const startTime = performance.now()

// Service Worker Update Handler
const handleSWUpdate = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  }
}

// App Initialization mit Error Handling
const initializeApp = () => {
  try {
    const root = ReactDOM.createRoot(
      document.getElementById('root') as HTMLElement
    )

    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <ThemeContextProvider>
                <AuthContextProvider>
                  <OfflineContextProvider>
                    <NotificationContextProvider>
                      <GameContextProvider>
                        <CssBaseline />
                        <App />
                      </GameContextProvider>
                    </NotificationContextProvider>
                  </OfflineContextProvider>
                </AuthContextProvider>
              </ThemeContextProvider>
            </BrowserRouter>
            {import.meta.env.DEV && (
              <ReactQueryDevtools 
                initialIsOpen={false} 
                position="bottom-right"
              />
            )}
          </QueryClientProvider>
        </ErrorBoundary>
      </React.StrictMode>
    )

    // Performance Logging
    const loadTime = performance.now() - startTime
    console.log(`🎮 Das Magische Zauberbuch geladen in ${Math.round(loadTime)}ms`)

    // Service Worker Setup
    handleSWUpdate()

    // Development Tools
    if (import.meta.env.DEV) {
      // @ts-ignore
      window.__GAME_DEBUG__ = {
        queryClient,
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        buildTime: __BUILD_TIME__,
        env: import.meta.env
      }
    }

  } catch (error) {
    console.error('❌ Fehler beim Initialisieren der App:', error)
    
    // Fallback Error Display
    document.getElementById('root')!.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-family: 'EB Garamond', serif;
        background: linear-gradient(135deg, #F8F6F0 0%, #E8E6E3 100%);
        color: #2C3E50;
        text-align: center;
        padding: 20px;
      ">
        <h1 style="font-family: 'Cinzel', serif; color: #2D5A27; margin-bottom: 20px;">
          Das Magische Zauberbuch
        </h1>
        <p style="font-size: 18px; margin-bottom: 10px;">
          Ein unerwarteter Fehler ist aufgetreten.
        </p>
        <p style="color: #666; margin-bottom: 20px;">
          Bitte laden Sie die Seite neu oder versuchen Sie es später erneut.
        </p>
        <button 
          onclick="window.location.reload()" 
          style="
            background: #2D5A27;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
          "
          onmouseover="this.style.background='#1A3318'"
          onmouseout="this.style.background='#2D5A27'"
        >
          Seite neu laden
        </button>
      </div>
    `
  }
}

// App Initialization
initializeApp()

// PWA Install Prompt Handler
let deferredPrompt: any = null

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  
  // Custom Install Event für die App
  window.dispatchEvent(new CustomEvent('pwa-installable', {
    detail: { prompt: e }
  }))
})

// PWA Install Function für globale Nutzung
// @ts-ignore
window.installPWA = async () => {
  if (!deferredPrompt) {
    console.log('PWA Installation nicht verfügbar')
    return false
  }

  try {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('✅ PWA wurde installiert')
      deferredPrompt = null
      return true
    } else {
      console.log('❌ PWA Installation abgebrochen')
      return false
    }
  } catch (error) {
    console.error('Fehler bei PWA Installation:', error)
    return false
  }
}

// Unhandled Error Logging
window.addEventListener('error', (event) => {
  console.error('🚨 Unhandled Error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  })
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection:', event.reason)
})

// Expose Query Client for debugging
if (import.meta.env.DEV) {
  // @ts-ignore
  window.queryClient = queryClient
}