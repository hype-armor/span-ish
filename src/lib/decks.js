/* Turns the decks in content/ into drill cards.
 *
 * A card is:
 *   id     stable across sessions — this is what review history is keyed on,
 *          so changing the field an id is built from retires the old card
 *   kind   "mc" (pick an option) or "type" (write the answer)
 *   q/sub  the prompt and the instruction under it
 *   a      the answer; for "type" it may be a list of acceptable spellings
 *   canon  the answer to show when they get it wrong
 *   opts   the choices, for "mc"
 *   audio  what the speaker button says
 *   why    the explanation revealed after answering
 */
import { shuffle, sample, pick, distractors } from "./text.js";
import * as content from "./content.js";

const BLANK = "⌷"; // what a ___ becomes in a prompt

export const MODULES = [
  "rules",
  "suffix",
  "sound",
  "verbs",
  "past",
  "periphrasis",
  "subjunctive",
  "gender",
  "mexicanismos",
  "connectors",
];

/* ---------- Rules: the rules themselves, rather than applying them ---------- */

function rulesDeck() {
  const {
    suffixes, genderEndings, ruleGenderExceptions, ruleVerbForms,
    ruleVerbEndings, ruleFacts, ruleSubjunctive, ruleSubjunctiveForms, ruleAccents,
    rulePreterite, ruleImperfect, ruleImperfectSubjunctive,
  } = content;

  const suffixCards = suffixes.map((r) => {
    /* "-ance / -ence" should accept either half, with or without the hyphen. */
    const accepted = [r.es];
    for (const half of r.es.split(" / ")) {
      accepted.push(half, half.replace(/^-/, ""));
    }
    return {
      id: "rul:sfx:" + r.en, kind: "type", mod: "rules",
      q: r.en, sub: "Which Spanish ending?",
      a: accepted, canon: r.es, audio: r.ex[0][1],
      why: `${r.en} → ${r.es}. ${r.note}`,
    };
  });

  const genderRuleCards = genderEndings.map((r) => ({
    id: "rul:gen:" + r.end, kind: "mc", mod: "rules",
    q: r.end, sub: "Which article does the rule give?",
    a: r.g === "f" ? "la" : "el", opts: ["el", "la"],
    why: r.ex + ".",
  }));

  const genderExceptionCards = ruleGenderExceptions.map((r) => ({
    id: "rul:gex:" + r.q, kind: "mc", mod: "rules",
    q: r.q, sub: "Which article?", a: r.a, opts: ["el", "la"], why: r.why,
  }));

  /* The paradigms are mutually plausible, so they are each other's distractors. */
  const verbFormCards = ruleVerbForms.map((r) => ({
    id: "rul:vf:" + r.q, kind: "mc", mod: "rules",
    q: r.q, sub: "Which endings?", a: r.a,
    opts: shuffle([r.a, ...sample(ruleVerbForms.filter((o) => o.a !== r.a).map((o) => o.a), 3)]),
    why: r.why,
  }));

  const verbEndingCards = ruleVerbEndings.map((r) => ({
    id: "rul:ve:" + r.q, kind: "mc", mod: "rules",
    q: r.q, sub: "Which ending?", a: r.a,
    opts: shuffle(ruleVerbEndings.map((o) => o.a)),
    why: r.why,
  }));

  /* These two bring their own options. */
  const factCards = ruleFacts.map((r) => ({
    id: "rul:f:" + r.q, kind: "mc", mod: "rules",
    q: r.q, sub: r.sub, a: r.a, opts: shuffle(r.opts), why: r.why,
  }));

  const preteriteCards = rulePreterite.map((r) => ({
    id: "rul:pret:" + r.q, kind: "mc", mod: "rules",
    q: r.q, sub: r.sub, a: r.a, opts: shuffle(r.opts), why: r.why,
  }));

  const imperfectRuleCards = ruleImperfect.map((r) => ({
    id: "rul:impf:" + r.q, kind: "mc", mod: "rules",
    q: r.q, sub: r.sub, a: r.a, opts: shuffle(r.opts), why: r.why,
  }));

  const subjunctiveRuleCards = ruleSubjunctive.map((r) => ({
    id: "rul:sj:" + r.q, kind: "mc", mod: "rules",
    q: r.q, sub: r.sub, a: r.a, opts: shuffle(r.opts), why: r.why,
  }));

  const imperfectSubjunctiveRuleCards = ruleImperfectSubjunctive.map((r) => ({
    id: "rul:isj:" + r.q, kind: "mc", mod: "rules",
    q: r.q, sub: r.sub, a: r.a, opts: shuffle(r.opts), why: r.why,
  }));

  const subjunctiveFormCards = ruleSubjunctiveForms.map((r) => ({
    id: "rul:sf:" + r.v, kind: "type", mod: "rules",
    q: r.v, sub: "Type the yo present subjunctive",
    a: r.a, canon: r.a, audio: r.a, why: r.why,
  }));

  const accentCards = ruleAccents.map((r) => ({
    id: "rul:ac:" + r.q, kind: "mc", mod: "rules",
    q: r.q, sub: "Why the written accent?", a: r.a,
    opts: shuffle([r.a, ...sample(ruleAccents.filter((o) => o.a !== r.a).map((o) => o.a), 3)]),
    why: r.why,
  }));

  return [
    ...suffixCards, ...genderRuleCards, ...genderExceptionCards,
    ...verbFormCards, ...verbEndingCards, ...factCards, ...preteriteCards, ...imperfectRuleCards,
    ...subjunctiveRuleCards, ...subjunctiveFormCards, ...imperfectSubjunctiveRuleCards, ...accentCards,
  ];
}

