const CACHE_VERSION = 'garfado-v4'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const MAP_CACHE = `${CACHE_VERSION}-map`
const PHOTO_CACHE = `${CACHE_VERSION}-photos`

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== STATIC_CACHE && k !== MAP_CACHE && k !== PHOTO_CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Tiles do mapa — Cache First
  if (url.hostname.includes('cartocdn.com') || url.hostname.includes('openstreetmap.org')) {
    e.respondWith(cacheFirst(request, MAP_CACHE))
    return
  }

  // Fotos do Supabase Storage — Cache First
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/')) {
    e.respondWith(cacheFirst(request, PHOTO_CACHE))
    return
  }

  // API Supabase — sempre rede
  if (url.hostname.includes('supabase.co') || url.hostname.includes('googleapis.com')) {
    e.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ error: 'offline' }), { status: 503 })))
    return
  }

  // Assets Next.js com hash — Cache First (são imutáveis)
  if (url.pathname.startsWith('/_next/static/chunks/') || url.pathname.startsWith('/_next/static/css/')) {
    e.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Páginas e outros assets — sempre rede
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE)
        return cache.match('/offline.html') || new Response('Offline', { status: 503 })
      })
    )
    return
  }

  // Default — rede com fallback
  e.respondWith(fetch(request).catch(() => new Response('Offline', { status: 503 })))
})

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}
