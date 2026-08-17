#!/usr/bin/env node
/* Content linter for content/*.js.
 *
 * The app reads these decks without validating them, and most mistakes are
 * silent rather than loud: a repeated key wipes out an earlier deck, a
 * duplicate identity field makes two cards share one scheduling slot, a typo
 * in `conf` quietly downgrades a drill's wrong answers. None of that throws.
 *
 * Run: node tools/check-content.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content");

/* Load in the same order index.html does, so "later file wins" matches reality. */
const ORDER = ["glossary", "suffixes", "sound", "listening", "verbs", "preterite", "imperfect", "tenses", "subjunctive", "subjunctive-past", "gender", "mexicanismos", "connectors", "rules"];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.jsx?$/.test(entry.name)) out.push(fs.readFileSync(full, "utf8"));
  }
  return out;
}

let failures = 0;
const fail = (where, msg) => { console.error(`  ✗ ${where}: ${msg}`); failures++; };

/* ---------- load, and catch keys that collide across files ---------- */

const shared = { window: {} };
vm.createContext(shared);
const owner = new Map();

for (const name of ORDER) {
  const file = path.join(CONTENT, name + ".js");
  if (!fs.existsSync(file)) { fail("content/" + name + ".js", "missing"); continue; }

  const solo = { window: {} };
  vm.createContext(solo);
  try {
    vm.runInContext(fs.readFileSync(file, "utf8"), solo);
  } catch (e) {
    fail("content/" + name + ".js", "does not evaluate: " + e.message);
    continue;
  }
  for (const key of Object.keys(solo.window.MX || {})) {
    if (owner.has(key)) {
      fail("content/" + name + ".js",
        `defines window.MX.${key}, already defined in content/${owner.get(key)}.js — ` +
        `the later file silently replaces the earlier deck`);
    } else {
      owner.set(key, name);
    }
  }
  vm.runInContext(fs.readFileSync(file, "utf8"), shared);
}

const MX = shared.window.MX || {};

/* ---------- helpers ---------- */

function deck(name) {
  const v = MX[name];
  if (!Array.isArray(v)) { fail(name, "missing, or not an array"); return null; }
  if (!v.length) { fail(name, "is empty"); return null; }
  return v;
}

/* Every entry must carry these fields, non-empty. */
function requireFields(name, fields, opts = {}) {
  const rows = deck(name);
  if (!rows) return;
  rows.forEach((row, i) => {
    for (const f of fields) {
      const v = row[f];
      if (v === undefined || v === null || v === "") fail(name, `entry ${i} is missing "${f}"`);
    }
  });
  if (opts.min && rows.length < opts.min) {
    fail(name, `has ${rows.length} entries; the drill needs at least ${opts.min} to build wrong answers`);
  }
}

/* Card ids are derived from these fields, so a repeat means two cards share
   one scheduling slot — you would answer one and both would advance. */
function requireUnique(name, label, keyFn) {
  const rows = MX[name];
  if (!Array.isArray(rows)) return;
  const seen = new Map();
  rows.forEach((row, i) => {
    const k = keyFn(row);
    if (seen.has(k)) fail(name, `entries ${seen.get(k)} and ${i} share ${label} "${k}", so they collide as one card`);
    else seen.set(k, i);
  });
}

function requireOneOf(name, label, values, valueFn) {
  const rows = MX[name];
  if (!Array.isArray(rows)) return;
  rows.forEach((row, i) => {
    const v = valueFn(row);
    if (!values.includes(v)) fail(name, `entry ${i} has ${label} "${v}"; expected one of ${values.join(", ")}`);
  });
}

/* `conf` names other entries to use as wrong answers. The app looks them up
   and silently falls back when a name does not resolve. */
function checkConf(name, keyFn) {
  const rows = MX[name];
  if (!Array.isArray(rows)) return;
  const keys = new Set(rows.map(keyFn));
  rows.forEach((row, i) => {
    for (const c of row.conf || []) {
      if (!keys.has(c)) fail(name, `entry ${i} lists conf "${c}", which matches no entry — the drill will quietly pick a random distractor instead`);
      if (c === keyFn(row)) fail(name, `entry ${i} lists itself in conf`);
    }
  });
}

