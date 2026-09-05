/* MONY service worker — app-shell caching, network-first pages, offline fallback. */
const VERSION = "mony-v2";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL]).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never touch Supabase or third parties
  if (url.pathname.startsWith("/auth")) return;

  // Pages: network first, fall back to cache, then offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGE_CACHE).then((c) => c.put(request, copy)).catch(() => undefined);
          return res;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE_URL)) || Response.error()),
    );
    return;
  }

  // Static assets: cache first
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || /\.(png|svg|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy)).catch(() => undefined);
            return res;
          }),
      ),
    );
  }
});
