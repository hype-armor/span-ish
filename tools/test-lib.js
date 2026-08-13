#!/usr/bin/env node
/* Unit tests for the pure logic in src/lib.
 *
 * The smoke test drives the UI and the content linter reads the decks; this
 * covers the parts with real rules in them — merging two histories, and the
 * scheduler's intervals — where being subtly wrong would show up as drifting
 * review dates months later rather than as a broken page.
 *
 * Run: npm run test:lib
 */
const os = require("os");
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const ROOT = path.join(__dirname, "..");

/* The source is ESM; bundle it to CJS so it can be required here. */
function load(entry) {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "mx-test-")), "bundle.cjs");
  esbuild.buildSync({
    entryPoints: [path.join(ROOT, entry)],
    bundle: true,
    format: "cjs",
    platform: "node",
    outfile: out,
  });
  return require(out);
}

let failures = 0;
const fail = (msg) => { console.error("  ✗ " + msg); failures++; };
const pass = (msg) => console.log("  ✓ " + msg);

function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) pass(name);
  else fail(`${name}\n      expected ${e}\n      got      ${a}`);
}

/* ---------- merging two devices ---------- */

const { mergeProgress } = load("src/lib/merge.js");

const item = (over = {}) => ({
  right: 0, wrong: 0, streak: 0, ease: 2.4, interval: 0, due: 0, last: 0, lapses: 0, ...over,
});

{
  /* an item only the incoming side knows is taken as-is */
  const mine = { scores: {}, items: {} };
  const theirs = { scores: {}, items: { "a": item({ right: 3, streak: 3, last: 100 }) } };
  const { progress, added, updated } = mergeProgress(mine, theirs);
  check("adds items this device has never seen", [added, updated], [1, 0]);
  check("  and keeps their values", progress.items.a.right, 3);
}

{
  /* both sides know it: the more recent review wins */
  const mine = { scores: {}, items: { a: item({ streak: 5, interval: 30, last: 100, right: 5 }) } };
  const theirs = { scores: {}, items: { a: item({ streak: 0, interval: 0, last: 200, right: 6, wrong: 2 }) } };
  const { progress, added, updated } = mergeProgress(mine, theirs);
  check("counts an overlapping item as updated", [added, updated], [0, 1]);
  check("takes the streak from the more recent review", progress.items.a.streak, 0);
  check("even when the more recent review is a lapse", progress.items.a.interval, 0);
  check("counters never go backwards", [progress.items.a.right, progress.items.a.wrong], [6, 2]);
}

{
  /* the older side wins when it is the one with the later review */
  const mine = { scores: {}, items: { a: item({ streak: 4, interval: 20, last: 900 }) } };
  const theirs = { scores: {}, items: { a: item({ streak: 1, interval: 1, last: 100 }) } };
  const { progress } = mergeProgress(mine, theirs);
  check("keeps this device's item when it reviewed last", progress.items.a.interval, 20);
}

{
  /* merging is not destructive in either direction */
  const mine = { scores: {}, items: { a: item({ last: 10 }), b: item({ last: 20 }) } };
  const theirs = { scores: {}, items: { b: item({ last: 30 }), c: item({ last: 40 }) } };
  const { progress } = mergeProgress(mine, theirs);
  check("keeps the union of both sides", Object.keys(progress.items).sort(), ["a", "b", "c"]);
}

{
  /* module tallies */
  const mine = { scores: { rules: { right: 10, total: 20, best: 90 } }, items: {} };
  const theirs = { scores: { rules: { right: 30, total: 50, best: 70 } }, items: {} };
  const { progress } = mergeProgress(mine, theirs);
  check("takes the fuller run history", progress.scores.rules.total, 50);
  check("but the best score is a high-water mark", progress.scores.rules.best, 90);
}

{
  /* merging the same export twice changes nothing the second time */
  const mine = { scores: { a: { right: 1, total: 2, best: 50 } }, items: { x: item({ last: 5, right: 1 }) } };
  const theirs = { scores: { a: { right: 4, total: 6, best: 80 } }, items: { x: item({ last: 9, right: 4 }) } };
  const once = mergeProgress(mine, theirs).progress;
  const twice = mergeProgress(once, theirs).progress;
  check("merging twice is the same as merging once", twice, once);
}

