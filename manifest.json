const CACHE_NAME = 'emopulse-cache-v1';
const urlsToCache = [
    '.',
    'index.html',
    'styles.css',
    'script.js',
    'favicon.png',
    'manifest.json'
];
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(urlsToCache))
        .then(() => self.skipWaiting())
    );
});
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        }).then(() => self.clients.claim())
    );
});
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            if (response) return response;
            return fetch(event.request).then(fetchResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                });
            });
        }).catch(() => {
            return caches.match('index.html');
        })
    );
});
