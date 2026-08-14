#!/usr/bin/env node
/* Visual regression: renders every screen in the working tree and in some other
 * revision, and compares the pixels.
 *
 * Why this exists. app.js is generated from src/ now, so a refactor can change
 * what the page looks like without changing any behaviour a unit test or the
 * smoke test would notice. The bug that motivated this was `{" "}` in JSX: it
 * renders as its own DOM text node, which moved an <em> by a hundredth of a
 * pixel and changed how it was antialiased. The markup compared byte-identical.
 * Only the pixels disagreed.
 *
 * There are no baseline images in the repo. The other side is materialised from
 * git on demand, so there is nothing to keep up to date and nothing binary to
 * review.
 *
 * Run:  node tools/visual-diff.js                 compare against HEAD
 *       node tools/visual-diff.js --against main
 *       node tools/visual-diff.js --out /tmp/vd   where to write failures
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf("--" + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const REF = argOf("against", "HEAD");
const WIDTH = Number(argOf("width", 1000));
const OUT = argOf("out", path.join(os.tmpdir(), "span-ish-visual-diff"));

/* The app is static, so serving a directory is the whole harness. */
const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml", ".png": "image/png",
};

function serve(dir) {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
    const file = path.join(dir, rel);
    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end("not found"); return;
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, () => ok({ server, port: server.address().port })));
}

/* The working tree, with app.js rebuilt from src/ so uncommitted source
   changes are what actually gets compared. */
function stageWorkingTree(esbuild) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vd-work-"));
  for (const entry of ["index.html", "styles.css", "manifest.webmanifest", "content", "vendor", "icons"]) {
    const from = path.join(ROOT, entry);
    if (fs.existsSync(from)) fs.cpSync(from, path.join(dir, entry), { recursive: true });
  }
  esbuild.buildSync({
    entryPoints: [path.join(ROOT, "src/main.jsx")],
    bundle: true, format: "iife", target: ["es2020"],
    jsxFactory: "React.createElement", jsxFragment: "React.Fragment",
    minify: true, legalComments: "none",
    outfile: path.join(dir, "app.js"),
  });
  return dir;
}

function stageRef(ref) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vd-ref-"));
  const tar = execFileSync("git", ["archive", ref], { cwd: ROOT, maxBuffer: 1 << 28 });
  const tarball = path.join(dir, "ref.tar");
  fs.writeFileSync(tarball, tar);
  execFileSync("tar", ["-xf", tarball, "-C", dir]);
  fs.rmSync(tarball);
  return dir;
}

/* Everything that would otherwise make two renders of the same page differ.
   Re-seeding per screen matters: it means each screen's cards depend only on
   its own draws, so a revision that adds content elsewhere does not
   desynchronise every screen after it.

   The save is seeded too. Most of the app lives behind progression, so a fresh
   profile would only ever render the map and one region — the other ten would
   go uncompared. */
const SAVE = JSON.stringify({
  scores: {}, items: {}, reviews: {},
  game: {
    xp: 0,
    today: { key: "2025-12-08", xp: 0, due: 0, answers: 0, missions: 0, flawless: 0, boss: 0, combo: 0, ear: 0, forge: 0, goalMet: false },
    streak: { count: 0, best: 0, last: null, freezes: 1 },
    regions: Object.fromEntries(
      ["rules", "suffix", "sound", "verbs", "past", "periphrasis", "subjunctive", "gender", "mexicanismos", "connectors", "arena"]
        .map((id) => [id, { stages: Object.fromEntries(["recon", "signature", "sudden", "boss"].map((s) => [s, { cleared: true, best: 1, runs: 1 }])) }]),
    ),
    badges: [], settings: { motion: "reduced", sound: false, haptics: false },
  },
});

const DETERMINISM = (save) => {
  window.__seed = () => {
    let s = 42;
    Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  };
  window.__seed();
  const frozen = 1765200000000;
  Date.now = () => frozen;
  try { localStorage.setItem("mx-pwa:mx:progress", save); } catch { /* private window */ }
};

async function capture(browser, port, label) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 1100 } });
  await page.addInitScript(DETERMINISM, SAVE);
  /* the webfont is remote; block it so both sides fall back at the same moment */
  await page.route("**://fonts.googleapis.com/**", (r) => r.abort());
  await page.route("**://fonts.gstatic.com/**", (r) => r.abort());

  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important}" });
  await page.waitForSelector(".map-screen .node", { timeout: 15000 });
  await page.waitForTimeout(700);

  const shots = new Map();
  const shoot = async (name) => {
    await page.waitForTimeout(320);
    shots.set(name, await page.screenshot());
  };

  const home = async (where) => {
    await page.click(`.dock-btn[aria-label^="${where}"]`);
    await page.waitForTimeout(240);
  };

  await shoot("map");
  await home("Hoy");
  await shoot("today");
  await home("Lab");
  await shoot("lab");
  await home("Ruta");

  const regions = await page.$$eval(".node-label", (els) => els.map((e) => e.textContent.trim()));
  for (const region of regions) {
    await page.evaluate(() => window.__seed());
    await home("Ruta");
    await page.click(`.map-cell:has(.node-label:text-is("${region}")) .node`);
    await page.waitForSelector(".region-screen", { timeout: 10000 });
    await shoot(`region-${region}`);

    /* every codex entry, since that is where the reference material lives */
    await page.click(".codex-link");
    await page.waitForSelector(".codex", { timeout: 10000 });
    const entries = await page.$$eval(".rail-dot", (els) => els.length);
    await shoot(`codex-${region}-1`);
    for (let i = 1; i < entries; i++) {
      await page.click(`.rail-dot >> nth=${i}`);
      await shoot(`codex-${region}-${i + 1}`);
    }
    await page.click('.icon-btn[aria-label="Back to the region"]');
    await page.waitForSelector(".region-screen", { timeout: 10000 });

    /* the first card of the first mission: the drill's own layout, which is
       otherwise never rendered by this harness */
    await page.evaluate(() => window.__seed());
    await page.click(".stage-btn:not([disabled])");
    await page.waitForSelector(".mission", { timeout: 10000 });
    await shoot(`mission-${region}`);
    await page.click('.icon-btn[aria-label="Leave this mission"]');
    await page.waitForSelector(".region-screen", { timeout: 10000 });
  }

  await page.close();
  console.log(`  rendered ${shots.size} screens (${label})`);
  return shots;
}

