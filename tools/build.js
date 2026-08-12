#!/usr/bin/env node
/* Bundles src/ into app.js, and stamps the service worker's cache name.
 *
 * React is not bundled: vendor/react.js loads first and puts it on
 * window.__MX_REACT, which src/react.js reads. The decks are not bundled
 * either — they are the files you edit, loaded as plain scripts.
 *
 * The cache name is a hash of everything sw.js caches, so republishing never
 * depends on remembering to bump it by hand — see tools/cache-name.js.
 *
 * Run:  npm run build          write app.js and the cache name
 *       npm run build:check    fail if either is out of date
 */
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");
const { cacheName, currentCacheName, writeCacheName } = require("./cache-name.js");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "app.js");
const check = process.argv.includes("--check");

const options = {
  entryPoints: [path.join(ROOT, "src/main.jsx")],
  bundle: true,
  format: "iife",
  target: ["es2020"],
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  minify: true,
  legalComments: "none",
  banner: {
    js:
      "/* Built from src/ by tools/build.js — do not edit by hand.\n" +
      "   Content lives in content/, styles in styles.css. */",
  },
};

esbuild
  .build(check ? { ...options, write: false } : { ...options, outfile: OUT })
  .then((result) => {
    for (const w of result.warnings) console.warn(w.text);

    if (!check) {
      console.log(`app.js: ${fs.statSync(OUT).size} bytes`);
      /* After app.js, so the hash covers what was just written. */
      const { name, changed } = writeCacheName(ROOT);
      console.log(`sw.js: cache ${name}${changed ? " (updated)" : " (unchanged)"}`);
      return;
    }

    const built = result.outputFiles[0].text;
    const committed = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
    if (built !== committed) {
      console.error(
        "app.js is out of date: it does not match what src/ builds to.\n" +
        "Run `npm run build` and commit the result.",
      );
      process.exit(1);
    }
    console.log("app.js matches src/");

    /* app.js is current, so hashing the files on disk is the same as hashing
       what a build would produce. */
    const want = cacheName(ROOT);
    const have = currentCacheName(ROOT);
    if (have !== want) {
      console.error(
        `sw.js caches under "${have}", but the files it caches hash to "${want}".\n` +
        "Every browser with the old shell would keep serving it.\n" +
        "Run `npm run build` and commit the result.",
      );
      process.exit(1);
    }
    console.log(`sw.js cache name matches the shell (${have})`);
  })
  .catch((err) => {
    /* esbuild prints its own diagnostics; ours would otherwise vanish. */
    if (err && !Array.isArray(err.errors)) console.error(String(err.message || err));
    process.exit(1);
  });