/* Blanks are what the learner fills in. */
function requireBlank(name, sentsFn) {
  const rows = MX[name];
  if (!Array.isArray(rows)) return;
  rows.forEach((row, i) => {
    const sents = sentsFn(row) || [];
    if (!sents.length) fail(name, `entry ${i} has no sentences`);
    sents.forEach((s, j) => {
      if (!String(s.s || "").includes("___")) fail(name, `entry ${i} sentence ${j} has no ___ blank`);
      if (!s.t) fail(name, `entry ${i} sentence ${j} has no translation`);
    });
  });
}

/* The blank is replaced by the answer to build the model sentence, the audio
   and the explanation, so "___ ," renders as "Si quieres , te acompaño" —
   a space Spanish never writes, shown to the learner as the correct answer. */
function checkBlankSpacing(name, sentencesFn) {
  const rows = MX[name];
  if (!Array.isArray(rows)) return;
  rows.forEach((row, i) => {
    for (const s of sentencesFn(row)) {
      if (/___\s+[,.;:?!]/.test(String(s || ""))) {
        fail(name, `entry ${i} leaves a space between the blank and the punctuation, which survives into the filled-in sentence: ${s}`);
      }
    }
  });
}

/* ---------- the decks ---------- */

requireFields("glossary", ["term", "what"]);
requireUnique("glossary", "the term", (r) => r.term);
{
  /* Every term and alias is matched against prose, so two entries claiming the
     same word would make which definition opens arbitrary. */
  const claimed = new Map();
  (MX.glossary || []).forEach((r) => {
    for (const word of [r.term, ...(r.also || [])]) {
      const key = String(word).toLowerCase();
      if (claimed.has(key) && claimed.get(key) !== r.term) {
        fail("glossary", `"${word}" is claimed by both "${claimed.get(key)}" and "${r.term}"; matching would be arbitrary`);
      }
      claimed.set(key, r.term);
      if (word !== key) fail("glossary", `"${word}" should be lowercase; matching is case-insensitive and the text's own casing is kept`);
    }
  });

  /* A definition for a word the app never uses can never be opened.
     glossary.js is excluded from the corpus on purpose: every term appears in
     its own definition, so including it would make this check always pass. */
  const prose = [
    ...fs.readdirSync(CONTENT)
      .filter((f) => f !== "glossary.js")
      .map((f) => fs.readFileSync(path.join(CONTENT, f), "utf8")),
    ...walk(path.join(ROOT, "src")),
  ].join("\n").toLowerCase();
  (MX.glossary || []).forEach((r) => {
    const words = [r.term, ...(r.also || [])];
    const used = words.some((w) => new RegExp(`\\b${String(w).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(prose));
    if (!used) fail("glossary", `"${r.term}" never appears in any prose or card text, so it can never be clicked`);
  });
}

requireFields("suffixes", ["en", "es", "re", "tail", "ex", "note"]);
requireUnique("suffixes", "the English ending", (r) => r.en);
(MX.suffixes || []).forEach((r, i) => {
  if (!(r.re instanceof RegExp) && Object.prototype.toString.call(r.re) !== "[object RegExp]") {
    fail("suffixes", `entry ${i} ("${r.en}") has a non-regex "re"`);
  }
  (r.ex || []).forEach((pair, j) => {
    if (!Array.isArray(pair) || pair.length !== 2) fail("suffixes", `entry ${i} example ${j} is not an [english, spanish] pair`);
  });
});

/* Held-out probe pairs. These are never shown as cards, so nothing else in the
   app would notice them going wrong — the linter is the only thing standing
   between a typo here and a learner being marked wrong for knowing the rule.
   tools/test-lib.js separately checks each pair against the converter. */
{
  const seenEn = new Map();
  const seenEs = new Map();
  (MX.suffixes || []).forEach((r) => {
    const probe = r.probe;
    if (!Array.isArray(probe) || probe.length < 6) {
      fail("suffixes", `"${r.en}" has ${(probe || []).length} probe pairs; a family that runs dry stops being measurable`);
      return;
    }
    const taught = new Set(r.ex.map(([en]) => String(en).toLowerCase()));
    probe.forEach((pair, i) => {
      if (!Array.isArray(pair) || pair.length !== 2) {
        fail("suffixes", `"${r.en}" probe ${i} is not an [english, spanish] pair`);
        return;
      }
      const [en, es] = pair;
      if (taught.has(String(en).toLowerCase())) {
        fail("suffixes", `"${en}" is both taught and held out for ${r.en}; a probe has to be a word the app never shows`);
      }
      if (!r.re.test(en)) {
        fail("suffixes", `"${en}" is a probe for ${r.en} but does not match that rule's own pattern`);
      }
      if (seenEn.has(en)) fail("suffixes", `probe word "${en}" appears under both ${seenEn.get(en)} and ${r.en}`);
      else seenEn.set(en, r.en);
      if (seenEs.has(es)) fail("suffixes", `probe answer "${es}" appears under both ${seenEs.get(es)} and ${r.en}`);
      else seenEs.set(es, r.en);
    });
  });
}