/* ---------- the scheduler ---------- */

const srs = load("src/lib/srs.js");

{
  const first = srs.record(null, true, 0);
  check("a first correct answer waits three days", first.interval, 3);
  check("  and is due three days out", first.due, 3 * srs.DAY);

  const second = srs.record(first, true, 0);
  check("a second correct answer waits eight days", second.interval, 8);

  const third = srs.record(second, true, 0);
  check("after that the interval scales by ease", third.interval, Math.round(8 * second.ease));

  /* The ladder has to keep climbing, or long-term items never rest. */
  check("intervals grow", first.interval < second.interval && second.interval < third.interval, true);

  const missed = srs.record(third, false, 1000);
  check("a miss resets the interval", missed.interval, 0);
  check("  and is due immediately", missed.due, 1000);
  check("  and counts as a lapse", missed.lapses, 1);
  check("  and lowers the ease", missed.ease < third.ease, true);
}

{
  check("an unseen item is not due in the future", srs.isDue(undefined, 0), true);
  const item = srs.record(null, true, 0);
  check("a scheduled item is not due before its date", srs.isDue(item, 3 * srs.DAY - 1), false);
  check("  and is due on it", srs.isDue(item, 3 * srs.DAY), true);
}

/* ---------- review bands: what makes the schedule measurable ---------- */

{
  check("a card never seen is 'new'", srs.bandFor(null), "new");
  check("  and so is one with no answers yet", srs.bandFor(item()), "new");
  check("a card sitting at zero after a miss is 'relearning'",
    srs.bandFor(item({ right: 2, wrong: 1, interval: 0 })), "relearning");
  check("the first real interval lands in 1-3", srs.bandFor(item({ right: 1, interval: 3 })), "1-3");
  check("the second lands in 4-9", srs.bandFor(item({ right: 2, interval: 8 })), "4-9");
  check("a long interval lands in 30+", srs.bandFor(item({ right: 5, interval: 46 })), "30+");

  /* the band is taken from the interval that elapsed, not the one just set */
  let reviews = {};
  reviews = srs.tallyReview(reviews, item({ right: 1, interval: 3 }), true);
  reviews = srs.tallyReview(reviews, item({ right: 1, interval: 3 }), false);
  reviews = srs.tallyReview(reviews, null, true);
  check("tallies land in the right bands", reviews, { "1-3": { right: 1, wrong: 1 }, new: { right: 1, wrong: 0 } });
}

{
  /* review tallies survive a merge, and merging twice still changes nothing */
  const mine = { scores: {}, items: {}, reviews: { "1-3": { right: 10, wrong: 2 } } };
  const theirs = { scores: {}, items: {}, reviews: { "1-3": { right: 4, wrong: 5 }, "4-9": { right: 7, wrong: 1 } } };
  const once = mergeProgress(mine, theirs).progress;
  check("merged bands keep the larger side", once.reviews["1-3"], { right: 10, wrong: 5 });
  check("  and pick up bands only the other side had", once.reviews["4-9"], { right: 7, wrong: 1 });
  const twice = mergeProgress(once, theirs).progress;
  check("merging bands twice is the same as once", twice.reviews, once.reviews);
}

{
  /* a round never repeats a card and never exceeds the size asked for */
  const cards = Array.from({ length: 40 }, (_, i) => ({ id: "c" + i }));
  const round = srs.buildRound(cards, 10, {}, 0);
  check("a round is the size requested", round.length, 10);
  check("  with no repeats", new Set(round.map((c) => c.id)).size, 10);

  const small = srs.buildRound(cards.slice(0, 4), 10, {}, 0);
  check("a short deck yields what it has", small.length, 4);
}

/* ---------- the Transformer's live converter ---------- */

