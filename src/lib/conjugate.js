/* Regular verbs, built rather than stored.
 *
 * Every finite form the app shows is authored in content/ — which means a
 * learner can memorise all of it and still not be able to conjugate `caminar`,
 * because no card in the app drills a regular verb at all. This builds them.
 *
 * The endings are not restated here. They are read from the same rows the
 * Rules region already teaches from, keyed by `k`, so the table a learner is
 * shown and the table the generator applies cannot drift apart. That is the
 * same bargain src/lib/decks.js makes when it derives the imperfect
 * subjunctive from the ellos preterite instead of writing it down twice.
 *
 * Correctness rests on two things, and only one of them is a check:
 *   - the arithmetic — stem plus ending — which tools/test-lib.js verifies
 *     against every worked paradigm content/ already contains, and against a
 *     golden table of its own;
 *   - the claim that a given verb is regular, which is judgement. The lexicon
 *     is screened mechanically for the endings that force a change, but no
 *     spelling separates `contar` from `caminar`. So this refuses any verb it
 *     has not been told about: a wrong answer is worse than no card.
 */
import { regularVerbs, ruleVerbForms, imperfectEndings, ruleSubjunctive } from "./content.js";

/* yo, tú, él/ella, nosotros, ellos — the order every five-form string in this
   repo uses. Mexico has no vosotros, and ustedes conjugates like ellos. */
export const PERSONS = ["yo", "tú", "él / ella", "nosotros", "ellos"];
export const TENSES = ["present", "preterite", "imperfect", "subjunctive"];

/* Shown on a card, so these are the learner's words rather than mine. */
export const TENSE_LABEL = {
  present: "present",
  preterite: "preterite",
  imperfect: "imperfect",
  subjunctive: "present subjunctive",
};

/* The three verbs content/ writes out in full. They are already taught, so
   they are not drill material — but their paradigms are what the generator is
   checked against, so it has to be willing to build them. */
export const MODELS = ["hablar", "comer", "vivir"];

const CLASSES = ["ar", "er", "ir"];

export function classOf(infinitive) {
  const cls = String(infinitive).slice(-2).toLowerCase();
  return CLASSES.includes(cls) ? cls : null;
}

const split = (text) => String(text).split(",").map((cell) => cell.trim().replace(/^-/, ""));

function byKey(rows, key) {
  const row = (rows || []).find((r) => r.k === key);
  return row || null;
}

/* Present subjunctive is the one tense with no ending list in content/ — what
   is stored is the vowel it flips to (`a: "e"` for -ar, `"a"` for the others),
   which is the whole rule. The shape around that vowel is uniform, so the
   endings are derived from it rather than written down a second time. */
function subjunctiveEndings(vowel) {
  return [vowel, vowel + "s", vowel, vowel + "mos", vowel + "n"];
}

/* Which row holds this tense for this class. -er and -ir part company only in
   the present; everywhere else one row covers both. */
function endingsFor(tense, cls) {
  if (tense === "present") {
    const row = byKey(ruleVerbForms, "present:" + cls);
    return row ? split(row.a) : null;
  }
  if (tense === "preterite") {
    const row = byKey(ruleVerbForms, cls === "ar" ? "preterite:ar" : "preterite:er-ir");
    return row ? split(row.a) : null;
  }
  if (tense === "imperfect") {
    const row = byKey(imperfectEndings, cls === "ar" ? "imperfect:ar" : "imperfect:er-ir");
    return row ? split(row.e) : null;
  }
  if (tense === "subjunctive") {
    const row = byKey(ruleSubjunctive, cls === "ar" ? "subjunctive:ar" : "subjunctive:er-ir");
    return row ? subjunctiveEndings(String(row.a).trim()) : null;
  }
  return null;
}

const known = () => new Set([...(regularVerbs || []).map((r) => r.v), ...MODELS]);

export const isRegular = (infinitive) => known().has(String(infinitive).toLowerCase());

/* Throws rather than guessing. A verb that reaches here without being on the
   list is a verb nobody has checked, and emitting `sacé` quietly would be a
   worse failure than a broken build. */
export function conjugate(infinitive, tense, person) {
  const verb = String(infinitive).toLowerCase();
  if (!isRegular(verb)) throw new Error(`conjugate: "${infinitive}" is not on the verified-regular list`);

  const cls = classOf(verb);
  if (!cls) throw new Error(`conjugate: "${infinitive}" does not end in -ar, -er or -ir`);

  const endings = endingsFor(tense, cls);
  if (!endings) throw new Error(`conjugate: no endings for ${tense} of an -${cls} verb`);
  if (endings.length !== PERSONS.length) {
    throw new Error(`conjugate: ${tense} of an -${cls} verb has ${endings.length} endings, expected ${PERSONS.length}`);
  }
  if (!(person >= 0 && person < PERSONS.length)) {
    throw new Error(`conjugate: person ${person} is outside 0-${PERSONS.length - 1}`);
  }

  return verb.slice(0, -2) + endings[person];
}

/* The whole paradigm, in person order. */
export const paradigm = (infinitive, tense) =>
  PERSONS.map((_, person) => conjugate(infinitive, tense, person));

/* The pool a card or a probe may draw from: the checked verbs, minus the three
   the app already teaches. */
export const drillableVerbs = () =>
  (regularVerbs || []).filter((r) => !MODELS.includes(r.v));
