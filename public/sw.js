const CACHE_VERSION = "v1";
const STATIC_CACHE = `calcoder-static-${CACHE_VERSION}`;
const PAGE_CACHE = `calcoder-pages-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

const STATIC_ASSETS = [
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/icon.svg",
  "/apple-icon.svg",
  "/manifest.webmanifest",
  "/robots.txt",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(STATIC_ASSETS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith("calcoder-") && name !== STATIC_CACHE && name !== PAGE_CACHE)
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGE_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offlineCache = await caches.match(OFFLINE_URL);
    if (offlineCache) return offlineCache;
    return new Response("Offline", { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || (await fetchPromise);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    if (url.hostname === "pagead2.googlesyndication.com") return;
    return;
  }

  if (request.method !== "GET") return;

  if (url.pathname === "/sw.js") return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname.startsWith("/fonts/") || url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?)$/)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname === "/" || url.pathname.startsWith("/offline")) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