/* ---------- the rest ---------- */

function suffixDeck() {
  return content.suffixes.map((r) => {
    const [english, spanish] = pick(r.ex);
    return {
      id: "sfx:" + r.en, kind: "type", mod: "suffix",
      q: english, sub: "Type the Spanish word",
      a: spanish, canon: spanish, audio: spanish,
      why: `${r.en} → ${r.es}. ${r.note}`,
    };
  });
}

function soundDeck() {
  const { vowels, consonants, xSounds, stressRules, dictation, sentenceDictation } = content;

  const vowelCards = vowels.map((v) => ({
    id: "vow:" + v.l, kind: "mc", mod: "sound",
    q: "The letter " + v.l, sub: "Which sound, always?", a: v.s,
    opts: shuffle([v.s, ...vowels.filter((o) => o.s !== v.s).map((o) => o.s).slice(0, 3)]),
    why: `${v.g}. As in ${v.w}.`,
  }));

  /* x has four values of its own, so it is drilled separately below. */
  const consonantCards = consonants.filter((c) => c.l !== "x").map((c) => ({
    id: "snd:" + c.l, kind: "mc", mod: "sound",
    q: c.l, sub: "How is it pronounced in Mexico?", a: c.r,
    opts: shuffle([c.r, ...sample(consonants.filter((o) => o.r !== c.r && o.l !== "x"), 3).map((o) => o.r)]),
    why: "As in " + c.w + ".",
  }));

  const xCards = xSounds.map((x) => ({
    id: "x:" + x.s, kind: "mc", mod: "sound",
    q: x.ex, sub: "The x here sounds like…", a: x.s,
    opts: shuffle(xSounds.map((o) => o.s)), audio: x.ex, why: x.n,
  }));

  const stressCards = stressRules.map((r) => ({
    id: "str:" + r.cond, kind: "mc", mod: "sound",
    q: r.cond, sub: "Where does the stress fall?", a: r.rule,
    opts: shuffle(stressRules.map((o) => o.rule)), why: r.ex,
  }));

  /* Spelling is the whole point here, so these are graded strictly. */
  const dictationCards = dictation.map((d) => ({
    id: "dic:" + d.w, kind: "type", mod: "sound", listen: true, strict: true,
    q: "", sub: "Listen, then spell what you hear",
    audio: d.w, a: d.w, canon: d.w, why: d.hint + ".",
  }));

  /* The same grading as the word dictation, on connected speech — which is
     where listening actually breaks down. */
  const sentenceCards = sentenceDictation.map((d) => ({
    id: "dics:" + d.s, kind: "type", mod: "sound", listen: true, strict: true,
    q: "", sub: "Listen, then write the whole sentence",
    audio: d.s, a: d.s, canon: d.s,
    why: `${d.t} — ${d.hint}.`,
  }));

  return [...vowelCards, ...consonantCards, ...xCards, ...stressCards, ...dictationCards, ...sentenceCards];
}

