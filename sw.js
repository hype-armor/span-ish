/* Service worker: cache-first for the shell, so the app opens offline.
   Bump CACHE when you republish or the old shell will keep being served. */
const CACHE = "mx-shortcuts-v4";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./vendor/react.js",
  "./app.js",
  "./content/suffixes.js",
  "./content/sound.js",
  "./content/verbs.js",
  "./content/tenses.js",
  "./content/subjunctive.js",
  "./content/gender.js",
  "./content/mexicanismos.js",
  "./content/connectors.js",
  "./content/rules.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/icon.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  /* Navigations: try the network so a republished shell is picked up, and
     fall back to the cached page when offline. */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  /* Everything else: serve from cache, then fill the cache in the background.
     Google Fonts is cross-origin and opaque, which is fine to store as-is. */
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          if (url.origin === location.origin || url.hostname.endsWith("gstatic.com")
              || url.hostname.endsWith("googleapis.com")) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
    })
  );
});