/* A chip that matches no rule shows "no rule matches that ending". */
(MX.converterExamples || []).forEach((word) => {
  if (typeof word !== "string" || !word.trim()) { fail("converterExamples", `"${word}" is not a word`); return; }
  const hit = (MX.suffixes || []).some((s) => s.re && s.re.test(word));
  if (!hit) fail("converterExamples", `"${word}" matches no suffix rule, so the converter will reject it`);
});

requireFields("vowels", ["l", "s", "w", "g"]);
requireUnique("vowels", "the letter", (r) => r.l);
requireFields("consonants", ["l", "r", "w"]);
requireUnique("consonants", "the letter", (r) => r.l);
requireFields("xSounds", ["w", "s", "ex", "n"]);
requireUnique("xSounds", "the sound", (r) => r.s);
requireFields("stressRules", ["cond", "rule", "ex"], { min: 3 });
requireUnique("stressRules", "the condition", (r) => r.cond);
requireFields("dictation", ["w", "hint"]);
requireUnique("dictation", "the word", (r) => r.w);

requireFields("sentenceDictation", ["s", "t", "hint"]);
requireUnique("sentenceDictation", "the sentence", (r) => r.s);
(MX.sentenceDictation || []).forEach((r, i) => {
  /* These are heard and written back whole, so a blank would be unanswerable. */
  if (String(r.s).includes("___")) fail("sentenceDictation", `entry ${i} contains a ___ blank; these are written out in full`);
  if (!/\s/.test(String(r.s).trim())) fail("sentenceDictation", `entry ${i} ("${r.s}") is a single word; sound.js dictation covers those`);
});

requireFields("irregularVerbs", ["v", "m", "yo", "g", "f"]);
requireUnique("irregularVerbs", "the infinitive", (r) => r.v);
requireFields("verbSentences", ["v", "p", "a", "sents"]);
requireUnique("verbSentences", "the verb and answer", (r) => r.v + ":" + r.a);
requireBlank("verbSentences", (r) => r.sents);