function comparePng(PNG, a, b) {
  const x = PNG.sync.read(a);
  const y = PNG.sync.read(b);
  if (x.width !== y.width || y.height !== x.height) {
    return { differs: true, reason: `size ${x.width}x${x.height} vs ${y.width}x${y.height}` };
  }
  let n = 0, minX = Infinity, maxX = -1, minY = Infinity, maxY = -1;
  for (let py = 0; py < x.height; py++) {
    for (let px = 0; px < x.width; px++) {
      const i = (py * x.width + px) * 4;
      if (x.data[i] !== y.data[i] || x.data[i + 1] !== y.data[i + 1] || x.data[i + 2] !== y.data[i + 2]) {
        n++;
        if (px < minX) minX = px; if (px > maxX) maxX = px;
        if (py < minY) minY = py; if (py > maxY) maxY = py;
      }
    }
  }
  if (!n) return { differs: false };
  return {
    differs: true,
    reason: `${n} pixels (${((100 * n) / (x.width * x.height)).toFixed(3)}%) in x:${minX}-${maxX} y:${minY}-${maxY}`,
  };
}

(async () => {
  let chromium, esbuild, PNG;
  try {
    ({ chromium } = require("playwright"));
    esbuild = require("esbuild");
    ({ PNG } = require("pngjs"));
  } catch {
    console.error("missing dependencies — run: npm install && npx playwright install chromium");
    process.exit(1);
  }

  console.log(`comparing the working tree against ${REF}`);
  const workDir = stageWorkingTree(esbuild);
  const refDir = stageRef(REF);

  const work = await serve(workDir);
  const ref = await serve(refDir);
  const launch = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};
  const browser = await chromium.launch(launch);

  /* Prove the harness is deterministic before trusting a pass: render the same
     side twice and require it to match itself. Without this a green run could
     just mean the comparison is not looking at anything. */
  const selfA = await capture(browser, work.port, "self-check pass 1");
  const selfB = await capture(browser, work.port, "self-check pass 2");
  for (const [screen, image] of selfA) {
    const result = comparePng(PNG, image, selfB.get(screen));
    if (result.differs) {
      console.error(`\nthe harness is not deterministic: ${screen} differs from itself — ${result.reason}`);
      console.error("a comparison against another revision would be meaningless, so stopping here.");
      await browser.close(); work.server.close(); ref.server.close();
      process.exit(2);
    }
  }
  console.log("  self-check: every screen matches itself\n");

  /* The other revision is rendered by the same code path, which only works
     while both sides still have the same screens. A refactor big enough to
     rename them is a real answer to "did the pixels change" — just not one
     this harness can express — so say so plainly instead of dying on a
     selector timeout. */
  let theirs;
  try {
    theirs = await capture(browser, ref.port, REF);
  } catch (err) {
    console.error(`\n${REF} does not render the screens this revision has (${String(err.message || err).split("\n")[0]}).`);
    console.error("There is nothing to compare pixel for pixel across a change that large.");
    await browser.close(); work.server.close(); ref.server.close();
    process.exit(0);
  }
  await browser.close();
  work.server.close();
  ref.server.close();

  const onlyHere = [...selfA.keys()].filter((t) => !theirs.has(t));
  const onlyThere = [...theirs.keys()].filter((t) => !selfA.has(t));
  const shared = [...selfA.keys()].filter((t) => theirs.has(t));

  const differing = [];
  for (const screen of shared) {
    const result = comparePng(PNG, theirs.get(screen), selfA.get(screen));
    if (!result.differs) continue;
    differing.push({ screen, reason: result.reason });
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, `${screen}-before.png`), theirs.get(screen));
    fs.writeFileSync(path.join(OUT, `${screen}-after.png`), selfA.get(screen));
  }

  console.log(`identical: ${shared.length - differing.length}/${shared.length} shared screens`);
  if (onlyHere.length) console.log(`added here: ${onlyHere.join(", ")}`);
  if (onlyThere.length) console.log(`only in ${REF}: ${onlyThere.join(", ")}`);

  if (differing.length) {
    console.log("\nchanged:");
    for (const d of differing) console.log(`  ${d.screen} — ${d.reason}`);
    console.log(`\nbefore/after written to ${OUT}`);
    console.log("If the change was intended, this is the expected result; if not, it is a regression.");
    process.exit(1);
  }
  console.log("\nno visual change");
})();
