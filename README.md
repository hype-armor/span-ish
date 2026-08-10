# Español Mexicano — Shortcuts (PWA)

An installable, offline-capable build of the Mexican Spanish drill app.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The shell: metadata, the splash, and the script tags. Nothing else. |
| `content/` | The card decks and every word the app teaches, one readable module per topic. **Edit these.** |
| `styles.css` | Every style in the app. |
| `src/` | The app's source: the drill engine, the scheduler, and the sections. |
| `app.js` | Built from `src/`. Committed so the site stays static — don't edit it by hand. |
| `vendor/react.js` | React 18.3.1 and ReactDOM, vendored rather than loaded from a CDN. |
| `manifest.webmanifest` | Name, icons, colours, and standalone display mode. |
| `sw.js` | Service worker. Caches the shell so the app opens with no network. |
| `icons/` | 192 / 512 / maskable / Apple touch icons, plus an SVG favicon. |

Nothing is built at deploy time and nothing loads from a CDN: `app.js` is
committed, so the site is served exactly as it sits in the repo. The content
modules are plain scripts rather than ES modules, so the app also opens straight
off the disk.

Changing anything under `src/` means rebuilding:

```bash
npm install
npm run build     # writes app.js
npm test          # build is current + unit tests + content + smoke test
```

CI fails if `app.js` does not match what `src/` builds to, so a stale bundle
cannot reach the site.

## Adding or editing cards

Everything you'd want to change lives in `content/`. Each file assigns onto a
shared `window.MX` object:

```js
window.MX = window.MX || {};

window.MX.mexicanismos = [
  { mx: "carro", sp: "coche", en: "car", n: "Coche is understood but sounds foreign." },
  // add a line, reload, and it's in the rotation
];
```

Two rules:

- **Keys must be unique across all of `content/`.** The files load in order and
  assign onto the same object, so a repeated key silently overwrites the earlier
  one. That is why names are topic-scoped (`verbSentences`, not `sentences`).
- **A card's identity is derived from its content.** Review scheduling is keyed
  off fields like the Spanish word or the trigger phrase, so editing one of
  those retires the old card and introduces a new one. Fixing a typo in a `why`
  or a translation is free; changing the answer resets that card's history.

New cards appear in their own tab and in the interleaved Review deck
automatically. After editing, bump `CACHE` in `sw.js` — see Republishing.

Not every deck is drilled. `converterExamples` and `genderExceptionTable` are
display only — the chips under the Transformer's live converter and the
exceptions table on the Gender tab. A word in `converterExamples` has to end in
one of the suffixes in the same file, or the converter will say no rule matches
it.

The scripts load in this order, and it matters: `vendor/react.js`, then every
`content/` module, then `app.js` last.

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

**GitHub Pages**: `.github/workflows/pages.yml` publishes the repo root on every
push to `main`. It needs Settings → Pages → Source set to **GitHub Actions**
once; after that it is hands-off.

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

Using the app on more than one device gives you two histories that drift apart.
**Review → Paste to restore** offers two ways to reconcile them:

- **Merge into this device** folds the pasted history in. For an item both sides
  know, the more recent review wins — it is the freshest evidence about that
  memory, including when it is a lapse — and the running totals take the larger
  of the two. Merging the same export twice changes nothing the second time.
- **Replace everything** discards what is on this device.

Private/incognito windows fall back to in-memory storage: the app works, but
nothing survives a reload.

## Republishing

Change `CACHE` in `sw.js` (currently `"mx-shortcuts-v7"`) to a new value whenever
you change anything the service worker caches. Without that bump, returning
visitors keep getting the old shell.

`SHELL` in the same file lists every cached path. Add new files there — an
uncached `content/` module works online and breaks offline, which is the kind of
bug you only find on a plane.

## Offline caveat

Fonts load from Google Fonts on first run and are cached afterwards. If the very
first visit is offline, the app falls back to the system UI font — everything
still works, it just looks slightly different until fonts are fetched once.
