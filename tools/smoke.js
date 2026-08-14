#!/usr/bin/env node
/* Boots the real app in a headless browser and drives it.
 *
 * The content linter checks the decks and test-lib checks the pure logic; this
 * checks that the app still starts, that the map and every screen render, that
 * a mission can be played to the end — and that nothing, anywhere, scrolls.
 *
 * That last one is the load-bearing check. "No scrolling" is a design rule the
 * whole layout is built on, and it is the kind of rule a single overlong
 * explanation or a slightly taller phone quietly breaks. Nothing else in the
 * repo would notice.
 *
 * It serves the repo itself, so it exercises exactly what gets deployed.
 *
 * Run: npm run smoke   (needs: npx playwright install chromium)
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const REGIONS = [
  "Los Cimientos", "La Fragua", "El Oído", "Los Verbos", "El Pasado", "Los Atajos",
  "El Subjuntivo", "El o La", "La Calle", "La Plática", "La Arena",
];
const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml", ".png": "image/png",
};

/* Viewports the layout has to survive: a desktop window, a tall phone, and a
   small phone, which is where a screen runs out of room first. */
const SIZES = [
  { name: "desktop", width: 1000, height: 1200 },
  { name: "phone", width: 390, height: 844 },
  { name: "small phone", width: 360, height: 640 },
  { name: "phone, landscape", width: 740, height: 360 },
];

function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end("not found"); return;
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, () => ok({ server, port: server.address().port })));
}

let failures = 0;
const fail = (msg) => { console.error("  ✗ " + msg); failures++; };
const pass = (msg) => console.log("  ✓ " + msg);

/* A save with every region opened, so the parts of the app that live behind
   progression can be reached without playing through to them.

   Every region has its first two missions cleared, which is what opens the
   next region and opens sudden death. Only El o La also has sudden death
   cleared, so its boss is reachable — everywhere else sudden death is open and
   *not* yet cleared, which is what makes "losing does not clear it" a question
   with an answer. */
const STAGES = ["recon", "signature", "sudden", "boss"];
const cleared = (n) => ({ stages: Object.fromEntries(STAGES.slice(0, n).map((s) => [s, { cleared: true, best: 1, runs: 1 }])) });
const UNLOCKED = JSON.stringify({
  scores: {}, items: {}, reviews: {},
  game: {
    xp: 0,
    today: { key: "2000-01-01", xp: 0, due: 0, answers: 0, missions: 0, flawless: 0, boss: 0, combo: 0, ear: 0, forge: 0, goalMet: false },
    streak: { count: 0, best: 0, last: null, freezes: 1 },
    regions: Object.fromEntries(
      ["rules", "suffix", "sound", "verbs", "past", "periphrasis", "subjunctive", "gender", "mexicanismos", "connectors", "arena"]
        .map((id) => [id, cleared(id === "gender" ? 3 : 2)]),
    ),
    badges: [], intro: false, settings: { motion: "full", sound: false, haptics: false },
  },
});

/* The rule the whole layout rests on. Checked on the document and on every
   element: a stray `overflow: auto` inside a screen would be just as wrong as
   a scrollbar on the page. `.tablewrap` is the one deliberate exception — a
   very wide table scrolls sideways rather than shrinking its columns to
   nothing — so horizontal overflow inside one is not a failure. */
async function assertNoScroll(page, where) {
  const bad = await page.evaluate(() => {
    const out = [];
    const doc = document.documentElement;
    if (doc.scrollHeight > doc.clientHeight + 1) out.push(`the page is ${doc.scrollHeight - doc.clientHeight}px taller than the window`);
    if (doc.scrollWidth > doc.clientWidth + 1) out.push(`the page is ${doc.scrollWidth - doc.clientWidth}px wider than the window`);
    if (document.body.scrollHeight > document.body.clientHeight + 1) out.push("the body overflows");

    for (const el of document.querySelectorAll(".app *")) {
      if (el.closest(".tablewrap")) continue;
      const over = el.scrollHeight - el.clientHeight;
      if (over > 1 && el.clientHeight > 0) {
        const style = getComputedStyle(el);
        if (style.overflowY === "auto" || style.overflowY === "scroll") {
          out.push(`${el.className || el.tagName} scrolls vertically (${over}px hidden)`);
        }
      }
    }
    return out;
  });
  for (const problem of bad) fail(`${where}: ${problem}`);
  return bad.length === 0;
}