function verbsDeck() {
  const sentenceCards = content.verbSentences.map((entry) => {
    const sentence = pick(entry.sents);
    return {
      id: "vs:" + entry.v + ":" + entry.a, kind: "type", mod: "verbs",
      q: sentence.s.replace("___", BLANK), sub: `${entry.v} · ${entry.p}`,
      a: entry.a, canon: entry.a,
      audio: sentence.s.replace("___", entry.a),
      why: `${sentence.s.replace("___", entry.a)} — ${sentence.t}`,
    };
  });

  const yoFormCards = content.irregularVerbs.map((v) => ({
    id: "vrb:" + v.v, kind: "type", mod: "verbs",
    q: v.v, sub: `${v.m} · type the yo form`,
    a: v.yo, canon: v.yo, audio: v.yo,
    why: `${v.g}. Present: ${v.f}`,
  }));

  return [...sentenceCards, ...yoFormCards];
}

/* Same two shapes as the present-tense deck: forms inside sentences, plus
   the bare yo form for every strong preterite. */
function pastDeck() {
  const sentenceCards = content.preteriteSentences.map((entry) => {
    const sentence = pick(entry.sents);
    return {
      id: "pret:" + entry.v + ":" + entry.a, kind: "type", mod: "past",
      q: sentence.s.replace("___", BLANK), sub: `${entry.v} · ${entry.p} · preterite`,
      a: entry.a, canon: entry.a,
      audio: sentence.s.replace("___", entry.a),
      why: `${sentence.s.replace("___", entry.a)} — ${sentence.t}`,
    };
  });

  const stemCards = content.preteriteStems.map((v) => {
    const yo = v.f.split(",")[0].trim();
    return {
      id: "prets:" + v.v, kind: "type", mod: "past",
      q: v.v, sub: "Type the yo preterite",
      a: yo, canon: yo, audio: yo,
      why: `Stem ${v.stem} — ${v.f}. ${v.n}`,
    };
  });

  const imperfectCards = content.imperfectIrregular.map((v) => {
    const yo = v.f.split(",")[0].trim();
    return {
      id: "impf:" + v.v, kind: "type", mod: "past",
      q: v.v, sub: "Type the yo imperfect",
      a: yo, canon: yo, audio: yo,
      why: `${v.f}. ${v.n}`,
    };
  });

  /* The choice, not the form: both options are real forms of the same verb,
     so the card cannot be answered by spotting the impossible one. */
  const aspectCards = content.aspectContrasts.map((entry) => {
    const sentence = pick(entry.sents);
    const answer = entry.mood === "pret" ? sentence.pret : sentence.imp;
    return {
      id: "asp:" + entry.id, kind: "mc", mod: "past",
      q: sentence.s.replace("___", BLANK), sub: "Preterite or imperfect?",
      a: answer, opts: shuffle([sentence.pret, sentence.imp]),
      audio: sentence.s.replace("___", answer),
      why: `${entry.cue} — ${entry.mood === "pret" ? "a finished event, so the preterite" : "the state around an event, so the imperfect"}. ${sentence.t}`,
    };
  });

  return [...sentenceCards, ...stemCards, ...imperfectCards, ...aspectCards];
}

function periphrasisDeck() {
  const all = content.periphrasis;
  return all.map((p) => ({
    id: "per:" + p.p, kind: "mc", mod: "periphrasis",
    q: p.m, sub: "Which pattern says this?", a: p.p,
    opts: shuffle([p.p, ...distractors(p, all, (o) => o.p, (o) => o.p, 3)]),
    audio: p.ex, why: `${p.ex} — ${p.t} ${p.note}`,
  }));
}

