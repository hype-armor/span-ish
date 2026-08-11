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

{
  /* a round never repeats a card and never exceeds the size asked for */
  const cards = Array.from({ length: 40 }, (_, i) => ({ id: "c" + i }));
  const round = srs.buildRound(cards, 10, {}, 0);
  check("a round is the size requested", round.length, 10);
  check("  with no repeats", new Set(round.map((c) => c.id)).size, 10);

  const small = srs.buildRound(cards.slice(0, 4), 10, {}, 0);
  check("a short deck yields what it has", small.length, 4);
}

if (failures) { console.error(`\n${failures} failure${failures === 1 ? "" : "s"}`); process.exit(1); }
console.log("\nlib OK");
