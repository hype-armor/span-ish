#!/usr/bin/env node
/* Boots the real app in a headless browser and drives it.
 *
 * The content linter checks the decks; this checks that the app still starts,
 * that every tab renders, and that a drill round can be played to the end.
 * It serves the repo itself, so it exercises exactly what gets deployed.
 *
 * Run: npm run smoke   (needs: npx playwright install chromium)
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TABS = ["Rules", "Transformer", "Sound", "Verbs", "Past", "Tenses", "Subjunctive", "Gender", "Mexicanismos", "Connectors", "Review"];
const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml", ".png": "image/png",
};

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
  await page.waitForSelector("nav .tab", { timeout: 15000 });

  /* the decks the app actually loaded */
  const deckCount = await page.evaluate(() => Object.keys(window.MX || {}).length);
  if (deckCount < 20) fail(`only ${deckCount} decks reached the app`); else pass(`${deckCount} decks loaded`);

  const reactKeys = await page.evaluate(() => Object.keys(window.__MX_REACT || {}));
  if (!reactKeys.includes("react") || !reactKeys.includes("dom")) fail("vendor/react.js did not expose window.__MX_REACT");
  else pass("React came from the vendor bundle");

  /* every tab renders something */
  const found = await page.$$eval("nav .tab", (els) => els.map((e) => e.textContent.trim()));
  for (const t of TABS) if (!found.includes(t)) fail(`tab missing: ${t}`);
  if (found.length === TABS.length) pass(`all ${TABS.length} tabs present`);

  for (const t of TABS) {
    await page.click(`nav .tab:has-text("${t}")`);
    await page.waitForTimeout(150);
    const h2 = await page.$eval("section h2", (e) => e.textContent.trim()).catch(() => "");
    const drill = await page.$(".opt, input.answer-input, section .machine");
    if (!h2) fail(`${t}: no heading rendered`);
    if (!drill) fail(`${t}: no drill rendered`);
  }
  if (!failures) pass("every tab rendered a heading and a drill");

  /* play a round to the end: answer, advance, repeat */
  await page.click(`nav .tab:has-text("Rules")`);
  await page.waitForTimeout(250);
  let answered = 0, finished = false;
  for (let i = 0; i < 60; i++) {
    const opts = await page.$$(".opt:not([disabled])");
    const input = await page.$("input.answer-input");
    if (opts.length) await opts[0].click();
    else if (input) { await input.fill("respuesta"); await input.press("Enter"); }
    else break; // the round is over: no options and no answer box
    answered++;
    await page.waitForTimeout(60);
    // the last card of a round says "See results", not "Next" — and clicking it
    // is what commits the round, so stopping early would test nothing
    const next = await page.$("button:has-text('Next'), button:has-text('See results')");
    if (!next) break;
    const last = (await next.textContent()).includes("See results");
    await next.click();
    await page.waitForTimeout(120);
    if (last) { finished = true; break; }
  }
  if (answered < 5) fail(`the drill stopped after ${answered} answers`);
  else if (!finished) fail(`played ${answered} cards but the round never reached its results`);
  else pass(`played a full round of ${answered} cards through to the results`);

  /* An unanswered option must never look chosen. Hover survives a card change
     — answer with the mouse, advance with Enter, and the pointer is still over
     an option on the next card — so if hovering filled the button, every such
     card would open with one option looking already picked. */
  {
    await page.click(`nav .tab:has-text("Gender")`); // all multiple choice
    await page.waitForTimeout(250);
    const opts = await page.$$(".opt");
    const bgOf = (h) => h.evaluate((e) => getComputedStyle(e).backgroundColor);
    const borderOf = (h) => h.evaluate((e) => getComputedStyle(e).borderColor);

    const restBg = await bgOf(opts[0]);
    await opts[1].hover();
    await page.waitForTimeout(220); // the transition
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
      const opt = await page.$(".opt:not([disabled])");
      await opt.click();
      await page.waitForTimeout(150);
      const next = await page.$("button:has-text('Next'), button:has-text('See results')");
      await next.click();
      await page.waitForTimeout(250);
      const focus = await page.evaluate(() => {
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
      else if (!/\bqbody\b/.test(focus.where)) fail(`after advancing, focus was left on "${focus.where}" rather than parked on the card; where it lands is then up to the browser`);
      else pass("after advancing, focus parks on the card, clear of the options");
      if (focus.ringed) fail(`${focus.ringed} option(s) show a focus ring on an unanswered card`);
    }

    /* and the fill is still what marks the answer once one is given */
    const fresh = await page.$$(".opt:not([disabled])"); // the card changed; the old handles are stale
    await fresh[0].click();
    await page.waitForTimeout(250);
    const marked = await page.$$eval(".opt[data-s]", (els) => els.length);
    if (!marked) fail("answering a card marked no option");
    else pass("answering still fills the option it marks");
  }

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
    const tab = await phone.newPage();
    await tab.goto(base + "/index.html", { waitUntil: "load" });
    await tab.waitForSelector("nav .tab", { timeout: 15000 });
    await tab.click(`nav .tab:has-text("Gender")`);
    await tab.waitForTimeout(300);

    const coarse = await tab.evaluate(() => matchMedia("(hover: none) and (pointer: coarse)").matches);
    if (!coarse) fail("the emulated phone does not report a coarse pointer, so this check proves nothing");

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

  /* the storage shim prefixes every key with mx-pwa: */
  const stored = await page.evaluate(() => {
    try { return Object.keys(localStorage).filter((k) => k.startsWith("mx-pwa:")); } catch { return []; }
  });
  if (!stored.includes("mx-pwa:mx:progress")) fail(`progress was not persisted (found: ${stored.join(", ") || "nothing"})`);
  else pass("progress persisted to localStorage");

  for (const e of errors) fail(e);

  await browser.close();
  server.close();

  if (failures) { console.error(`\n${failures} problem${failures === 1 ? "" : "s"} found`); process.exit(1); }
  console.log("\nsmoke OK");
})();
