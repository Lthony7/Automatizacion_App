// BibleShorts Service Worker
// PWA offline shell - NO sensitive data cached

const CACHE_NAME = 'bibleshorts-shell-v1'
const OFFLINE_URL = '/offline'

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/content',
  '/review',
  '/calendar',
  '/offline',
  '/manifest.json',
  '/brand/Logo_Bible.png',
  '/brand/logo-icon.png',
  '/brand/pwa-icon-192.png',
  '/brand/pwa-icon-512.png',
]

// Install event - cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - network first, fallback to cache for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event

  // NEVER cache API requests, auth, or sensitive endpoints
  if (
    request.url.includes('/api/') ||
    request.url.includes('/auth/') ||
    request.method !== 'GET'
  ) {
    return
  }

  // For navigation requests - network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL)
          })
        })
    )
    return
  }

  // For static assets - cache first
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
            return response
          })
        )
      })
    )
  }
})

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    title: data.title || 'BibleShorts',
    body: data.body || '',
    icon: '/brand/pwa-icon-512.png',
    badge: '/brand/pwa-icon-192.png',
    data: data.data || {},
    tag: data.tag || 'bibleshorts-notification',
  }

  event.waitUntil(self.registration.showNotification(options.title, options))
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})

// Background sync for failed requests (future use)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Implement background sync logic here
      Promise.resolve()
    )
  }
})