/* The ending tables src/lib/conjugate.js reads.
 *
 * These rows are prose for a learner and data for the generator at the same
 * time, which is the point — one table, so the two cannot drift. That only
 * holds if the shape holds: five cells in the repo's person order, each an
 * ending rather than a whole word, and a key the generator can find the row
 * by. Until now the five-form invariant was checked on two of the six tables
 * that carry five-form strings. */
{
  const fiveCells = (name, label, text) => {
    const cells = String(text).split(",").map((c) => c.trim());
    if (cells.length !== 5) {
      fail(name, `${label} lists ${cells.length} cells; the repo's person order is five (yo, tú, él/ella, nosotros, ellos)`);
      return null;
    }
    return cells;
  };

  const keyed = (name, rows, field, expected) => {
    const seen = [];
    (rows || []).forEach((r, i) => {
      if (!r.k) return;
      if (seen.includes(r.k)) fail(name, `two rows share the key "${r.k}"`);
      seen.push(r.k);
      const cells = fiveCells(name, `"${r.k}"`, r[field]);
      if (cells) {
        for (const cell of cells) {
          if (!cell.startsWith("-")) fail(name, `"${r.k}" cell "${cell}" is not an ending; the generator appends these to a stem`);
        }
      }
    });
    const missing = expected.filter((k) => !seen.includes(k));
    if (missing.length) fail(name, `no row is keyed ${missing.join(", ")} — src/lib/conjugate.js looks rows up by key`);
  };

  keyed("ruleVerbForms", MX.ruleVerbForms, "a",
    ["present:ar", "present:er", "present:ir", "preterite:ar", "preterite:er-ir"]);
  keyed("imperfectEndings", MX.imperfectEndings, "e", ["imperfect:ar", "imperfect:er-ir"]);

  /* The present subjunctive stores its vowel rather than its endings, so it is
     checked differently: one letter, and the two rows must not agree. */
  const vowels = (MX.ruleSubjunctive || []).filter((r) => r.k);
  for (const row of vowels) {
    if (!/^[aeiou]$/.test(String(row.a).trim())) {
      fail("ruleSubjunctive", `"${row.k}" has vowel "${row.a}"; the generator builds its endings out of a single letter`);
    }
  }
  if (vowels.length !== 2) fail("ruleSubjunctive", `${vowels.length} rows carry a key; conjugate.js needs subjunctive:ar and subjunctive:er-ir`);
  else if (String(vowels[0].a).trim() === String(vowels[1].a).trim()) {
    fail("ruleSubjunctive", "both keyed rows flip to the same vowel, which cannot be right");
  }

  /* irregularVerbs was never count-checked either. */
  (MX.irregularVerbs || []).forEach((r) => fiveCells("irregularVerbs", `"${r.v}"`, r.f));
}

/* The regular verbs the generator is allowed to build.
 *
 * Two things have to hold, and only one of them is mechanical. The endings
 * below force a spelling or stem change somewhere in the four tenses, so a
 * verb carrying one cannot be built by appending an ending to a stem. The
 * other thing — that a verb is not a boot verb — no check can see: contar and
 * caminar are the same shape. That part is judgement, and the reason the list
 * is short and ordinary. */
{
  const FORCED_CHANGE = [
    [/car$/, "yo preterite is -qué, not -cé (busqué)"],
    [/gar$/, "yo preterite is -gué (llegué)"],
    [/zar$/, "yo preterite is -cé (empecé)"],
    [/[gG]er$/, "yo present is -jo (protejo)"],
    [/gir$/, "yo present is -jo (dirijo)"],
    [/guir$/, "the u drops in yo (sigo)"],
    [/uir$/, "a y appears (construyo)"],
    [/[aeo]er$/, "the i turns to y (leyó)"],
    [/aer$/, "the i turns to y (cayó)"],
    [/ñer$|ñir$/, "the i is swallowed (gruñó)"],
    [/iar$|uar$/, "whether the i or u takes an accent cannot be read off the infinitive — envío but limpio"],
  ];

  const rows = MX.regularVerbs;
  if (!Array.isArray(rows) || !rows.length) fail("regularVerbs", "missing, or not an array");
  else {
    requireFields("regularVerbs", ["v", "en"]);
    requireUnique("regularVerbs", "the infinitive", (r) => r.v);

    const irregular = new Set([
      ...(MX.irregularVerbs || []).map((r) => r.v),
      ...(MX.preteriteStems || []).flatMap((r) => String(r.v).split("/").map((x) => x.trim())),
      ...(MX.imperfectIrregular || []).map((r) => r.v),
      ...(MX.ruleSubjunctiveForms || []).map((r) => r.v),
    ]);

    /* A verb the app already uses is not new material, which is the whole
       point of these. This catches an infinitive appearing in another deck;
       it cannot catch a verb the app only ever shows conjugated, because
       \bescuchar\b does not match "escuchaba". tools/test-lib.js closes that
       by generating each verb's own forms and looking for those. */
    const spoken = fs.readdirSync(CONTENT)
      .filter((f) => f !== "verbs.js")
      .map((f) => fs.readFileSync(path.join(CONTENT, f), "utf8"))
      .join("\n")
      .toLowerCase();

    rows.forEach((r) => {
      const v = String(r.v).toLowerCase();
      if (!/(ar|er|ir)$/.test(v)) {
        fail("regularVerbs", `"${v}" does not end in -ar, -er or -ir`);
        return;
      }
      for (const [pattern, why] of FORCED_CHANGE) {
        if (pattern.test(v)) { fail("regularVerbs", `"${v}" is not regular throughout: ${why}`); return; }
      }
      if (irregular.has(v)) fail("regularVerbs", `"${v}" is listed as irregular elsewhere in content/`);
      if (new RegExp(`\\b${v}\\b`).test(spoken)) {
        fail("regularVerbs", `"${v}" already appears in another deck, so it is not a verb the learner has never met`);
      }
    });
  }
}

