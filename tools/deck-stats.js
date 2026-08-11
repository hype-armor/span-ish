#!/usr/bin/env node
/* Prints the composition of the card set.
 *
 * docs/learning-design.md argues about the balance between recognition and
 * production, how much practice happens in context, and how much of the
 * listening surface exists. Those numbers move every time content is added,
 * so the document cites this command rather than hardcoding them.
 *
 * Run: npm run stats
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");
const esbuild = require("esbuild");

const ROOT = path.join(__dirname, "..");

/* Load the decks the way index.html does, then build the cards the way the
   app does, so these are the real numbers and not an approximation. */
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const file of fs.readdirSync(path.join(ROOT, "content")).sort()) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, "content", file), "utf8"), sandbox);
}
global.window = sandbox.window;

const bundle = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "mx-stats-")), "decks.cjs");
esbuild.buildSync({
  entryPoints: [path.join(ROOT, "src/lib/decks.js")],
  bundle: true, format: "cjs", platform: "node", outfile: bundle,
});
const { cardsFor, MODULES } = require(bundle);

const rows = [];
let mc = 0, typed = 0, binary = 0, inContext = 0, listening = 0, strict = 0;

for (const mod of MODULES) {
  const cards = cardsFor(mod);
  const modMc = cards.filter((c) => c.kind === "mc").length;
  rows.push({ mod, total: cards.length, mc: modMc, typed: cards.length - modMc });
  for (const c of cards) {
    if (c.kind === "mc") { mc++; if (c.opts.length === 2) binary++; } else typed++;
    if (c.q && c.q.includes("⌷")) inContext++;
    if (c.listen) listening++;
    if (c.strict) strict++;
  }
}

const total = mc + typed;
const pct = (n) => Math.round((100 * n) / total) + "%";

console.log("cards by module");
for (const r of rows.sort((a, b) => b.total - a.total)) {
  console.log(`  ${r.mod.padEnd(14)} ${String(r.total).padStart(4)}   ${r.typed} typed · ${r.mc} choice`);
}

console.log(`\ntotal cards            ${total}`);
console.log(`  typed production     ${typed} (${pct(typed)})   short answer, graded against the real form`);
console.log(`  multiple choice      ${mc} (${pct(mc)})`);
console.log(`    of those, binary   ${binary} (${Math.round((100 * binary) / mc)}% of choice cards)`);
console.log(`  practised in context ${inContext} (${pct(inContext)})   a blank inside a sentence`);
console.log(`  listening            ${listening} (${pct(listening)})   ${strict} graded strictly`);
