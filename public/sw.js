const CACHE_NAME = 'flaredocs-shell-v2'
const SHELL_ASSETS = ['/', '/manifest.webmanifest', '/brand-icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (request.method !== 'GET') {
    return
  }

  if (url.origin !== self.location.origin) {
    return
  }

  // Never cache API responses, auth state, or captcha data.
  if (url.pathname.startsWith('/api/')) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/').then((response) => response || Response.error())
      )
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached
      }

      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse.ok || networkResponse.type !== 'basic') {
            return networkResponse
          }

          const isStaticAsset =
            url.pathname.startsWith('/_nuxt/') ||
            url.pathname.startsWith('/images/') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.jpg') ||
            url.pathname.endsWith('.jpeg') ||
            url.pathname.endsWith('.webp') ||
            url.pathname.endsWith('.woff2') ||
            url.pathname.endsWith('.webmanifest')

          if (!isStaticAsset) {
            return networkResponse
          }

          const cloned = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned))
          return networkResponse
        })
        .catch(() => Response.error())
    })
  )
})
