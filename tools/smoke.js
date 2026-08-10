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
const TABS = ["Rules", "Transformer", "Sound", "Verbs", "Tenses", "Subjunctive", "Gender", "Mexicanismos", "Connectors", "Review"];
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
