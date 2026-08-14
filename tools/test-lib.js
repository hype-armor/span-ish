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

/* ---------- the game layer ---------- */

/* This is the half of the app with the strongest pull towards being wrong in
   a flattering direction. Every rule here exists to stop a number going up
   for something that was not learning, so the tests are mostly about what
   does *not* pay out. */
{
  const g = load("src/lib/game.js");
  const DAY = 864e5;
  const at = (key, hour = 12) => new Date(`${key}T${String(hour).padStart(2, "0")}:00:00`).getTime();

  /* --- XP is paid for scheduled retrievals, and only for those --- */

  check("a due item pays full", g.xpForAnswer({ right: true, wasDue: true, combo: 0 }), g.XP_DUE);
  check("an early one pays a token", g.xpForAnswer({ right: true, wasDue: false, combo: 0 }), g.XP_EARLY);
  check("a miss still pays something, because a miss with feedback teaches",
    g.xpForAnswer({ right: false, wasDue: true, combo: 9 }), g.XP_MISS);
  check("the combo multiplies a due answer and nothing else", [
    g.xpForAnswer({ right: true, wasDue: true, combo: 9 }),
    g.xpForAnswer({ right: true, wasDue: false, combo: 9 }),
  ], [g.XP_DUE * 4, g.XP_EARLY]);
  check("the multiplier is capped", [g.comboMultiplier(0), g.comboMultiplier(9), g.comboMultiplier(300)], [1, 4, 4]);

  const due = (n) => Array.from({ length: n }, (_, i) => ({ id: "d" + i, right: true, wasDue: true }));
  const early = (n) => Array.from({ length: n }, (_, i) => ({ id: "e" + i, right: true, wasDue: false }));

  check("a round of mostly-unscheduled material is cram", g.isCram(early(9).concat(due(1))), true);
  check("a round of scheduled material is not", g.isCram(due(6).concat(early(4))), false);
  check("an empty round is not cram either", g.isCram([]), false);

  {
    /* The same ten right answers, worth wildly different amounts depending on
       whether the scheduler asked for them. */
    const now = at("2025-03-10");
    const real = g.recordMission(g.freshGame(now), { answers: due(10), mode: "plain", region: "rules", stage: "recon", score: { won: true }, now });
    const crammed = g.recordMission(g.freshGame(now), { answers: early(10), mode: "plain", region: "rules", stage: "recon", score: { won: true }, now });
    check("replaying easy material earns a fraction of doing the work", crammed.xp < real.xp / 5, true);
    check("and only scheduled answers count towards the day's goal",
      [real.game.today.due, crammed.game.today.due], [10, 0]);
  }

  /* --- the streak counts days the work was done --- */

  {
    let game = g.freshGame(at("2025-03-01"));
    game = g.markGoal(game, at("2025-03-01"));
    check("meeting the goal starts a streak", game.streak.count, 1);
    game = g.markGoal(game, at("2025-03-01", 22));
    check("meeting it twice in one day does not count twice", game.streak.count, 1);
    game = g.markGoal(game, at("2025-03-02"));
    check("the next day continues it", game.streak.count, 2);

    /* A missed day spends a banked grace day rather than ending it. A streak
       that shatters on the first bad day stops being worth protecting. */
    const skipped = g.markGoal(game, at("2025-03-04"));
    check("one missed day is survivable while a grace day is banked", [skipped.streak.count, skipped.streak.freezes], [3, 0]);
    check("two missed days are not", g.markGoal(game, at("2025-03-05")).streak.count, 1);
    check("and neither is one with nothing banked", g.markGoal(skipped, at("2025-03-06")).streak.count, 1);
  }

  {
    /* Seven days in a row earns the grace day back. */
    let game = g.freshGame(at("2025-05-01"));
    for (let d = 1; d <= 7; d++) game = g.markGoal(game, at(`2025-05-0${d}`));
    check("a week of work banks a grace day", [game.streak.count, game.streak.freezes], [7, 2]);
  }

  {
    const game = g.markGoal(g.freshGame(at("2025-03-01")), at("2025-03-01"));
    check("a streak claimed today is safe", g.streakStatus(game, at("2025-03-01", 23)).atRisk, false);
    check("yesterday's is alive but unclaimed", g.streakStatus(game, at("2025-03-02")).atRisk, true);
    check("older than the grace allows is gone", g.streakStatus(game, at("2025-03-09")).alive, false);
    check("and reports what was lost rather than pretending", g.streakStatus(game, at("2025-03-09")).lost, 1);
  }

  check("days are counted on the calendar, not in milliseconds", [
    g.daysBetween("2025-03-01", "2025-03-02"),
    g.daysBetween("2025-03-09", "2025-03-10"), // a daylight-saving boundary in the US
    g.daysBetween("2025-12-31", "2026-01-01"),
  ], [1, 1, 1]);

  /* --- the level is made of mastery, which cannot be ground --- */

  const items = (spec) => Object.fromEntries(spec.map(([id, over], i) => [id, {
    right: 1, wrong: 0, streak: 1, ease: 2.4, interval: 0, due: 0, last: 1, lapses: 0, ...over,
  }]));

  check("rank reads straight off the schedule", [
    g.rankOf(undefined),
    g.rankOf({ right: 0, wrong: 0, streak: 0, interval: 0 }),
    g.rankOf({ right: 3, wrong: 2, streak: 0, interval: 0 }),
    g.rankOf({ right: 3, wrong: 0, streak: 3, interval: 5 }),
    g.rankOf({ right: 4, wrong: 0, streak: 4, interval: 12 }),
    g.rankOf({ right: 6, wrong: 0, streak: 6, interval: 30 }),
    g.rankOf({ right: 9, wrong: 0, streak: 9, interval: 90 }),
  ], ["unseen", "unseen", "shaky", "learning", "solid", "mature", "burnished"]);

  {
    const ids = ["a", "b", "c"];
    const shallow = items([["a", { interval: 1 }], ["b", { interval: 1 }], ["c", { interval: 1 }]]);
    const deep = items([["a", { interval: 40 }], ["b", { interval: 40 }], ["c", { interval: 40 }]]);
    check("answering the same three cards forever cannot raise the level",
      g.masteryPoints(shallow, ids) < g.masteryPoints(deep, ids), true);
    check("mastery ignores ids the app no longer has", g.masteryPoints(deep, ["a", "gone"]), 7);
  }

  check("levels are a widening ladder", [1, 12, 48, 108, 300].map(g.levelFor), [1, 2, 3, 4, 6]);
  check("and the floor of a level is the points it took", g.pointsForLevel(g.levelFor(48)), 48);

  /* --- what is open --- */

  const cleared = (pairs) => ({
    ...g.freshGame(0),
    regions: Object.fromEntries(pairs.map(([id, n]) => [id, {
      stages: Object.fromEntries(["recon", "signature", "sudden", "boss"].slice(0, n).map((s) => [s, { cleared: true, best: 0, runs: 1 }])),
    }])),
  });

  check("a fresh save opens exactly one region", [...g.unlockedRegions(g.freshGame(0))], ["rules"]);
  check("one cleared mission is not enough to move on", [...g.unlockedRegions(cleared([["rules", 1]]))], ["rules"]);
  check("two are", [...g.unlockedRegions(cleared([["rules", 2]]))].includes("suffix"), true);
  check("but only for the region actually behind the next one",
    [...g.unlockedRegions(cleared([["sound", 4]]))], ["rules"]);
  check("the Arena waits for four regions", [
    g.unlockedRegions(cleared([["rules", 2], ["suffix", 2], ["sound", 2]])).has("arena"),
    g.unlockedRegions(cleared([["rules", 2], ["suffix", 2], ["sound", 2], ["verbs", 2]])).has("arena"),
  ], [false, true]);

  check("a mission's stages open in order", [
    g.stageOpen(g.freshGame(0), "rules", 0),
    g.stageOpen(g.freshGame(0), "rules", 1),
    g.stageOpen(cleared([["rules", 1]]), "rules", 1),
  ], [true, false, true]);

  {
    /* Sudden death has to be survived, or dying on the first card would clear
       the stage that dying was supposed to fail. */
    const now = at("2025-04-01");
    const died = g.recordMission(g.freshGame(now), {
      answers: [{ id: "a", right: false, wasDue: true }], mode: "sudden",
      region: "rules", stage: "sudden", score: { won: false, value: 0 }, now,
    });
    check("a run that was lost does not clear its stage", died.game.regions.rules.stages.sudden.cleared, false);
    check("  but it is still recorded as attempted", died.game.regions.rules.stages.sudden.runs, 1);
    const survived = g.recordMission(died.game, {
      answers: due(4), mode: "sudden", region: "rules", stage: "sudden", score: { won: true, value: 4 }, now,
    });
    check("a run that was survived clears it", survived.game.regions.rules.stages.sudden.cleared, true);
  }

  /* --- quests --- */

  {
    const monday = g.questsFor("2025-06-02");
    check("a day's quests are the same every time it is asked",
      monday.map((q) => q.id), g.questsFor("2025-06-02").map((q) => q.id));
    check("there are three", monday.length, 3);
    check("no two of them measure the same counter",
      new Set(monday.map((q) => q.track)).size, 3);
    const week = ["2025-06-02", "2025-06-03", "2025-06-04", "2025-06-05"].map((d) => g.questsFor(d).map((q) => q.id).join());
    check("and they are not the same every day", new Set(week).size > 1, true);
  }

  {
    const game = { ...g.freshGame(0), today: { ...g.freshGame(0).today, due: 12 } };
    const quest = g.questProgress(game, { id: "x", track: "due", target: 12, text: "" });
    check("a quest reads its counter off the day", [quest.have, quest.done, quest.fraction], [12, true, 1]);
  }

  /* --- badges --- */

  {
    const snapshot = { missions: 1, flawless: 0, bosses: 0, streak: 0, level: 1, mature: 0, unlocked: 1, met: 0, due: 0 };
    const first = g.awardBadges(g.freshGame(0), snapshot);
    check("a badge is awarded once", first.won.map((b) => b.id), ["first"]);
    check("and not again", g.awardBadges(first.game, snapshot).won, []);
  }

  /* --- reading a save written by an older version --- */

  {
    const now = at("2025-07-01");
    check("nothing at all becomes a fresh game", g.normaliseGame(undefined, now).streak.count, 0);
    check("junk does too", g.normaliseGame("not an object", now).xp, 0);
    const salvaged = g.normaliseGame({
      xp: "600", badges: ["first", 7], regions: { rules: { stages: { recon: { cleared: 1 } } }, atlantis: { stages: {} } },
      streak: { count: 4, freezes: 99 }, settings: { motion: "sideways" },
    }, now);
    check("a number written as a string is still a number", salvaged.xp, 600);
    check("a badge that is not a name is dropped", salvaged.badges, ["first"]);
    check("a region the app no longer has is dropped", Object.keys(salvaged.regions), ["rules"]);
    check("an impossible number of grace days is clamped", salvaged.streak.freezes, g.MAX_FREEZES);
    check("an unknown setting falls back", salvaged.settings.motion, "full");
    check("and the streak's best is inferred when it was never stored", salvaged.streak.best, 4);
  }

  {
    const now = at("2025-08-01");
    const game = { ...g.freshGame(now), today: { ...g.freshGame(now).today, due: 9, xp: 40 } };
    check("a new day clears the day's counters", g.rollDay(game, now + DAY).today.due, 0);
    check("  and leaves the streak to be judged by its date", g.rollDay(game, now + DAY).streak, game.streak);
    check("the same day changes nothing", g.rollDay(game, now + 60e3), game);
  }

  /* --- merging two devices --- */

  {
    const mine = { ...g.freshGame(at("2025-09-01")), xp: 100, badges: ["first"] };
    const theirs = {
      ...g.freshGame(at("2025-09-01")), xp: 40, badges: ["boss"],
      streak: { count: 6, best: 6, last: "2025-09-01", freezes: 1 },
      regions: { rules: { stages: { recon: { cleared: true, best: 80, runs: 3 } } } },
    };
    const merged = g.mergeGame(mine, theirs);
    check("merging takes the larger counter", merged.xp, 100);
    check("badges are the union of both", merged.badges.sort(), ["boss", "first"]);
    check("a stage cleared anywhere is cleared", merged.regions.rules.stages.recon.cleared, true);
    check("the streak comes from whichever device reported later", merged.streak.count, 6);
    check("merging the same export twice changes nothing the second time",
      g.mergeGame(merged, theirs), merged);
  }
}

if (failures) { console.error(`\n${failures} failure${failures === 1 ? "" : "s"}`); process.exit(1); }
console.log("\nlib OK");
