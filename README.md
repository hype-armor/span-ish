# Español Mexicano — Shortcuts (PWA)

An installable, offline-capable build of the Mexican Spanish drill app.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The shell: metadata, the splash, and the script tags. Nothing else. |
| `content/` | The card decks and every word the app teaches, one readable module per topic. **Edit these.** |
| `styles.css` | Every style in the app. |
| `src/` | The app's source: the mission engine, the scheduler, the game layer, and the screens. |
| `app.js` | Built from `src/`. Committed so the site stays static — don't edit it by hand. |
| `vendor/react.js` | React 18.3.1 and ReactDOM, vendored rather than loaded from a CDN. |
| `manifest.webmanifest` | Name, icons, colours, and standalone display mode. |
| `sw.js` | Service worker. Caches the shell so the app opens with no network. Its `CACHE` name is generated — see Republishing. |
| `icons/` | 192 / 512 / maskable / Apple touch icons, plus an SVG favicon. |
| `docs/learning-design.md` | Why the app drills the way it does, and the research behind it. Read before changing drill mechanics. |

Inside `src/`:

| Directory | Purpose |
| --- | --- |
| `src/lib/` | The parts with rules in them and no DOM: the scheduler (`srs.js`), the game layer (`game.js`), the decks (`decks.js`), grading (`text.js`), merging two devices (`merge.js`). `tools/test-lib.js` drives these directly. |
| `src/screens/` | One file per place you can be: the intro, the map, a region, its codex, today, the lab. |
| `src/components/` | The pieces screens are built from — the mission engine, the pager, the heads-up strip, the dock, the glossary. |
| `src/codex/` | The reference material, as paged screens. Prose and tables only; it reads the decks and teaches nothing the drills do not. |

### How it is put together

There are no tabs and there is no scrolling. The app is one fixed frame —
a heads-up strip, a stage, and a dock — and everything happens inside it:

- A **first run** opens on one screen that says what the app is and how it
  works, then never shows it again. The old masthead said that on every screen
  forever; a map of glyphs says nothing at all.
- **La Ruta** is the map: eleven regions on a serpentine path, one per topic,
  each opening when the one before it has had two missions cleared.
