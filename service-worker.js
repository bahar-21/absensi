const CACHE_NAME = 'absensi-lawawoi-v7.0.1';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

// ===============================
// INSTALL
// ===============================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(() => {
        // Jangan langsung mengambil alih aplikasi.
        // Tunggu sampai pengguna menekan UPDATE SEKARANG.
        console.log('[SW] Versi baru berhasil di-install.');
      })
  );
});


// ===============================
// ACTIVATE
// ===============================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              console.log('[SW] Hapus cache lama:', key);
              return caches.delete(key);
            }
            return null;
          })
        );
      })
      .then(() => self.clients.claim())
  );
});


// ===============================
// PESAN DARI INDEX.HTML
// ===============================
self.addEventListener('message', (event) => {

  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

});


// ===============================
// FETCH
// ===============================
self.addEventListener('fetch', (event) => {

  // Hanya proses GET
  if (event.request.method !== 'GET') {
    return;
  }

  const requestURL = new URL(event.request.url);

  // ==========================================
  // HTML → NETWORK FIRST
  // ==========================================
  if (
    event.request.mode === 'navigate' ||
    requestURL.pathname.endsWith('.html')
  ) {

    event.respondWith(
      fetch(event.request)
        .then((response) => {

          const responseClone = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });

          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );

    return;
  }


  // ==========================================
  // ASET STATIS → CACHE FIRST
  // ==========================================
  event.respondWith(
    caches.match(event.request)
      .then((response) => {

        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((networkResponse) => {

            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === 'basic'
            ) {

              const responseClone = networkResponse.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }

            return networkResponse;
          });

      })
  );

});