requireFields("preteriteStems", ["v", "stem", "f", "n"]);
requireUnique("preteriteStems", "the verb", (r) => r.v);
(MX.preteriteStems || []).forEach((r, i) => {
  const forms = String(r.f).split(",").map((f) => f.trim());
  if (forms.length !== 5) fail("preteriteStems", `entry ${i} ("${r.v}") lists ${forms.length} forms; Mexico uses five (no vosotros)`);
  /* the whole point of the group is that none of them takes an accent */
  for (const form of forms) {
    if (/[áéíóú]/.test(form)) fail("preteriteStems", `"${form}" carries a written accent; strong preterites do not`);
  }
});
requireFields("preteriteSentences", ["v", "p", "a", "sents"]);
requireUnique("preteriteSentences", "the verb and answer", (r) => r.v + ":" + r.a);
requireBlank("preteriteSentences", (r) => r.sents);
/* every drilled answer has to be a form the stem table actually lists */
{
  const byVerb = new Map((MX.preteriteStems || []).map((r) => [r.v, String(r.f).split(",").map((f) => f.trim())]));
  (MX.preteriteSentences || []).forEach((r, i) => {
    const forms = byVerb.get(r.v);
    if (!forms) { fail("preteriteSentences", `entry ${i} drills "${r.v}", which has no row in preteriteStems`); return; }
    if (!forms.includes(r.a)) fail("preteriteSentences", `entry ${i} answers "${r.a}", which is not among ${r.v}'s forms (${forms.join(", ")})`);
  });
}

requireFields("imperfectEndings", ["kind", "e", "ex", "n"]);
requireUnique("imperfectEndings", "the verb class", (r) => r.kind);
requireFields("imperfectIrregular", ["v", "f", "n"]);
requireUnique("imperfectIrregular", "the verb", (r) => r.v);
(MX.imperfectIrregular || []).forEach((r, i) => {
  const forms = String(r.f).split(",").map((f) => f.trim());
  if (forms.length !== 5) fail("imperfectIrregular", `entry ${i} ("${r.v}") lists ${forms.length} forms; Mexico uses five (no vosotros)`);
});
requireFields("aspectCues", ["cue", "side", "n"]);
requireUnique("aspectCues", "the cue", (r) => r.cue);
requireOneOf("aspectCues", "side", ["pret", "imp"], (r) => r.side);

requireFields("aspectContrasts", ["id", "cue", "mood", "sents"]);
requireUnique("aspectContrasts", "the id", (r) => r.id);
requireOneOf("aspectContrasts", "mood", ["pret", "imp"], (r) => r.mood);
(MX.aspectContrasts || []).forEach((r, i) => {
  const sents = r.sents || [];
  if (!sents.length) fail("aspectContrasts", `entry ${i} has no sentences`);
  sents.forEach((s, j) => {
    if (!String(s.s || "").includes("___")) fail("aspectContrasts", `entry ${i} sentence ${j} has no ___ blank`);
    if (!s.t) fail("aspectContrasts", `entry ${i} sentence ${j} has no translation`);
    if (!s.pret || !s.imp) fail("aspectContrasts", `entry ${i} sentence ${j} needs both a pret and an imp form`);
    /* the point of the drill is that the wrong answer is the other real form */
    if (s.pret === s.imp) fail("aspectContrasts", `entry ${i} sentence ${j} has identical forms, so the card has no answer`);
  });
});

