const CACHE_NAME = 'zen-focus-v1';
const ASSETS = [
  'index.html',
  'assets/rain.mp3',
  'assets/Ambience.mp3',
  'assets/Campfire.mp3',
  'assets/Ocean Waves.mp3'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
