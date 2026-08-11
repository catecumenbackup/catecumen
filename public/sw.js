// sw.js — Service Worker de Catecumen (PWA)
// ─────────────────────────────────────────────────────────────────────────────
// Estrategia CONSERVADORA pensada para no romper nada:
//  · Navegaciones (HTML): network-first → siempre intenta la versión más nueva
//    del servidor; solo usa caché si no hay red (permite abrir offline).
//  · Estáticos con hash (assets de Vite, imágenes, iconos): cache-first, porque
//    su nombre cambia en cada build, así que servir de caché es seguro y rápido.
//  · NUNCA cachea llamadas a Supabase ni a la API (siempre red directa).
//
// Al publicar una versión nueva, sube el número de CACHE_VERSION para que el SW
// limpie la caché vieja.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_VERSION = "catecumen-v95";
const APP_SHELL = ["/", "/manifest.webmanifest", "/catecumenlogo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Nunca interceptar dominios externos (Supabase, Stripe, CDNs de datos, etc.)
  if (url.origin !== self.location.origin) return;

  // Navegaciones (documentos HTML): network-first
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Estáticos: cache-first con relleno desde red
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => cached)
    )
  );
});