requireFields("periphrasis", ["p", "m", "ex", "t", "note"], { min: 4 });
requireUnique("periphrasis", "the pattern", (r) => r.p);
checkConf("periphrasis", (r) => r.p);

requireFields("subjunctiveTriggers", ["p", "m"]);
requireUnique("subjunctiveTriggers", "the phrase", (r) => r.p);
(MX.subjunctiveTriggers || []).forEach((r, i) => {
  if (typeof r.s !== "boolean") fail("subjunctiveTriggers", `entry ${i} ("${r.p}") needs s: true or false`);
});
requireFields("subjunctiveSentences", ["id", "trig", "mood", "sents"]);
requireUnique("subjunctiveSentences", "the id", (r) => r.id);
requireOneOf("subjunctiveSentences", "mood", ["sub", "ind"], (r) => r.mood);
requireBlank("subjunctiveSentences", (r) => r.sents);
(MX.subjunctiveSentences || []).forEach((r, i) => {
  (r.sents || []).forEach((s, j) => {
    if (!s.ind || !s.sub) fail("subjunctiveSentences", `entry ${i} sentence ${j} needs both ind and sub forms`);
    if (s.ind === s.sub) fail("subjunctiveSentences", `entry ${i} sentence ${j} has identical ind and sub forms, so the card has no answer`);
  });
});

requireFields("imperfectSubjunctiveEndings", ["set", "ex", "n"]);
requireUnique("imperfectSubjunctiveEndings", "the ending set", (r) => r.set);
requireFields("imperfectSubjunctiveRegular", ["v", "ellos", "a"]);
requireUnique("imperfectSubjunctiveRegular", "the verb", (r) => r.v);
requireFields("imperfectSubjunctiveUses", ["use", "ex", "t", "n"]);
requireUnique("imperfectSubjunctiveUses", "the situation", (r) => r.use);

/* The drill derives these forms by dropping -ron off the ellos preterite, so
   the derivation has to hold for every verb it is applied to. */
(MX.preteriteStems || []).forEach((r) => {
  const ellos = String(r.f).split(",")[4];
  if (!ellos || !/ron\s*$/.test(ellos)) {
    fail("preteriteStems", `${r.v}'s ellos form is "${(ellos || "").trim()}"; the imperfect subjunctive is built by dropping -ron, so it must end in -ron`);
  }
});
(MX.imperfectSubjunctiveRegular || []).forEach((r, i) => {
  if (!/ron$/.test(r.ellos)) fail("imperfectSubjunctiveRegular", `entry ${i} ("${r.v}") has ellos "${r.ellos}", which does not end in -ron`);
  else if (r.ellos.replace(/ron$/, "") + "ra" !== r.a) {
    fail("imperfectSubjunctiveRegular", `entry ${i} ("${r.v}") says ${r.a}, but ${r.ellos} minus -ron plus -ra is ${r.ellos.replace(/ron$/, "") + "ra"}`);
  }
});

requireFields("siClauses", ["id", "s", "sub", "cond", "t"]);
requireUnique("siClauses", "the id", (r) => r.id);
(MX.siClauses || []).forEach((r, i) => {
  if (!String(r.s).includes("___")) fail("siClauses", `entry ${i} has no ___ blank`);
  if (!/\bsi\b/i.test(String(r.s))) fail("siClauses", `entry ${i} has no "si" in it, so it is not a si clause`);
  if (r.sub === r.cond) fail("siClauses", `entry ${i} has identical options, so the card has no answer`);
});