- A **region** holds its codex (that topic's rules, tables and examples) and
  four missions that escalate: Recon, the region's signature mode, sudden
  death, and a boss built out of the items you personally keep missing.
- **Hoy** is the day: the goal, the streak, three quests, and the shape of what
  you know. **El Laboratorio** is the same schedule diagnostics as before, plus
  export and import.

Content that does not fit its screen is *paged*, never scrolled
(`src/components/Pages.jsx`). `npm run smoke` asserts that nothing scrolls, on
every screen, at four viewport sizes — it is the check most likely to catch a
regression, because a long explanation or a small phone breaks the rule
silently.

The game layer is documented in [`docs/learning-design.md`](docs/learning-design.md)
under *The game layer*, including which mechanics were deliberately not built.
Read it before adding one: the constraint the whole design runs on is that
every reward is a readout of the review schedule rather than a currency of its
own.

Nothing is built at deploy time and nothing loads from a CDN: `app.js` is
committed, so the site is served exactly as it sits in the repo. The content
modules are plain scripts rather than ES modules, so the app also opens straight
off the disk.

Changing anything under `src/` means rebuilding:

```bash
npm install
npm run build     # writes app.js and the service worker's cache name
npm test          # build is current + unit tests + content + smoke test
```

CI fails if `app.js` does not match what `src/` builds to, so a stale bundle
cannot reach the site — and equally if the cache name in `sw.js` does not match
the files it caches, so a stale *shell* cannot outlive the release either. Both
are fixed the same way: run `npm run build` and commit the result.

`npm run stats` prints the composition of the card set — how much is typed
production versus recognition, how much is practised in context. `docs/learning-design.md`
argues about those numbers, so re-run it after adding content rather than
trusting the snapshot in the document.

### Checking a refactor changed nothing

```bash
npm run visual                        # against HEAD
node tools/visual-diff.js --against main
```

Renders every screen in the working tree and in another revision and compares
the pixels. Progression is seeded so that the regions behind it are rendered
too — on a fresh save ten of the eleven would be locked and never compared. There are no baseline images in the repo — the other side is
materialised from git on demand, so there is nothing to keep up to date.

It exists because `app.js` is generated now, so a refactor can change what the
page looks like without changing anything a unit test or the smoke test would
notice. The bug that prompted it was `{" "}` in JSX: it renders as its own DOM
text node, which moved an `<em>` by a hundredth of a pixel and changed its
antialiasing. The markup compared byte-identical; only the pixels disagreed.

The harness renders one side twice and requires it to match itself before
comparing anything, so a green run cannot mean "the comparison was looking at
nothing". CI runs it on pull requests as a report rather than a gate.

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

Before writing cards, skim the checklist at the end of
[`docs/learning-design.md`](docs/learning-design.md) — particularly the part
about distractors. A wrong answer you can rule out on sight makes the card free,
and that is the easiest thing to get wrong.

Two rules:

- **Keys must be unique across all of `content/`.** The files load in order and
  assign onto the same object, so a repeated key silently overwrites the earlier
  one. That is why names are topic-scoped (`verbSentences`, not `sentences`).
- **A card's identity is derived from its content.** Review scheduling is keyed
  off fields like the Spanish word or the trigger phrase, so editing one of
  those retires the old card and introduces a new one. Fixing a typo in a `why`
  or a translation is free; changing the answer resets that card's history.

New cards appear in their own region and in the interleaved Arena deck
automatically. After editing, run `npm run build` — see Republishing.

`content/glossary.js` is not a deck at all. It defines the grammar words —
subjunctive, preterite, stem — and any of them appearing in prose, in a card's
instruction or in its explanation becomes clickable, opening a definition. Only
the first mention in a block is linked, so a paragraph about the subjunctive does
not turn into a page of buttons. The linter rejects a term two entries both claim,
and a term that appears nowhere in the app, since that one could never be clicked.

Not every deck is drilled. `converterExamples` and `genderExceptionTable` are
display only — the chips under the Transformer's live converter and the
exceptions table in El o La's codex. A word in `converterExamples` has to end in
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
existing browser profile's data, so export first from **Lab → Copy progress**
and paste it into the installed app if you want to carry history across.

Using the app on more than one device gives you two histories that drift apart.
**Lab → Paste to restore** offers two ways to reconcile them:

- **Merge into this device** folds the pasted history in. For an item both sides
  know, the more recent review wins — it is the freshest evidence about that
  memory, including when it is a lapse — and the running totals take the larger
  of the two. Merging the same export twice changes nothing the second time.
- **Replace everything** discards what is on this device.

Private/incognito windows fall back to in-memory storage: the app works, but
nothing survives a reload.

## Republishing

Run `npm run build` and commit what it changes. That is the whole procedure.

The service worker only drops its old cache when `CACHE` in `sw.js` changes, so
a forgotten bump means returning visitors keep the old shell indefinitely —
with nothing failing anywhere to say so. Rather than trust that to memory,
`npm run build` writes `CACHE` as a hash of every file in `SHELL`
(`tools/cache-name.js`), and `npm run build:check` fails in CI when the
committed name no longer matches the committed files. Change a deck, the name
moves; change nothing, it holds still.

An installed app takes two reloads to pick up a release: the first fetches and
activates the new worker, the second runs it.

`SHELL` in `sw.js` lists every cached path, and is still yours to maintain. Add
new files there — an uncached `content/` module works online and breaks offline,
which is the kind of bug you only find on a plane. CI checks that every script
and stylesheet in the repo is listed.

## Offline caveat

Fonts load from Google Fonts on first run and are cached afterwards. If the very
first visit is offline, the app falls back to the system UI font — everything
still works, it just looks slightly different until fonts are fetched once.
