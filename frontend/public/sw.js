const CACHE_NAME = 'arbix-pwa-v3';

const CORE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-maskable.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.resolve()
      .then(() => caches.keys())
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .catch(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  const isNavigation = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  const isAuthNavigation = isNavigation && (
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/profile') ||
    url.pathname.startsWith('/admin')
  );

  if (isNavigation) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          if (!isAuthNavigation) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => null);
          }
          return res;
        })
        .catch(async () => {
          if (!isAuthNavigation) {
            const cached = await caches.match(req);
            if (cached) return cached;
          }
          const offline = await caches.match('/offline.html');
          return offline || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req, { cache: 'no-store' })
        .then((res) => {
          if (res && res.ok) {
            const cc = (res.headers.get('cache-control') || '').toLowerCase();
            if (!cc.includes('no-store') && !cc.includes('no-cache') && !cc.includes('private')) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => null);
            }
          }
          return res;
        })
        .catch(() => cached);
    }),
  );
});
