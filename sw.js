/* Service worker: cache-first for the shell, so the app opens offline.

   CACHE is written by `npm run build` — it is a hash of every file in SHELL
   below, so republishing changes it on its own and the stale cache is dropped.
   Don't edit it by hand; edit SHELL and rebuild. See tools/cache-name.js. */
const CACHE = "mx-shortcuts-2bf93ce5eb2a";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./vendor/react.js",
  "./app.js",
  "./content/glossary.js",
  "./content/suffixes.js",
  "./content/sound.js",
  "./content/listening.js",
  "./content/verbs.js",
  "./content/preterite.js",
  "./content/imperfect.js",
  "./content/tenses.js",
  "./content/subjunctive.js",
  "./content/subjunctive-past.js",
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
