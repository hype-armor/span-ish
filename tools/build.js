#!/usr/bin/env node
/* Bundles src/ into app.js.
 *
 * React is not bundled: vendor/react.js loads first and puts it on
 * window.__MX_REACT, which src/react.js reads. The decks are not bundled
 * either — they are the files you edit, loaded as plain scripts.
 *
 * Run:  npm run build          write app.js
 *       npm run build:check    fail if app.js does not match src/
 */
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "app.js");
const check = process.argv.includes("--check");

const options = {
  entryPoints: [path.join(ROOT, "src/main.jsx")],
  bundle: true,
  format: "iife",
  target: ["es2020"],
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  minify: true,
  legalComments: "none",
  banner: {
    js:
      "/* Built from src/ by tools/build.js — do not edit by hand.\n" +
      "   Content lives in content/, styles in styles.css. */",
  },
};

esbuild
  .build(check ? { ...options, write: false } : { ...options, outfile: OUT })
  .then((result) => {
    for (const w of result.warnings) console.warn(w.text);

    if (!check) {
      console.log(`app.js: ${fs.statSync(OUT).size} bytes`);
      return;
    }

    const built = result.outputFiles[0].text;
    const committed = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
    if (built === committed) {
      console.log("app.js matches src/");
      return;
    }
    console.error(
      "app.js is out of date: it does not match what src/ builds to.\n" +
      "Run `npm run build` and commit the result.",
    );
    process.exit(1);
  })
  .catch(() => process.exit(1));