(async () => {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch {
    console.error("playwright is not installed — run: npm install && npx playwright install chromium");
    process.exit(1);
  }

  const { server, port } = await serve();
  const base = `http://127.0.0.1:${port}`;
  const launch = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};
  const browser = await chromium.launch(launch);
  const page = await browser.newPage({ viewport: { width: 1000, height: 1200 } });

  const errors = [];
  page.on("pageerror", (e) => errors.push("uncaught: " + e.message));
  // the font stylesheet is remote; a sandbox with no network is not a failure,
  // and the message text does not name the URL, so match on the location
  const remoteFont = (m) => /fonts\.(googleapis|gstatic)\.com/.test((m.location() || {}).url || "");
  page.on("console", (m) => {
    if (m.type() === "error" && !remoteFont(m)) errors.push("console: " + m.text());
  });

  await page.goto(base + "/index.html", { waitUntil: "load" });

  /* A first run explains itself before it shows anything else. The map is a
     grid of glyphs, so without this the app opens saying nothing at all. */
  await page.waitForSelector(".intro-screen", { timeout: 15000 });
  {
    const pitch = await page.$eval(".intro", (e) => e.textContent).catch(() => "");
    if (!/palabras/.test(pitch)) fail("the first run does not say what the app is");
    else pass("a first run explains itself");
    await assertNoScroll(page, "the intro");
    await page.click('.intro-foot button:has-text("Look around")');
    await page.waitForSelector(".map-screen .node", { timeout: 5000 });
  }

  /* the decks the app actually loaded */
  const deckCount = await page.evaluate(() => Object.keys(window.MX || {}).length);
  if (deckCount < 20) fail(`only ${deckCount} decks reached the app`); else pass(`${deckCount} decks loaded`);

  const reactKeys = await page.evaluate(() => Object.keys(window.__MX_REACT || {}));
  if (!reactKeys.includes("react") || !reactKeys.includes("dom")) fail("vendor/react.js did not expose window.__MX_REACT");
  else pass("React came from the vendor bundle");

  /* the map: every region present, and only the first one open on a fresh save */
  const labels = await page.$$eval(".node-label", (els) => els.map((e) => e.textContent.trim()));
  for (const region of REGIONS) if (!labels.includes(region)) fail(`region missing from the map: ${region}`);
  if (labels.length === REGIONS.length) pass(`all ${REGIONS.length} regions on the map`);

  const openCount = await page.$$eval(".node", (els) => els.filter((e) => !e.disabled).length);
  if (openCount !== 1) fail(`a fresh save opens ${openCount} regions; it should open exactly one`);
  else pass("a fresh save opens exactly one region");

  /* the rule the layout is built on, on every screen and every size */
  for (const size of SIZES) {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.waitForTimeout(220);
    let clean = await assertNoScroll(page, `map at ${size.name}`);
    for (const where of ["today", "lab"]) {
      await page.click(`.dock-btn[aria-label^="${where === "today" ? "Hoy" : "Lab"}"]`);
      await page.waitForTimeout(260);
      clean = (await assertNoScroll(page, `${where} at ${size.name}`)) && clean;
    }
    await page.click('.dock-btn[aria-label^="Ruta"]');
    await page.waitForTimeout(200);
    if (clean) pass(`nothing scrolls at ${size.name} (${size.width}×${size.height})`);
  }
  await page.setViewportSize({ width: 1000, height: 1200 });
  await page.waitForTimeout(200);

  /* into the first region */
  await page.click(".node:not([disabled])");
  await page.waitForSelector(".region-screen", { timeout: 5000 });
  const stages = await page.$$eval(".stage-btn", (els) => els.length);
  if (stages !== 4) fail(`a region offers ${stages} missions; it should offer 4`);
  else pass("a region offers four missions, escalating");
  const openStages = await page.$$eval(".stage-btn", (els) => els.filter((e) => !e.disabled).length);
  if (openStages !== 1) fail(`${openStages} missions are open before anything is cleared; only the first should be`);
  else pass("only the first mission is open to begin with");

  /* the codex: the reference material the tabs used to hold */
  await page.click(".codex-link");
  await page.waitForSelector(".codex", { timeout: 5000 });
  const entryCount = await page.$$eval(".rail-dot", (els) => els.length);
  if (entryCount < 2) fail(`the first region's codex has ${entryCount} entries`);
  else pass(`the codex opens with ${entryCount} entries`);
  await assertNoScroll(page, "codex");

  /* A table longer than the screen has to stay reachable by paging. Asked on
     a small phone, because that is where content stops fitting — on a desktop
     window the first entry fits and the check would prove nothing. */
  await page.setViewportSize({ width: 360, height: 640 });
  await page.waitForTimeout(320);
  const pagedThrough = await page.$$eval(".pages-dot", (els) => els.length);
  if (pagedThrough > 1) pass(`long content pages instead of scrolling (${pagedThrough} pages)`);
  else fail("the codex fits on one page even on a small phone, so paging was never exercised");
  await page.click('.pages-arrow[aria-label^="Next"]');
  await page.waitForTimeout(340);
  await assertNoScroll(page, "codex, page two");
  const moved = await page.$eval(".pages-inner", (e) => e.style.transform);
  if (!/translateY\(-[1-9]/.test(moved)) fail(`paging forward did not move the content (transform: ${moved || "none"})`);
  else pass("paging forward moves the content without a scrollbar");
  await page.setViewportSize({ width: 1000, height: 1200 });
  await page.waitForTimeout(260);
  await page.click('.icon-btn[aria-label="Back to the region"]');
  await page.waitForSelector(".region-screen", { timeout: 5000 });

  /* play a mission to the end: answer, advance, repeat */
  await page.click(".stage-btn:not([disabled])");
  await page.waitForSelector(".mission", { timeout: 5000 });
  let answered = 0, finished = false;
  for (let i = 0; i < 60; i++) {
    const opts = await page.$$(".opt:not([disabled]), .ambush-opt:not([disabled])");
    const input = await page.$("input.answer-input:not([disabled])");
    if (opts.length) await opts[0].click();
    else if (input) { await input.fill("respuesta"); await input.press("Enter"); }
    else break; // the mission is over: no options and no answer box
    answered++;
    await page.waitForTimeout(60);
    // the last card says "See results", not "Next" — and clicking it is what
    // commits the mission, so stopping early would test nothing
    const next = await page.$(".mission-foot button");
    if (!next) break;
    const label = await next.textContent();
    await next.click();
    await page.waitForTimeout(120);
    if (/results|ended|Finish/.test(label)) { finished = true; break; }
  }
  if (answered < 5) fail(`the mission stopped after ${answered} answers`);
  else if (!finished) fail(`played ${answered} cards but the mission never reached its results`);
  else pass(`played a full mission of ${answered} cards through to the results`);

  await page.waitForSelector(".result", { timeout: 5000 });
  const tally = await page.$$eval(".tally-n", (els) => els.map((e) => e.textContent.trim()));
  if (!tally.length || !/^\+\d+$/.test(tally[0])) fail(`the results screen showed no XP (${tally.join(", ") || "nothing"})`);
  else pass(`the results screen paid out ${tally[0]} XP`);

  /* A first mission always earns the "First mission" badge, so the row that
     reports what a run won has to be there. Quest chips render through the
     same row; which quests a given day draws is decided by the date, so they
     cannot be forced from here — questProgress is unit-tested instead. */
  {
    const won = await page.$$eval(".badge-chip", (els) => els.map((e) => e.textContent.trim()));
    if (!won.some((t) => /First mission/.test(t))) {
      fail(`a first mission reported no badge (${won.join(", ") || "nothing"})`);
    } else pass("and it reports what the run won");
  }
  await assertNoScroll(page, "results");

  /* clearing a mission has to open the next one */
  await page.click('.mission-foot button:has-text("Back to")');
  await page.waitForSelector(".region-screen", { timeout: 5000 });
  const openNow = await page.$$eval(".stage-btn", (els) => els.filter((e) => !e.disabled).length);
  if (openNow < 2) fail("clearing the first mission did not open the second");
  else pass("clearing a mission opens the next one");

  /* the storage shim prefixes every key with mx-pwa:, and the game rides along
     in the same record as the review history */
  const stored = await page.evaluate(() => {
    try {
      const raw = localStorage.getItem("mx-pwa:mx:progress");
      return { keys: Object.keys(localStorage).filter((k) => k.startsWith("mx-pwa:")), game: raw ? !!JSON.parse(raw).game : false };
    } catch { return { keys: [], game: false }; }
  });
  if (!stored.keys.includes("mx-pwa:mx:progress")) fail(`progress was not persisted (found: ${stored.keys.join(", ") || "nothing"})`);
  else pass("progress persisted to localStorage");
  if (!stored.game) fail("the saved progress carries no game state");
  else pass("the game state saved alongside the review history");

  /* Dismissing the intro has to stick, or every reload would start with a
     wall of text somebody has already read. */
  {
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector(".map-screen, .intro-screen", { timeout: 15000 });
    if (await page.$(".intro-screen")) fail("the intro came back after being dismissed");
    else pass("the intro does not come back");
  }

  /* ---------- the option buttons, on a save with everything open ---------- */

  const seeded = await browser.newContext({ viewport: { width: 1000, height: 1200 } });
  await seeded.addInitScript((save) => {
    try { localStorage.setItem("mx-pwa:mx:progress", save); } catch { /* private window */ }
  }, UNLOCKED);
  const open = await seeded.newPage();
  open.on("pageerror", (e) => errors.push("uncaught: " + e.message));
  await open.goto(base + "/index.html", { waitUntil: "load" });
  await open.waitForSelector(".map-screen .node", { timeout: 15000 });

  const allOpen = await open.$$eval(".node", (els) => els.filter((e) => !e.disabled).length);
  if (allOpen !== REGIONS.length) fail(`a fully cleared save opens ${allOpen} of ${REGIONS.length} regions`);
  else pass("a cleared save opens every region");

  /* every region's codex renders, since that is where the old tabs' material
     went and a missing entry would otherwise be silent */
  for (const region of REGIONS) {
    await open.click('.dock-btn[aria-label^="Ruta"]');
    await open.waitForTimeout(120);
    await open.click(`.map-cell:has(.node-label:text-is("${region}")) .node`);
    await open.waitForSelector(".region-screen", { timeout: 5000 });
    await open.click(".codex-link");
    await open.waitForSelector(".codex", { timeout: 5000 });
    const heading = await open.$eval(".screen-title h2", (e) => e.textContent.trim()).catch(() => "");
    const body = await open.$eval(".codex-body", (e) => e.textContent.trim().length).catch(() => 0);
    if (!heading) fail(`${region}: the codex rendered no heading`);
    if (body < 60) fail(`${region}: the codex rendered almost nothing (${body} characters)`);
  }
  pass("every region's codex renders its reference material");

  /* Every region's signature mission has to be able to build a round. A mode
     narrows the deck — By Ear wants the dictation, Ambush wants the two-way
     discriminations — and a region whose slice is too thin is supposed to fall
     back to the whole deck rather than hand out a four-card mission. Nothing
     else would notice that going wrong. */
  for (const region of REGIONS) {
    await open.click('.dock-btn[aria-label^="Ruta"]');
    await open.waitForTimeout(120);
    await open.click(`.map-cell:has(.node-label:text-is("${region}")) .node`);
    await open.waitForSelector(".region-screen", { timeout: 5000 });

    const mode = await open.$eval('.stage-btn:nth-of-type(2)', (e) => e.dataset.mode);
    await open.click('.stage-btn:nth-of-type(2)');
    await open.waitForSelector(".mission", { timeout: 5000 });

    const shape = await open.evaluate(() => ({
      cards: (document.querySelector(".mission-count") || {}).textContent || "",
      answerable: !!document.querySelector(".opt, .ambush-opt, input.answer-input"),
      audible: !!document.querySelector(".speak-xl"),
    }));
    const size = Number((shape.cards.split("/")[1] || "0").trim());
    if (size < 8) fail(`${region}: its ${mode} mission built a round of ${size} cards`);
    if (!shape.answerable) fail(`${region}: its ${mode} mission rendered no way to answer`);
    if (mode === "ear" && !shape.audible) fail(`${region}: By Ear rendered no play button`);
    /* The Anvil is meant to show the rule being applied — the English ending
       split off, the swap named, and a slot for the Spanish word. Falling back
       to a plain typed prompt hides the one thing that region teaches. */
    if (mode === "forge") {
      const anvil = await open.evaluate(() => {
        const el = document.querySelector(".forge");
        return el && {
          ending: (el.querySelector(".forge-in b") || {}).textContent || "",
          rule: (el.querySelector(".forge-rule") || {}).textContent || "",
          slot: !!el.querySelector(".forge-blank"),
        };
      });
      if (!anvil) fail(`${region}: The Anvil fell back to an ordinary typed prompt`);
      else if (!anvil.ending) fail(`${region}: The Anvil did not split the English ending off`);
      else if (!/→/.test(anvil.rule)) fail(`${region}: The Anvil did not name the swap (${anvil.rule})`);
      else if (!anvil.slot) fail(`${region}: The Anvil showed no slot for the answer`);
    }
    await open.click('.icon-btn[aria-label="Leave this mission"]');
    await open.waitForSelector(".region-screen", { timeout: 5000 });
  }
  pass("every region's signature mission builds a full round it is possible to answer");

  /* The glossary. A drill that offers "Subjunctive" as an answer and never
     says what one is explains nothing, so the terms in a card's instruction
     and in its explanation are clickable — and the definition has to open in
     place rather than navigating away, because leaving the drill to look
     something up is how a session ends. */
  {
    await open.click('.dock-btn[aria-label^="Ruta"]');
    await open.waitForTimeout(120);
    await open.click('.map-cell:has(.node-label:text-is("El Subjuntivo")) .node');
    await open.waitForSelector(".region-screen", { timeout: 5000 });
    await open.click(".codex-link");
    await open.waitForSelector(".codex", { timeout: 5000 });

    const terms = await open.$$(".term-link");
    if (!terms.length) fail("no grammar term in the codex is clickable");
    else {
      const word = (await terms[0].textContent()).trim();
      await terms[0].click();
      await open.waitForSelector(".gloss-card", { timeout: 3000 });
      const definition = await open.$eval(".gloss-what", (e) => e.textContent.trim()).catch(() => "");
      if (definition.length < 15) fail(`"${word}" opened a definition of ${definition.length} characters`);
      else pass(`a grammar term opens its definition in place ("${word}")`);
      await assertNoScroll(open, "a definition over the codex");

      await open.keyboard.press("Escape");
      await open.waitForTimeout(220);
      if (await open.$(".gloss-card")) fail("Escape did not close the definition");
      else pass("  and Escape closes it");
    }

    /* And inside a mission, where the explanation is the thing being read. */
    await open.click('.icon-btn[aria-label="Back to the region"]');
    await open.waitForSelector(".region-screen", { timeout: 5000 });
    await open.click(".stage-btn:not([disabled])");
    await open.waitForSelector(".mission", { timeout: 5000 });

    const inCard = await open.$(".qwrap .term-link");
    if (!inCard) pass("  (this card's instruction happens to use no glossary term)");
    else {
      await inCard.click();
      await open.waitForSelector(".gloss-card", { timeout: 3000 });
      /* Space belongs to the definition while it is open — the mission's own
         handler advances on Space, and both firing would answer a card the
         learner never saw. */
      const before = await open.$eval(".mission-count", (e) => e.textContent.trim());
      await open.keyboard.press(" ");
      await open.waitForTimeout(250);
      const after = await open.$eval(".mission-count", (e) => e.textContent.trim());
      if (before !== after) fail(`Space over an open definition advanced the mission (${before} → ${after})`);
      else pass("  and a definition open over a card holds on to the keyboard");
      await open.keyboard.press("Escape");
      await open.waitForTimeout(200);
    }
    await open.click('.icon-btn[aria-label="Leave this mission"]');
    await open.waitForSelector(".region-screen", { timeout: 5000 });
  }

  /* The clock has to actually run out, and running out has to behave like any
     other failed attempt: the answer and the reason, not a skipped card. */
  {
    await open.click('.dock-btn[aria-label^="Ruta"]');
    await open.waitForTimeout(120);
    await open.click('.map-cell:has(.node-label:text-is("El o La")) .node');
    await open.waitForSelector(".region-screen", { timeout: 5000 });
    await open.click('.stage-btn[data-mode="ambush"]');
    await open.waitForSelector(".mission.mode-ambush", { timeout: 5000 });

    const before = await open.$eval(".clock > i", (e) => parseFloat(e.style.width));
    await open.waitForTimeout(1400);
    const during = await open.$eval(".clock > i", (e) => parseFloat(e.style.width)).catch(() => null);
    if (during === null || during >= before) fail(`the ambush clock did not run down (${before}% then ${during}%)`);
    else pass("the clock runs down on a card answered by choosing");

    /* Ambush allows seven seconds; wait it out without touching anything. */
    await open.waitForSelector(".feedback", { timeout: 12000 });
    const timedOut = await open.evaluate(() => ({
      verdict: (document.querySelector(".verdict-text") || {}).textContent || "",
      why: ((document.querySelector(".why") || {}).textContent || "").length,
      bad: !!document.querySelector(".verdict-bad"),
    }));
    if (!timedOut.bad) fail("running out of time was not recorded as a miss");
    else pass("running out of time counts as a miss");
    if (!/answer is/.test(timedOut.verdict) || timedOut.why < 20) {
      fail("a timed-out card did not show its answer and its reason");
    } else pass("  and it still shows the answer and the reason");

    await open.click('.icon-btn[aria-label="Leave this mission"]');
    await open.waitForSelector(".region-screen", { timeout: 5000 });
  }

  /* Sudden death has to actually end on a miss, and must not clear its stage
     by ending. Getting this wrong would hand out the boss for free. */
  {
    await open.click('.dock-btn[aria-label^="Ruta"]');
    await open.waitForTimeout(120);
    /* Subjunctive-or-indicative: two options, so a miss is one tap away — and
       this region's sudden death has not been cleared in the seeded save. */
    await open.click('.map-cell:has(.node-label:text-is("El Subjuntivo")) .node');
    await open.waitForSelector(".region-screen", { timeout: 5000 });
    await open.click('.stage-btn[data-mode="sudden"]');
    await open.waitForSelector(".mission.mode-sudden", { timeout: 5000 });

    /* Alternate the two options so a miss turns up quickly, and play more than
       one run if a lucky one reaches the end without ever being wrong. */
    let missed = false;
    for (let run = 0; run < 4 && !missed; run++) {
      if (run > 0) {
        await open.click('.mission-foot button:has-text("Run it again")');
        await open.waitForSelector(".mission.mode-sudden .opt", { timeout: 5000 });
      }
      for (let i = 0; i < 20 && !missed; i++) {
        const opts = await open.$$(".opt:not([disabled])");
        const input = await open.$("input.answer-input:not([disabled])");
        /* The subjunctive deck mixes choices with typed forms. Alternate the
           options to turn a miss up quickly; on a typed card, "I don't know"
           is a miss by definition and gets there in one. */
        if (opts.length) await opts[i % opts.length].click();
        else if (input) await open.click(`.mission-foot button:has-text("I don't know")`);
        else break;
        await open.waitForTimeout(140);
        /* Reads the verdict rather than the option marks: a typed card has no
           options to mark, and the correct option is marked either way. */
        missed = !!(await open.$(".verdict-bad"));
        const next = await open.$(".mission-foot button");
        if (!next) break;
        await next.click();
        await open.waitForTimeout(220);
        if (await open.$(".result")) break;
      }
    }

    if (!missed) fail("could not produce a miss in sudden death, so the check proved nothing");
    else {
      const over = await open.$(".result");
      if (!over) fail("a miss in sudden death did not end the run");
      else pass("a miss ends sudden death on the spot");
      const headline = await open.$eval(".result-h", (e) => e.textContent.trim()).catch(() => "");
      if (headline !== "Run ended") fail(`sudden death ended with "${headline}" rather than reporting the loss`);
      else pass("  and it is reported as a loss, not a completion");

      /* A missed card has to be nameable afterwards. On a gender card the
         answer is "el" or "la", so a list of answers names nothing — the
         prompt has to come with it. */
      const named = await open.$$eval(".requeue-l span", (els) => els.map((e) => e.textContent.trim()));
      if (!named.length) fail("a lost run listed nothing as reset and due");
      else if (named.some((t) => t.length <= 3)) {
        fail(`the missed list names a card as "${named.find((t) => t.length <= 3)}", which identifies nothing`);
      } else pass("  and the missed cards are named in a way you could look up");
    }

    /* Whatever state the run ended in, get back to a screen with a dock. */
    const back = await open.$('.mission-foot button:has-text("Back to")');
    if (back) await back.click();
    else await open.click('.icon-btn[aria-label="Leave this mission"]');
    await open.waitForSelector(".region-screen", { timeout: 5000 });

    if (missed) {
      const done = await open.$eval('.stage-btn[data-mode="sudden"]', (e) => e.dataset.done);
      if (done === "true") fail("dying in sudden death cleared the stage anyway");
      else pass("  and dying does not clear the stage");
    }
  }

  /* The boss: a health bar that answers move, and lives that a miss spends. */
  {
    await open.click('.dock-btn[aria-label^="Ruta"]');
    await open.waitForTimeout(120);
    await open.click('.map-cell:has(.node-label:text-is("El o La")) .node');
    await open.waitForSelector(".region-screen", { timeout: 5000 });
    await open.click('.stage-btn[data-mode="boss"]');
    await open.waitForSelector(".mission.mode-boss", { timeout: 5000 });
    const width = () => open.$eval(".bosshp > i", (e) => parseFloat(e.style.width));
    const hearts = () => open.$$eval(".heart[data-on='true']", (els) => els.length);

    const startHp = await width();
    const startHearts = await hearts();
    if (startHp !== 100) fail(`the boss opened on ${startHp}% health`);
    if (startHearts !== 3) fail(`the boss fight opened with ${startHearts} lives`);

    /* Gender cards always list el then la, so tapping the first option is a
       coin flip — a fight can end on three misses before a right answer ever
       lands. Play more than one if it has to. */
    let wounded = false, spent = false;
    for (let fight = 0; fight < 5 && !(wounded && spent); fight++) {
      if (fight > 0) {
        await open.click('.mission-foot button:has-text("Run it again")');
        await open.waitForSelector(".mission.mode-boss .opt", { timeout: 5000 });
      }
      const full = await width();
      for (let i = 0; i < 14; i++) {
        const opts = await open.$$(".opt:not([disabled])");
        if (!opts.length) break;
        await opts[i % 2].click();
        await open.waitForTimeout(220);
        /* The verdict, not the option marks: the correct option is marked
           whether or not it was the one clicked. */
        const missedIt = !!(await open.$(".verdict-bad"));
        if (!missedIt && (await width()) < full) wounded = true;
        if (missedIt && (await hearts()) < startHearts) spent = true;
        const next = await open.$(".mission-foot button");
        if (!next) break;
        await next.click();
        await open.waitForTimeout(220);
        if (await open.$(".result")) break;
      }
    }

    if (!wounded) fail("right answers did not take the boss's health down");
    else pass("right answers wound the boss");
    if (!spent) fail("a miss did not cost a life");
    else pass("  and a miss costs a life");

    /* Back out of whatever state the fight ended in — the dock is hidden
       inside a mission, so the next check cannot navigate until we leave. */
    const back = await open.$('.mission-foot button:has-text("Back to")');
    if (back) await back.click();
    else await open.click('.icon-btn[aria-label="Leave this mission"]');
    await open.waitForSelector(".region-screen", { timeout: 5000 });
  }

  /* An unanswered option must never look chosen. Hover survives a card change
     — answer with the mouse, advance with Enter, and the pointer is still over
     an option on the next card — so if hovering filled the button, every such
     card would open with one option looking already picked. */
  {
    await open.click('.dock-btn[aria-label^="Ruta"]');
    await open.waitForTimeout(120);
    await open.click('.map-cell:has(.node-label:text-is("El o La")) .node'); // all multiple choice
    await open.waitForSelector(".region-screen", { timeout: 5000 });
    await open.click(".stage-btn:not([disabled])"); // Recon: plain options, no clock
    await open.waitForSelector(".opt", { timeout: 5000 });

    const opts = await open.$$(".opt");
    const bgOf = (h) => h.evaluate((e) => getComputedStyle(e).backgroundColor);
    const borderOf = (h) => h.evaluate((e) => getComputedStyle(e).borderColor);

    const restBg = await bgOf(opts[0]);
    await opts[1].hover();
    await open.waitForTimeout(220); // the transition
    const [hoverBg, hoverBorder, otherBorder] = [await bgOf(opts[1]), await borderOf(opts[1]), await borderOf(opts[0])];

    if (hoverBg !== restBg) fail(`hovering an unanswered option fills it (${hoverBg} against ${restBg}); it reads as already chosen`);
    else pass("hovering an unanswered option does not make it look chosen");

    if (hoverBorder === otherBorder) fail("hovering an option changes nothing at all; the button has lost its affordance");
    else pass("  but it still highlights its border");

    /* Advancing destroys the button that had focus. Engines disagree about
       where focus goes next — Chromium picks <body>, iOS picks the next
       focusable element, which would be an option on the card that just
       appeared, drawn with a focus ring that reads as already chosen. The app
       parks focus itself so the outcome does not depend on the engine. */
    {
      const opt = await open.$(".opt:not([disabled])");
      await opt.click();
      await open.waitForTimeout(150);
      await open.click(".mission-foot button");
      await open.waitForTimeout(250);
      const focus = await open.evaluate(() => {
        const a = document.activeElement;
        return {
          onAnOption: !!(a && a.closest && a.closest(".opt")),
          where: a ? (a.className || a.tagName) : "(none)",
          ringed: [...document.querySelectorAll(".opt")].filter((e) => e.matches(":focus-visible")).length,
        };
      });
      /* Asserted positively. "not on an option" would pass on Chromium even
         with the fix removed, since Chromium falls back to <body> on its own —
         the check has to see the app actually placing focus. */
      if (focus.onAnOption) fail(`after advancing, focus landed on an option (${focus.where}) — it draws a ring that looks like a choice`);
      else if (!/mission-body/.test(focus.where)) fail(`after advancing, focus was left on "${focus.where}" rather than parked on the card; where it lands is then up to the browser`);
      else pass("after advancing, focus parks on the card, clear of the options");
      if (focus.ringed) fail(`${focus.ringed} option(s) show a focus ring on an unanswered card`);
    }

    /* and the fill is still what marks the answer once one is given */
    const fresh = await open.$$(".opt:not([disabled])"); // the card changed; the old handles are stale
    await fresh[0].click();
    await open.waitForTimeout(250);
    const marked = await open.$$eval(".opt[data-s]", (els) => els.length);
    if (!marked) fail("answering a card marked no option");
    else pass("answering still fills the option it marks");
  }
  await seeded.close();

  /* Phones keep :hover on whatever you last tapped — iOS especially — so a
     hover style there is not a hover, it is a mark left on the card. Chromium
     will not do that on its own, but CDP can force the pseudo-state, which asks
     the question directly: on a device with no real pointer, can an unanswered
     option be made to look chosen? Nothing here may change. */
  {
    const phone = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true, isMobile: true,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    await phone.addInitScript((save) => {
      try { localStorage.setItem("mx-pwa:mx:progress", save); } catch { /* private window */ }
    }, UNLOCKED);
    const tab = await phone.newPage();
    await tab.goto(base + "/index.html", { waitUntil: "load" });
    await tab.waitForSelector(".map-screen .node", { timeout: 15000 });
    await tab.click('.map-cell:has(.node-label:text-is("El o La")) .node');
    await tab.waitForSelector(".region-screen", { timeout: 5000 });
    await tab.click(".stage-btn:not([disabled])");
    await tab.waitForSelector(".opt", { timeout: 5000 });

    const coarse = await tab.evaluate(() => matchMedia("(hover: none) and (pointer: coarse)").matches);
    if (!coarse) fail("the emulated phone does not report a coarse pointer, so this check proves nothing");

    await assertNoScroll(tab, "a mission on a phone");

    const styleOfFirstOption = async () => {
      await tab.waitForTimeout(300); // the .16s transition has to finish, or this reads mid-fade
      return tab.$eval(".opt", (e) => {
        const cs = getComputedStyle(e);
        return { fill: cs.backgroundColor, border: cs.borderColor };
      });
    };

    const cdp = await phone.newCDPSession(tab);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument");
    const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: ".opt" });

    const resting = await styleOfFirstOption();
    await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: ["hover"] });
    const stuck = await styleOfFirstOption();

    if (stuck.fill !== resting.fill) fail(`on a touch device a stuck :hover fills an unanswered option (${stuck.fill} against ${resting.fill})`);
    else if (stuck.border !== resting.border) fail(`on a touch device a stuck :hover outlines an unanswered option (${stuck.border} against ${resting.border})`);
    else pass("a stuck :hover on a phone leaves an unanswered option unmarked");

    await phone.close();
  }

  for (const e of errors) fail(e);

  await browser.close();
  server.close();

  if (failures) { console.error(`\n${failures} problem${failures === 1 ? "" : "s"} found`); process.exit(1); }
  console.log("\nsmoke OK");
})();
