# Español Mexicano — Shortcuts (PWA)

An installable, offline-capable build of the Mexican Spanish drill app.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole app. React and the UI are compiled and inlined — no CDN, no build step. |
| `manifest.webmanifest` | Name, icons, colours, and standalone display mode. |
| `sw.js` | Service worker. Caches the shell so the app opens with no network. |
| `icons/` | 192 / 512 / maskable / Apple touch icons, plus an SVG favicon. |

## Running it

**Locally**, from this folder:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

A service worker needs `http://localhost` or HTTPS. Opening `index.html`
straight off the disk still works — you just don't get offline caching or the
install prompt.

**Hosting**: drop the whole folder on any static host (GitHub Pages, Netlify,
Cloudflare Pages, S3). No server code required. Keep the relative paths intact;
everything is referenced as `./…` so it works from a subdirectory too.

## Installing

- **Android / Chrome / Edge** — an install prompt appears, or use ⋮ → *Install app*.
- **iOS Safari** — Share → *Add to Home Screen*. iOS ignores the manifest's
  install prompt but honours the icon, title, and standalone display.
- **Desktop Chrome / Edge** — an install icon appears in the address bar.

## Where your progress lives

Review scheduling is kept in `localStorage` under the `mx-pwa:` prefix, on that
device and in that browser. Installing to the home screen does *not* copy an
existing browser profile's data, so export first from **Review → Copy progress**
and paste it into the installed app if you want to carry history across.

Private/incognito windows fall back to in-memory storage: the app works, but
nothing survives a reload.

## Republishing

Change `CACHE` in `sw.js` (currently `"mx-shortcuts-v2"`) to a new value whenever
you update `index.html`. Without that bump, returning visitors keep getting the
cached shell.

## Offline caveat

Fonts load from Google Fonts on first run and are cached afterwards. If the very
first visit is offline, the app falls back to the system UI font — everything
still works, it just looks slightly different until fonts are fetched once.