requireFields("backshift", ["id", "trig", "s", "past", "present", "t"]);
requireUnique("backshift", "the id", (r) => r.id);
(MX.backshift || []).forEach((r, i) => {
  if (!String(r.s).includes("___")) fail("backshift", `entry ${i} has no ___ blank`);
  if (r.past === r.present) fail("backshift", `entry ${i} has identical options, so the card has no answer`);
});

requireFields("genderEndings", ["end", "g", "ex"]);
requireUnique("genderEndings", "the ending", (r) => r.end);
requireOneOf("genderEndings", "gender", ["f", "m"], (r) => r.g);
(MX.genderNouns || []).forEach((row, i) => {
  if (!Array.isArray(row) || row.length !== 2) fail("genderNouns", `entry ${i} is not a [noun, article] pair`);
});
requireUnique("genderNouns", "the noun", (r) => r[0]);
requireOneOf("genderNouns", "the article", ["el", "la"], (r) => r[1]);
(MX.genderExceptionTable || []).forEach((row, i) => {
  if (!Array.isArray(row) || row.length !== 3) fail("genderExceptionTable", `entry ${i} is not a [word, article, why] row`);
});

const sentsOf = (r) => (r.sents || []).map((s) => s.s);
checkBlankSpacing("verbSentences", sentsOf);
checkBlankSpacing("preteriteSentences", sentsOf);
checkBlankSpacing("subjunctiveSentences", sentsOf);
checkBlankSpacing("aspectContrasts", sentsOf);
checkBlankSpacing("siClauses", (r) => [r.s]);
checkBlankSpacing("backshift", (r) => [r.s]);

requireFields("mexicanismos", ["mx", "sp", "en", "n"]);
requireUnique("mexicanismos", "the Mexican word", (r) => r.mx);
requireFields("connectors", ["p", "m", "u"], { min: 4 });
requireUnique("connectors", "the phrase", (r) => r.p);
checkConf("connectors", (r) => r.p);

/* Rules deck. The four-option drills need four distinct values to draw from. */
requireFields("ruleGenderExceptions", ["q", "a", "why"]);
requireUnique("ruleGenderExceptions", "the prompt", (r) => r.q);
requireOneOf("ruleGenderExceptions", "the article", ["el", "la"], (r) => r.a);
requireFields("ruleVerbForms", ["q", "a", "why"], { min: 4 });
requireUnique("ruleVerbForms", "the prompt", (r) => r.q);
requireFields("ruleVerbEndings", ["q", "a", "why"], { min: 4 });
requireUnique("ruleVerbEndings", "the prompt", (r) => r.q);
requireFields("ruleAccents", ["q", "a", "why"], { min: 4 });
requireUnique("ruleAccents", "the prompt", (r) => r.q);
requireFields("ruleSubjunctiveForms", ["v", "a", "why"]);
requireUnique("ruleSubjunctiveForms", "the verb", (r) => r.v);

/* These two supply their own options, so the answer has to be among them. */
for (const name of ["ruleFacts", "ruleSubjunctive", "rulePreterite", "ruleImperfect", "ruleImperfectSubjunctive"]) {
  requireFields(name, ["q", "sub", "a", "opts", "why"]);
  requireUnique(name, "the prompt", (r) => r.q);
  (MX[name] || []).forEach((r, i) => {
    if (!Array.isArray(r.opts) || r.opts.length < 2) { fail(name, `entry ${i} needs at least two options`); return; }
    if (!r.opts.includes(r.a)) fail(name, `entry ${i} has answer "${r.a}", which is not among its options — the card is unanswerable`);
    if (new Set(r.opts).size !== r.opts.length) fail(name, `entry ${i} repeats an option`);
  });
}

/* ---------- report ---------- */

const counts = Object.entries(MX)
  .filter(([, v]) => Array.isArray(v))
  .map(([k, v]) => `${k} ${v.length}`);
console.log(`checked ${counts.length} decks across ${ORDER.length} files`);
console.log("  " + counts.join(" · "));

if (failures) {
  console.error(`\n${failures} problem${failures === 1 ? "" : "s"} found`);
  process.exit(1);
}
console.log("\ncontent OK");
