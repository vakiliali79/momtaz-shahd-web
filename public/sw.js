/*
 * Momtaz Shahd service worker: a small, safe offline layer.
 *  - Pages: always from the network; if that fails, the cached page or the
 *    offline page in the visitor's language.
 *  - Build assets (/_next/static, hashed and immutable), icons and fonts:
 *    cache first.
 * Bump VERSION to drop old caches.
 */
const VERSION = "v1";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const LOCALES = ["fa", "en", "ar"];
const OFFLINE = LOCALES.map((locale) => `/${locale}/offline`);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((cache) => cache.addAll(OFFLINE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => ![PAGES, ASSETS].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function localeOf(url) {
  const segment = new URL(url).pathname.split("/")[1];
  return LOCALES.includes(segment) ? segment : "fa";
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache private or dynamic data.
  if (url.pathname.startsWith("/api/") || /^\/(fa|en|ar)\/(admin|account|checkout|payment)/.test(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !/^\/(fa|en|ar)\/(cart|login|register)/.test(url.pathname)) {
            const copy = response.clone();
            caches.open(PAGES).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) ?? (await caches.match(`/${localeOf(request.url)}/offline`)) ?? Response.error()),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || /\.(woff2?|svg|png|webp|avif)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(ASSETS).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
