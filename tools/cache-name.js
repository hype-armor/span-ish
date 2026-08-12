/* Derives the service worker's cache name from the shell it caches.
 *
 * The cache is what makes the app work offline, and the only thing that ever
 * evicts it is the name changing: sw.js drops every cache that isn't the
 * current CACHE, and an unchanged sw.js is byte-identical to the installed
 * one, so the browser never even looks at the new files. Left to a human, that
 * bump gets forgotten on exactly the release that needed it, and the update
 * silently never arrives.
 *
 * So the name is a hash of the bytes it is protecting. Change any cached file
 * and the name changes with it; change nothing and it stays put.
 *
 * tools/build.js writes it. `npm run build:check` fails when it is stale.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PREFIX = "mx-shortcuts-";
const CACHE_LINE = /^const CACHE = "([^"]*)";$/m;
const DIGITS = 12;

/* The SHELL list in sw.js already says what gets cached, so read it back
   rather than keeping a second copy of the list here that could drift. */
function shellFiles(swText) {
  const block = swText.match(/^const SHELL = \[$([\s\S]*?)^\];$/m);
  if (!block) throw new Error("sw.js: could not find the SHELL list");
  const quoted = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (!quoted.length) throw new Error("sw.js: the SHELL list is empty");
  /* "./" and "./index.html" are the same file requested two ways. */
  const rel = quoted.map((p) => p.replace(/^\.\//, "") || "index.html");
  return [...new Set(rel)].sort();
}

/* Paths go into the hash alongside the bytes, so renaming or dropping a file
   moves the name even when the remaining contents are untouched. */
function cacheName(root) {
  const swText = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  const hash = crypto.createHash("sha256");
  for (const rel of shellFiles(swText)) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) throw new Error(`sw.js caches ./${rel}, which does not exist`);
    hash.update(rel);
    hash.update("\0");
    hash.update(fs.readFileSync(file));
    hash.update("\0");
  }
  return PREFIX + hash.digest("hex").slice(0, DIGITS);
}

function currentCacheName(root) {
  const swText = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  const line = swText.match(CACHE_LINE);
  if (!line) throw new Error('sw.js: could not find the `const CACHE = "…";` line');
  return line[1];
}

/* Returns the name written, and whether sw.js had to change to say so. */
function writeCacheName(root) {
  const file = path.join(root, "sw.js");
  const name = cacheName(root);
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(CACHE_LINE, `const CACHE = "${name}";`);
  if (after === before) return { name, changed: false };
  fs.writeFileSync(file, after);
  return { name, changed: true };
}

module.exports = { shellFiles, cacheName, currentCacheName, writeCacheName, PREFIX };