/* The machine is a heuristic and will never handle every English word, but it
   has to reproduce the Spanish the deck itself documents: those pairs are what
   the reference table prints and what the one-tap chips feed it, so a mismatch
   is the app contradicting itself in public. Written accents are excluded,
   because the note under the box says the machine leaves them off. */
{
  global.window = global;
  const CONTENT = path.join(ROOT, "content");
  for (const f of fs.readdirSync(CONTENT)) require(path.join(CONTENT, f));
  const { convert } = load("src/lib/suffix.js");

  const bare = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const render = (word) => {
    const r = convert(word);
    return r && r.ok ? r.stem + r.tail : "(no rule matches)";
  };

  const wrong = [];
  for (const rule of global.MX.suffixes) {
    for (const [english, spanish] of rule.ex) {
      const got = render(english);
      if (bare(got) !== bare(spanish)) wrong.push(`${english} → ${got}, but the deck says ${spanish}`);
    }
  }
  check("every documented suffix example converts to the Spanish beside it", wrong, []);

  /* The chips are the highest-traffic path into the machine. */
  check("every one-tap example matches a rule",
    global.MX.converterExamples.filter((w) => render(w) === "(no rule matches)"), []);

  /* -mente hangs off the feminine adjective, and which vowel that needs is the
     part the machine used to get wrong. */
  check("rapidly takes the linking a", render("rapidly"), "rapidamente");
  check("normally does not", render("normally"), "normalmente");
  check("constantly takes an e", render("constantly"), "constantemente");
  check("absolutely drops the English silent e first", render("absolutely"), "absolutamente");
}

/* ---------- the service worker's cache name ---------- */

/* This is the one rule where being wrong is invisible: a cache name that fails
   to move means users keep the old app forever and nothing anywhere errors.
   So test that it moves for each way the shell can change, and that it holds
   still otherwise — a name that churned on every build would evict the offline
   cache for no reason. */
{
  const cn = require("./cache-name.js");

  const fixture = (files) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mx-sw-"));
    for (const [rel, body] of Object.entries(files)) {
      fs.mkdirSync(path.join(dir, path.dirname(rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), body);
    }
    return dir;
  };
  const SW = (shell) =>
    `const CACHE = "placeholder";\nconst SHELL = [\n${shell.map((p) => `  "${p}",`).join("\n")}\n];\n`;

  const files = { "index.html": "<h1>hi</h1>", "app.js": "one();", "notes.md": "not shipped" };
  const shell = ["./", "./index.html", "./app.js"];

  const dir = fixture({ ...files, "sw.js": SW(shell) });
  const base = cn.cacheName(dir);

  check('"./" and "./index.html" are one file, not two',
    cn.shellFiles(SW(shell)), ["app.js", "index.html"]);
  check("the same shell hashes the same way twice", cn.cacheName(dir), base);

  fs.writeFileSync(path.join(dir, "notes.md"), "still not shipped, edited");
  check("editing a file the shell does not cache leaves it alone", cn.cacheName(dir), base);

  fs.writeFileSync(path.join(dir, "app.js"), "two();");
  const edited = cn.cacheName(dir);
  check("editing a cached file moves it", edited !== base, true);

  /* Same bytes, different name: without the path in the hash this collides. */
  const renamed = fixture({ "index.html": files["index.html"], "bundle.js": "two();",
    "sw.js": SW(["./", "./index.html", "./bundle.js"]) });
  check("renaming a cached file moves it", cn.cacheName(renamed) !== edited, true);

  /* Dropping a file is a shell change too, and the easiest one to miss. */
  const fewer = fixture({ "index.html": files["index.html"], "sw.js": SW(["./", "./index.html"]) });
  check("dropping a file from the shell moves it", cn.cacheName(fewer) !== base, true);

  const first = cn.writeCacheName(dir);
  check("writing stamps the derived name", [first.name, first.changed], [edited, true]);
  check("  and says so in sw.js", cn.currentCacheName(dir), edited);
  check("writing again is a no-op", cn.writeCacheName(dir), { name: edited, changed: false });

  const throws = (fn) => { try { fn(); return null; } catch (e) { return e.message; } };
  const gone = fixture({ "sw.js": SW(["./index.html"]) });
  check("a shell entry with no file behind it is an error",
    throws(() => cn.cacheName(gone)), "sw.js caches ./index.html, which does not exist");
  check("so is a sw.js with no SHELL list",
    throws(() => cn.shellFiles('const CACHE = "x";')), "sw.js: could not find the SHELL list");
}

if (failures) { console.error(`\n${failures} failure${failures === 1 ? "" : "s"}`); process.exit(1); }
console.log("\nlib OK");
