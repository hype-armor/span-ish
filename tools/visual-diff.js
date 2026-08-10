#!/usr/bin/env node
/* Visual regression: renders every tab in the working tree and in some other
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
   Re-seeding per tab matters: it means each tab's cards depend only on its own
   draws, so a revision that adds content elsewhere does not desynchronise
   every tab after it. */
const DETERMINISM = () => {
  window.__seed = () => {
    let s = 42;
    Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  };
  window.__seed();
  const frozen = 1765200000000;
  Date.now = () => frozen;
};

async function capture(browser, port, label) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 1100 } });
  await page.addInitScript(DETERMINISM);
  /* the webfont is remote; block it so both sides fall back at the same moment */
  await page.route("**://fonts.googleapis.com/**", (r) => r.abort());
  await page.route("**://fonts.gstatic.com/**", (r) => r.abort());

  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important}" });
  await page.waitForSelector("nav .tab", { timeout: 15000 });
  await page.waitForTimeout(700);

  const tabs = await page.$$eval("nav .tab", (els) => els.map((e) => e.textContent.trim()));
  const shots = new Map();
  for (const tab of tabs) {
    await page.evaluate(() => window.__seed());
    await page.click(`nav .tab:has-text("${tab}")`);
    await page.waitForTimeout(400);
    shots.set(tab, await page.screenshot({ fullPage: true }));
  }
  await page.close();
  console.log(`  rendered ${tabs.length} tabs (${label})`);
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
  for (const [tab, image] of selfA) {
    const result = comparePng(PNG, image, selfB.get(tab));
    if (result.differs) {
      console.error(`\nthe harness is not deterministic: ${tab} differs from itself — ${result.reason}`);
      console.error("a comparison against another revision would be meaningless, so stopping here.");
      await browser.close(); work.server.close(); ref.server.close();
      process.exit(2);
    }
  }
  console.log("  self-check: every tab matches itself\n");

  const theirs = await capture(browser, ref.port, REF);
  await browser.close();
  work.server.close();
  ref.server.close();

  const onlyHere = [...selfA.keys()].filter((t) => !theirs.has(t));
  const onlyThere = [...theirs.keys()].filter((t) => !selfA.has(t));
  const shared = [...selfA.keys()].filter((t) => theirs.has(t));

  const differing = [];
  for (const tab of shared) {
    const result = comparePng(PNG, theirs.get(tab), selfA.get(tab));
    if (!result.differs) continue;
    differing.push({ tab, reason: result.reason });
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, `${tab}-before.png`), theirs.get(tab));
    fs.writeFileSync(path.join(OUT, `${tab}-after.png`), selfA.get(tab));
  }

  console.log(`identical: ${shared.length - differing.length}/${shared.length} shared tabs`);
  if (onlyHere.length) console.log(`added here: ${onlyHere.join(", ")}`);
  if (onlyThere.length) console.log(`only in ${REF}: ${onlyThere.join(", ")}`);

  if (differing.length) {
    console.log("\nchanged:");
    for (const d of differing) console.log(`  ${d.tab} — ${d.reason}`);
    console.log(`\nbefore/after written to ${OUT}`);
    console.log("If the change was intended, this is the expected result; if not, it is a regression.");
    process.exit(1);
  }
  console.log("\nno visual change");
})();