function subjunctiveDeck() {
  const triggerCards = content.subjunctiveTriggers.map((t) => ({
    id: "trg:" + t.p, kind: "mc", mod: "subjunctive",
    q: t.p, sub: `${t.m} · what follows?`,
    a: t.s ? "Subjunctive" : "Indicative",
    opts: ["Subjunctive", "Indicative"],
    why: t.s
      ? "Forces the subjunctive — add it to the trigger list."
      : "Takes the indicative: it asserts something real or known.",
  }));

  /* The wrong answer is always the other real form, never something you
     could rule out on sight. */
  const sentenceCards = content.subjunctiveSentences.map((entry) => {
    const sentence = pick(entry.sents);
    const answer = entry.mood === "sub" ? sentence.sub : sentence.ind;
    return {
      id: "ss:" + entry.id, kind: "mc", mod: "subjunctive",
      q: sentence.s.replace("___", BLANK), sub: "Which form fits?",
      a: answer, opts: shuffle([sentence.ind, sentence.sub]),
      audio: sentence.s.replace("___", answer),
      why: `${entry.trig} ${entry.mood === "sub" ? "forces the subjunctive." : "takes the indicative."} ${sentence.t}`,
    };
  });

  /* Built from the ellos preterite rather than restated: drop -ron, add -ra.
     Doing it here means the strong stems can never drift out of step with
     content/preterite.js. */
  const fromPreterite = content.preteriteStems.map((v) => {
    const ellos = v.f.split(",")[4].trim();
    return { v: v.v, ellos, a: ellos.replace(/ron$/, "") + "ra" };
  });

  const formationCards = [...content.imperfectSubjunctiveRegular, ...fromPreterite].map((v) => ({
    id: "isf:" + v.v, kind: "type", mod: "subjunctive",
    q: v.v, sub: "Type the yo imperfect subjunctive",
    a: v.a, canon: v.a, audio: v.a,
    why: `${v.ellos} → drop -ron → ${v.a}. The ellos preterite is the whole recipe.`,
  }));

  /* The wrong answer is the conditional, because putting one after si is the
     mistake people actually make. */
  const siCards = content.siClauses.map((c) => ({
    id: "si:" + c.id, kind: "mc", mod: "subjunctive",
    q: c.s.replace("___", BLANK), sub: "Which form after si?",
    a: c.sub, opts: shuffle([c.sub, c.cond]),
    audio: c.s.replace("___", c.sub),
    why: `${c.s.replace("___", c.sub)} — ${c.t} Si takes the subjunctive; the conditional belongs in the other half.`,
  }));

  /* Same triggers as above, pulled into the past. The wrong answer is the
     present subjunctive. */
  const backshiftCards = content.backshift.map((b) => ({
    id: "bs:" + b.id, kind: "mc", mod: "subjunctive",
    q: b.s.replace("___", BLANK), sub: `${b.trig} · the main verb is in the past`,
    a: b.past, opts: shuffle([b.past, b.present]),
    audio: b.s.replace("___", b.past),
    why: `${b.s.replace("___", b.past)} — ${b.t} A past main verb pulls the subjunctive back with it.`,
  }));

  return [...triggerCards, ...sentenceCards, ...formationCards, ...siCards, ...backshiftCards];
}

function genderDeck() {
  return content.genderNouns.map(([noun, article]) => ({
    id: "gen:" + noun, kind: "mc", mod: "gender",
    q: noun, sub: "Which article?", a: article, opts: ["el", "la"],
    audio: `${article} ${noun}`,
    why: article === "la"
      ? "Feminine — check the ending against the rule table."
      : "Masculine, including the Greek -ma nouns that look feminine.",
  }));
}

function mexicanismosDeck() {
  /* Where Mexico and Spain agree there is nothing to drill. */
  return content.mexicanismos.filter((w) => w.mx !== w.sp).map((w) => ({
    id: "mex:" + w.mx, kind: "type", mod: "mexicanismos",
    q: w.en, sub: "Type the Mexican word",
    a: w.mx, canon: w.mx, audio: w.mx,
    why: `Spain says ${w.sp}. ${w.n}`,
  }));
}

function connectorsDeck() {
  const all = content.connectors;
  return all.map((c) => ({
    id: "con:" + c.p, kind: "mc", mod: "connectors",
    q: c.p, sub: "What does it mean?", a: c.m,
    opts: shuffle([c.m, ...distractors(c, all, (o) => o.p, (o) => o.m, 3)]),
    audio: c.p, why: c.u,
  }));
}

const BUILDERS = {
  rules: rulesDeck,
  suffix: suffixDeck,
  sound: soundDeck,
  verbs: verbsDeck,
  past: pastDeck,
  periphrasis: periphrasisDeck,
  subjunctive: subjunctiveDeck,
  gender: genderDeck,
  mexicanismos: mexicanismosDeck,
  connectors: connectorsDeck,
};

/* Rebuilt per round, so the randomised options and example sentences vary. */
export function cardsFor(mod) {
  if (mod === "mixed") return MODULES.flatMap(cardsFor);
  const build = BUILDERS[mod];
  return build ? build() : [];
}

/* Every id in the app, for the Review tab's counters. */
export const ALL_IDS = cardsFor("mixed").map((c) => c.id);
export const ALL_ID_SET = new Set(ALL_IDS);
