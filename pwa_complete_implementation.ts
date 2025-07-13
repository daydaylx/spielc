// public/sw.js
// Das Magische Zauberbuch - Service Worker für vollständige Offline-Funktionalität
// Version: 1.0.0 - Production Ready

const CACHE_NAME = 'zauberbuch-v1.0.0';
const OFFLINE_URL = '/offline.html';
const GAME_DATA_CACHE = 'zauberbuch-gamedata-v1.0.0';
const ASSETS_CACHE = 'zauberbuch-assets-v1.0.0';

// Kritische Ressourcen für Offline-Funktionalität
const CRITICAL_RESOURCES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/static/media/logo.svg',
  '/static/media/background-magic.jpg',
  '/static/media/ui-sounds.mp3',
  '/fonts/MagicFont-Regular.woff2',
  '/fonts/MagicFont-Bold.woff2'
];

// Game Assets für Offline-Spiel
const GAME_ASSETS = [
  '/static/images/characters/',
  '/static/images/items/',
  '/static/images/scenes/',
  '/static/audio/background/',
  '/static/audio/effects/'
];

// API Endpoints für Offline-Sync
const API_ENDPOINTS = [
  '/api/stories',
  '/api/scenes',
  '/api/characters',
  '/api/save-slots',
  '/api/user-settings'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    Promise.all([
      // Cache kritische Ressourcen
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching critical resources');
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      
      // Initialisiere Game Data Cache
      caches.open(GAME_DATA_CACHE).then((cache) => {
        console.log('[SW] Initializing game data cache');
        return cache.put('/offline-indicator', new Response('offline'));
      }),
      
      // Initialisiere Assets Cache
      caches.open(ASSETS_CACHE).then((cache) => {
        console.log('[SW] Initializing assets cache');
        return Promise.resolve();
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    Promise.all([
      // Entferne alte Caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== GAME_DATA_CACHE && 
                cacheName !== ASSETS_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim alle Clients
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation complete');
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle verschiedene Ressourcentypen
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  } else if (url.pathname.includes('/static/images/') || 
             url.pathname.includes('/static/audio/')) {
    event.respondWith(handleGameAssets(request));
  } else if (url.pathname.endsWith('.js') || 
             url.pathname.endsWith('.css') || 
             url.pathname.endsWith('.woff2')) {
    event.respondWith(handleStaticAssets(request));
  } else {
    event.respondWith(handleNavigationRequest(request));
  }
});

// API Request Handler mit Offline-Sync
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(GAME_DATA_CACHE);
  
  try {
    // Versuche Online-Request
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache erfolgreiche Responses
      const responseClone = response.clone();
      await cache.put(request, responseClone);
      
      // Markiere als Online
      await cache.put('/online-indicator', new Response('online'));
      
      return response;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('[SW] API request failed, serving from cache:', url.pathname);
    
    // Versuche aus Cache zu laden
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Markiere als Offline
      await cache.put('/offline-indicator', new Response('offline'));
      
      // Füge Offline-Header hinzu
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Served-From', 'cache');
      headers.set('X-Cache-Date', new Date().toISOString());
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    // Fallback für kritische API Calls
    return handleAPIFallback(url.pathname);
  }
}

// Game Assets Handler (Images, Audio)
async function handleGameAssets(request) {
  const cache = await caches.open(ASSETS_CACHE);
  
  // Cache-First Strategie für Assets
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Asset request failed:', request.url);
    
    // Fallback für fehlende Assets
    if (request.url.includes('/images/')) {
      return generatePlaceholderImage();
    } else if (request.url.includes('/audio/')) {
      return generateSilentAudio();
    }
    
    return new Response('Asset not found', { status: 404 });
  }
}

// Static Assets Handler (JS, CSS, Fonts)
async function handleStaticAssets(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Cache-First für statische Assets
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Static asset request failed:', request.url);
    return new Response('Static asset not found', { status: 404 });
  }
}

// Navigation Request Handler
async function handleNavigationRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Versuche Online-Request
    const response = await fetch(request);
    
    if (response.ok) {
      return response;
    }
    
    throw new Error('Navigation response not ok');
    
  } catch (error) {
    console.log('[SW] Navigation request failed, serving offline page');
    
    // Lade Offline-Seite aus Cache
    const offlineResponse = await cache.match(OFFLINE_URL);
    
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback Offline-Seite
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Das Magische Zauberbuch - Offline</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .magic-circle { width: 100px; height: 100px; margin: 20px auto; 
                           border: 3px solid #8B5CF6; border-radius: 50%; 
                           animation: pulse 2s infinite; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          </style>
        </head>
        <body>
          <div class="magic-circle"></div>
          <h1>🔮 Das Magische Zauberbuch</h1>
          <p>Du befindest dich in einer magischen Offline-Dimension!</p>
          <p>Deine gespeicherten Abenteuer sind verfügbar.</p>
          <button onclick="location.reload()">🌟 Verbindung prüfen</button>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// API Fallback Responses
function handleAPIFallback(pathname) {
  const fallbackData = {
    '/api/stories': {
      stories: [],
      message: 'Offline - Nur gespeicherte Geschichten verfügbar'
    },
    '/api/user-settings': {
      settings: getDefaultOfflineSettings(),
      offline: true
    },
    '/api/save-slots': {
      slots: [],
      message: 'Offline - Lokale Speicherstände werden geladen'
    }
  };
  
  const data = fallbackData[pathname] || { error: 'Offline - Service nicht verfügbar' };
  
  return new Response(JSON.stringify(data), {
    headers: { 
      'Content-Type': 'application/json',
      'X-Served-From': 'fallback'
    }
  });
}

// Generiere Placeholder Image für fehlende Bilder
function generatePlaceholderImage() {
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#8B5CF6"/>
      <text x="100" y="100" font-family="Arial" font-size="40" fill="white" 
            text-anchor="middle" dominant-baseline="middle">🔮</text>
      <text x="100" y="140" font-family="Arial" font-size="12" fill="white" 
            text-anchor="middle">Offline</text>
    </svg>
  `;
  
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}

// Generiere Silent Audio für fehlende Sounds
function generateSilentAudio() {
  // Minimales MP3 (Silent)
  const silentMp3 = new Uint8Array([
    0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  
  return new Response(silentMp3, {
    headers: { 'Content-Type': 'audio/mpeg' }
  });
}

// Default Offline Settings
function getDefaultOfflineSettings() {
  return {
    theme: 'dark',
    language: 'de',
    soundEnabled: false, // Disabled in offline mode
    musicEnabled: false, // Disabled in offline mode
    textSpeed: 'medium',
    autoSave: true,
    offlineMode: true
  };
}

// Background Sync für Offline-Daten
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-game-data') {
    event.waitUntil(syncGameData());
  }
});

async function syncGameData() {
  console.log('[SW] Syncing game data...');
  
  try {
    const cache = await caches.open(GAME_DATA_CACHE);
    const pendingData = await cache.match('/pending-sync');
    
    if (pendingData) {
      const data = await pendingData.json();
      
      // Sync Save Slots
      if (data.saveSlots) {
        for (const slot of data.saveSlots) {
          await fetch('/api/save-slots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slot)
          });
        }
      }
      
      // Sync User Settings
      if (data.userSettings) {
        await fetch('/api/user-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.userSettings)
        });
      }
      
      // Entferne pending data
      await cache.delete('/pending-sync');
      console.log('[SW] Game data sync completed');
    }
    
  } catch (error) {
    console.error('[SW] Game data sync failed:', error);
  }
}

// Push Notifications für Game Events
self.addEventListener('push', (event) => {
  const options = {
    body: 'Ein neues Abenteuer wartet auf dich!',
    icon: '/static/media/logo-192.png',
    badge: '/static/media/badge-72.png',
    tag: 'game-notification',
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Spiel öffnen'
      },
      {
        action: 'dismiss',
        title: 'Später'
      }
    ]
  };
  
  if (event.data) {
    const payload = event.data.json();
    options.body = payload.message || options.body;
    options.data = payload.data || options.data;
  }
  
  event.waitUntil(
    self.registration.showNotification(
      'Das Magische Zauberbuch',
      options
    )
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Periodische Background Sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-game-content') {
    event.waitUntil(updateGameContent());
  }
});

async function updateGameContent() {
  console.log('[SW] Updating game content...');
  
  try {
    // Prüfe auf neue Stories
    const response = await fetch('/api/stories?updated_since=' + getLastUpdateTime());
    
    if (response.ok) {
      const data = await response.json();
      const cache = await caches.open(GAME_DATA_CACHE);
      
      await cache.put('/api/stories', new Response(JSON.stringify(data)));
      console.log('[SW] Game content updated');
    }
    
  } catch (error) {
    console.error('[SW] Game content update failed:', error);
  }
}

function getLastUpdateTime() {
  return localStorage.getItem('last-content-update') || new Date(0).toISOString();
}

// Message Handler für Client-Communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
        
      case 'CACHE_GAME_DATA':
        cacheGameData(event.data.payload);
        break;
        
      case 'GET_CACHE_STATUS':
        getCacheStatus().then(status => {
          event.ports[0].postMessage(status);
        });
        break;
        
      case 'CLEAR_CACHE':
        clearAllCaches().then(() => {
          event.ports[0].postMessage({ success: true });
        });
        break;
    }
  }
});

async function cacheGameData(data) {
  const cache = await caches.open(GAME_DATA_CACHE);
  
  for (const [key, value] of Object.entries(data)) {
    await cache.put(
      `/cached-data/${key}`,
      new Response(JSON.stringify(value))
    );
  }
}

async function getCacheStatus() {
  const caches_list = await caches.keys();
  const status = {};
  
  for (const cacheName of caches_list) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = keys.length;
  }
  
  return status;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

console.log('[SW] Service Worker script loaded');

// public/manifest.json
{
  "name": "Das Magische Zauberbuch",
  "short_name": "Zauberbuch",
  "description": "Ein immersives Textadventure-Spiel mit KI-generierten Inhalten",
  "version": "1.0.0",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#8B5CF6",
  "orientation": "portrait-primary",
  "scope": "/",
  "categories": ["games", "entertainment"],
  "lang": "de",
  
  "icons": [
    {
      "src": "/static/images/icon-72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/static/images/icon-96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/static/images/icon-128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/static/images/icon-144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/static/images/icon-152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/static/images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/static/images/icon-384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/static/images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/static/images/icon-maskable-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/static/images/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  
  "screenshots": [
    {
      "src": "/static/images/screenshot-wide.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Hauptspielbereich mit Story-Navigation"
    },
    {
      "src": "/static/images/screenshot-narrow.png", 
      "sizes": "720x1280",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Mobile Spielansicht"
    }
  ],
  
  "shortcuts": [
    {
      "name": "Neues Spiel",
      "short_name": "Neu",
      "description": "Starte ein neues Abenteuer",
      "url": "/new-game",
      "icons": [
        {
          "src": "/static/images/shortcut-new.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Spiel laden",
      "short_name": "Laden",
      "description": "Lade einen gespeicherten Spielstand",
      "url": "/load-game",
      "icons": [
        {
          "src": "/static/images/shortcut-load.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Story-Editor",
      "short_name": "Editor", 
      "description": "Erstelle eigene Geschichten",
      "url": "/admin",
      "icons": [
        {
          "src": "/static/images/shortcut-editor.png",
          "sizes": "96x96"
        }
      ]
    }
  ],
  
  "share_target": {
    "action": "/share-story",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "story",
          "accept": ["application/json", ".zauberbuch"]
        }
      ]
    }
  },
  
  "file_handlers": [
    {
      "action": "/import-story",
      "accept": {
        "application/json": [".json"],
        "application/zauberbuch": [".zauberbuch"]
      }
    }
  ],
  
  "protocol_handlers": [
    {
      "protocol": "web+zauberbuch",
      "url": "/story/%s"
    }
  ],
  
  "edge_side_panel": {
    "preferred_width": 320
  },
  
  "display_override": ["window-controls-overlay", "standalone", "browser"],
  
  "prefer_related_applications": false
}

// src/utils/pwaUtils.ts
import { utilityService } from '../services/utilityService';
import { storageService } from '../services/storageService';
import { eventBus } from './eventBus';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallOptions {
  showInstallButton: boolean;
  autoPrompt: boolean;
  customPromptDelay: number;
}

class PWAManager {
  private deferredPrompt: InstallPromptEvent | null = null;
  private isInstalled = false;
  private serviceWorker: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;
  private options: PWAInstallOptions = {
    showInstallButton: true,
    autoPrompt: false,
    customPromptDelay: 30000 // 30 seconds
  };

  async initialize(): Promise<void> {
    try {
      // Prüfe PWA Support
      if (!this.isPWASupported()) {
        console.warn('[PWA] PWA features not supported in this browser');
        return;
      }

      // Registriere Service Worker
      await this.registerServiceWorker();
      
      // Setup Install Prompt
      this.setupInstallPrompt();
      
      // Prüfe Installation Status
      this.checkInstallationStatus();
      
      // Setup Update Detection
      this.setupUpdateDetection();
      
      // Setup Online/Offline Detection
      this.setupNetworkDetection();
      
      // Setup Push Notifications
      await this.setupPushNotifications();
      
      console.log('[PWA] PWA Manager initialized successfully');
      eventBus.emit('pwaInitialized', { isInstalled: this.isInstalled });
      
    } catch (error) {
      console.error('[PWA] PWA initialization failed:', error);
      eventBus.emit('pwaError', { error });
    }
  }

  isPWASupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers not supported');
    }

    try {
      this.serviceWorker = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker registered:', this.serviceWorker.scope);

      // Listen for Service Worker updates
      this.serviceWorker.addEventListener('updatefound', () => {
        const newWorker = this.serviceWorker?.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true;
              eventBus.emit('pwaUpdateAvailable');
            }
          });
        }
      });

    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      throw error;
    }
  }

  setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] Install prompt available');
      e.preventDefault();
      this.deferredPrompt = e as InstallPromptEvent;
      
      eventBus.emit('pwaInstallAvailable');
      
      // Auto-prompt nach Delay (falls aktiviert)
      if (this.options.autoPrompt) {
        setTimeout(() => {
          this.showInstallPrompt();
        }, this.options.customPromptDelay);
      }
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App successfully installed');
      this.isInstalled = true;
      this.deferredPrompt = null;
      
      eventBus.emit('pwaInstalled');
      this.trackInstallEvent();
    });
  }

  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.warn('[PWA] No install prompt available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      console.log('[PWA] Install prompt result:', choiceResult.outcome);
      
      this.deferredPrompt = null;
      
      if (choiceResult.outcome === 'accepted') {
        eventBus.emit('pwaInstallAccepted');
        return true;
      } else {
        eventBus.emit('pwaInstallDismissed');
        return false;
      }
      
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }

  checkInstallationStatus(): void {
    // Prüfe verschiedene Installation-Indikatoren
    this.isInstalled = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (this.isInstalled) {
      console.log('[PWA] App is running as installed PWA');
      eventBus.emit('pwaRunningInstalled');
    }
  }

  setupUpdateDetection(): void {
    if (!this.serviceWorker) return;

    // Prüfe regelmäßig auf Updates
    setInterval(async () => {
      try {
        await this.serviceWorker?.update();
      } catch (error) {
        console.error('[PWA] Update check failed:', error);
      }
    }, 60000); // Prüfe jede Minute
  }

  async applyUpdate(): Promise<void> {
    if (!this.updateAvailable || !this.serviceWorker) {
      return;
    }

    try {
      const newWorker = this.serviceWorker.waiting;
      
      if (newWorker) {
        // Sende Skip-Waiting Message
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        
        // Warte auf Controller Change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      }
      
    } catch (error) {
      console.error('[PWA] Update application failed:', error);
    }
  }

  setupNetworkDetection(): void {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      console.log('[PWA] Network status:', isOnline ? 'online' : 'offline');
      
      eventBus.emit('networkStatusChanged', { isOnline });
      
      if (isOnline) {
        this.syncOfflineData();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial check
    updateOnlineStatus();
  }

  async setupPushNotifications(): Promise<void> {
    if (!('Notification' in window) || !('PushManager' in window)) {
      console.warn('[PWA] Push notifications not supported');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('[PWA] Push notifications enabled');
        await this.subscribeToPush();
      } else {
        console.log('[PWA] Push notifications denied');
      }
      
    } catch (error) {
      console.error('[PWA] Push notification setup failed:', error);
    }
  }

  async subscribeToPush(): Promise<void> {
    if (!this.serviceWorker) return;

    try {
      const subscription = await this.serviceWorker.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
        )
      });

      console.log('[PWA] Push subscription created:', subscription);
      
      // Sende Subscription an Server
      await this.sendSubscriptionToServer(subscription);
      
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });
      
    } catch (error) {
      console.error('[PWA] Failed to send subscription to server:', error);
    }
  }

  async syncOfflineData(): Promise<void> {
    if (!this.serviceWorker) return;

    try {
      // Registriere Background Sync
      await this.serviceWorker.sync.register('sync-game-data');
      console.log('[PWA] Background sync registered');
      
    } catch (error) {
      console.error('[PWA] Background sync registration failed:', error);
    }
  }

  async getCacheStatus(): Promise<Record<string, number>> {
    if (!this.serviceWorker) return {};

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      this.serviceWorker?.active?.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [messageChannel.port2]
      );
    });
  }

  async clearCache(): Promise<void> {
    if (!this.serviceWorker) return;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = () => {
        console.log('[PWA] Cache cleared successfully');
        resolve();
      };
      
      this.serviceWorker?.active?.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }

  async cacheGameData(data: Record<string, any>): Promise<void> {
    if (!this.serviceWorker) return;

    this.serviceWorker.active?.postMessage({
      type: 'CACHE_GAME_DATA',
      payload: data
    });
  }

  private async trackInstallEvent(): Promise<void> {
    try {
      const systemInfo = await utilityService.getSystemInfo();
      
      await storageService.set('pwa_install_data', {
        installedAt: new Date().toISOString(),
        systemInfo: systemInfo,
        installMethod: 'beforeinstallprompt'
      });
      
    } catch (error) {
      console.error('[PWA] Failed to track install event:', error);
    }
  }

  isInstallAvailable(): boolean {
    return this.deferredPrompt !== null;
  }

  isAppInstalled(): boolean {
    return this.isInstalled;
  }

  isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  setOptions(options: Partial<PWAInstallOptions>): void {
    this.options = { ...this.options, ...options };
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('[PWA] Notification permission not granted');
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/static/images/icon-192.png',
      badge: '/static/images/badge-72.png',
      tag: 'zauberbuch-notification',
      ...options
    };

    try {
      if (this.serviceWorker) {
        await this.serviceWorker.showNotification(title, defaultOptions);
      } else {
        new Notification(title, defaultOptions);
      }
      
    } catch (error) {
      console.error('[PWA] Failed to show notification:', error);
    }
  }
}

export const pwaManager = new PWAManager();

// src/hooks/usePWA.ts
import { useState, useEffect } from 'react';
import { pwaManager } from '../utils/pwaUtils';
import { eventBus } from '../utils/eventBus';

interface PWAState {
  isSupported: boolean;
  isInstalled: boolean;
  isInstallAvailable: boolean;
  isUpdateAvailable: boolean;
  isOnline: boolean;
  cacheStatus: Record<string, number>;
}

export const usePWA = () => {
  const [state, setState] = useState<PWAState>({
    isSupported: false,
    isInstalled: false,
    isInstallAvailable: false,
    isUpdateAvailable: false,
    isOnline: navigator.onLine,
    cacheStatus: {}
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializePWA = async () => {
      try {
        await pwaManager.initialize();
        
        setState({
          isSupported: pwaManager.isPWASupported(),
          isInstalled: pwaManager.isAppInstalled(),
          isInstallAvailable: pwaManager.isInstallAvailable(),
          isUpdateAvailable: pwaManager.isUpdateAvailable(),
          isOnline: navigator.onLine,
          cacheStatus: await pwaManager.getCacheStatus()
        });
        
      } catch (error) {
        console.error('PWA initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializePWA();

    // Event Listeners
    const handlePWAInstallAvailable = () => {
      setState(prev => ({ ...prev, isInstallAvailable: true }));
    };

    const handlePWAInstalled = () => {
      setState(prev => ({ 
        ...prev, 
        isInstalled: true, 
        isInstallAvailable: false 
      }));
    };

    const handlePWAUpdateAvailable = () => {
      setState(prev => ({ ...prev, isUpdateAvailable: true }));
    };

    const handleNetworkStatusChanged = ({ isOnline }: { isOnline: boolean }) => {
      setState(prev => ({ ...prev, isOnline }));
    };

    eventBus.on('pwaInstallAvailable', handlePWAInstallAvailable);
    eventBus.on('pwaInstalled', handlePWAInstalled);
    eventBus.on('pwaUpdateAvailable', handlePWAUpdateAvailable);
    eventBus.on('networkStatusChanged', handleNetworkStatusChanged);

    return () => {
      eventBus.off('pwaInstallAvailable', handlePWAInstallAvailable);
      eventBus.off('pwaInstalled', handlePWAInstalled);
      eventBus.off('pwaUpdateAvailable', handlePWAUpdateAvailable);
      eventBus.off('networkStatusChanged', handleNetworkStatusChanged);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    return await pwaManager.showInstallPrompt();
  };

  const update = async (): Promise<void> => {
    await pwaManager.applyUpdate();
  };

  const clearCache = async (): Promise<void> => {
    await pwaManager.clearCache();
    setState(prev => ({ ...prev, cacheStatus: {} }));
  };

  const cacheGameData = async (data: Record<string, any>): Promise<void> => {
    await pwaManager.cacheGameData(data);
  };

  const showNotification = async (title: string, options?: NotificationOptions): Promise<void> => {
    await pwaManager.showNotification(title, options);
  };

  const refreshCacheStatus = async (): Promise<void> => {
    const cacheStatus = await pwaManager.getCacheStatus();
    setState(prev => ({ ...prev, cacheStatus }));
  };

  return {
    ...state,
    isLoading,
    install,
    update,
    clearCache,
    cacheGameData,
    showNotification,
    refreshCacheStatus
  };
};