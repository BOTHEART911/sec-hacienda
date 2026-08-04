const CACHE_NAME = 'sec-hacienda-v7';
const APP_SHELL = ['./', './index.html', './app.js', './styles.css', './js/assets.js', './js/identidad.js', './css/identidad.css', './js/configuracion.js', './css/configuracion.css', './js/base-visual.js', './css/base-visual.css', './js/capa-12-antidoble.js', './js/en-vivo.js', './js/alcance.js', './manifest.webmanifest'];

/* FASE 2: las imágenes y sonidos viven ahora en este repo (img/ y sound/).
   Son archivos que no cambian: caché primero. Así se bajan UNA vez y después
   la app abre sin red. NO se precargan en install (son ~26 MB): cada archivo
   entra a la caché la primera vez que la app lo pide. */
/* FASE 3: los archivos de img/ se reemplazaron por versiones optimizadas con el
   MISMO nombre. Si no se sube la versión de esta caché, el que ya tiene la app
   instalada se queda con los pesados para siempre. */
const CACHE_ARCHIVOS = 'sec-hacienda-archivos-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    /* FASE 4: uno por uno, NO addAll. addAll es atómico: si un solo archivo
       falta (como pasó con css/base-visual.css) se cae la precarga entera y
       la app se queda sin caché para trabajar sin red. */
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(APP_SHELL.map(u => cache.add(u).catch(() => {})))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      /* OJO: en GitHub Pages todas las apps comparten origen. Solo se borran
         las cachés de ESTA app, nunca las de las otras (contratista, etc.). */
      Promise.all(
        keys.filter(k => k.indexOf('sec-hacienda-') === 0 && k !== CACHE_NAME && k !== CACHE_ARCHIVOS)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // version.json SIEMPRE desde la red, nunca caché
  if (url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(req, { cache: 'no-store' }).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Imágenes y sonidos del repo: caché primero (no cambian nunca)
  if (url.origin === location.origin && /\/(img|sound)\//.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_ARCHIVOS).then(cache => cache.put(req, copy)).catch(() => {});
        }
        return res;
      }))
    );
    return;
  }

  // HTML, JS y CSS: network-first (red primero, caché como respaldo)
  const isAppShell = /\.(html|js|css)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (isAppShell && url.origin === location.origin) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Resto: red con fallback a caché
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
