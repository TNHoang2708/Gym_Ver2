self.addEventListener('install', (event) => {
  console.log('Forge Service Worker Installed')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Forge Service Worker Activated')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // A minimal fetch listener is required by browsers to trigger the PWA "Add to Home Screen" prompt.
  // In a full offline implementation, we would intercept and cache requests here.
})
