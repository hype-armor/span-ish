/* The Rules deck

   Rule-level recall: the rules themselves rather than their application.
   The suffix and gender cards are generated from suffixes.js and
   gender.js, so they are not repeated here — this file holds only what
   the other decks do not already state. */

window.MX = window.MX || {};

window.MX.ruleGenderExceptions = [
  {
    q: "mano · foto · moto",
    a: "la",
    why: "Feminine despite the -o. Foto and moto are clipped from fotografía and motocicleta, and the gender came with them."
  },
  {
    q: "día · mapa · sofá",
    a: "el",
    why: "Masculine despite the -a — a short list worth learning as a group."
  },
  {
    q: "problema · sistema · tema · idioma",
    a: "el",
    why: "Greek -ma nouns. They look feminine and never are."
  },
  {
    q: "agua · alma · área",
    a: "el",
    why: "Feminine nouns that borrow el to avoid the a-a clash. The adjective still agrees as feminine: el agua fría."
  }
];

window.MX.ruleVerbForms = [
  {
    q: "Regular -ar verb, present",
    k: "present:ar",
    a: "-o, -as, -a, -amos, -an",
    why: "hablo, hablas, habla, hablamos, hablan."
  },
  {
    q: "Regular -er verb, present",
    k: "present:er",
    a: "-o, -es, -e, -emos, -en",
    why: "como, comes, come, comemos, comen."
  },
  {
    q: "Regular -ir verb, present",
    k: "present:ir",
    a: "-o, -es, -e, -imos, -en",
    why: "vivo, vives, vive, vivimos, viven. Only nosotros tells -er and -ir apart."
  },
  {
    q: "Regular -ar verb, preterite",
    k: "preterite:ar",
    a: "-é, -aste, -ó, -amos, -aron",
    why: "hablé, hablaste, habló, hablamos, hablaron. Nosotros is spelled exactly like the present — context does the work."
  },
  {
    q: "Regular -er / -ir verb, preterite",
    k: "preterite:er-ir",
    a: "-í, -iste, -ió, -imos, -ieron",
    why: "comí, comiste, comió, comimos, comieron. One set covers both endings."
  }
];

window.MX.ruleVerbEndings = [
  { q: "Gerund of an -ar verb", a: "-ando", why: "hablando. Estoy hablando." },
  { q: "Gerund of an -er or -ir verb", a: "-iendo", why: "comiendo, viviendo." },
  { q: "Past participle of an -ar verb", a: "-ado", why: "hablado. He hablado con ella." },
  { q: "Past participle of an -er or -ir verb", a: "-ido", why: "comido, vivido." }
];

window.MX.ruleFacts = [
  {
    q: "A boot verb like poder or querer",
    sub: "Which form skips the stem change?",
    a: "nosotros",
    opts: ["nosotros", "yo", "tú", "ellos"],
    why: "puedo, puedes, puede, podemos, pueden. The stress moves off the stem in nosotros, so the vowel stays put — that hole is the boot."
  },
  {
    q: "tengo · hago · pongo · salgo · vengo",
    sub: "What do these share?",
    a: "A yo form ending in -go",
    opts: [
      "A yo form ending in -go",
      "A stem change in every form",
      "An irregularity in the preterite only",
      "Nothing — they are regular"
    ],
    why: "The yo-go group, and the -go is the whole of what they share. For hago, pongo and salgo it is the only irregularity. Tengo and vengo carry a stem change on top of it — tienes, vienes — so those two are yo-go and boot verb at once. Either way, the subjunctive is built off that yo form."
  },
  {
    q: "nación → naciones",
    sub: "What happens to the written accent?",
    a: "It disappears",
    opts: ["It disappears", "It stays on the same vowel", "It moves one syllable left", "It doubles"],
    why: "The extra syllable makes the stress regular again, so the accent has no work left to do."
  }
];

window.MX.ruleSubjunctive = [
  {
    q: "Present subjunctive, the regular recipe",
    sub: "How is it built?",
    a: "Take the yo form, drop the -o, flip the vowel",
    opts: [
      "Take the yo form, drop the -o, flip the vowel",
      "Take the infinitive and add -ase / -iese",
      "Take the nosotros form and drop -mos",
      "Take the infinitive and add the future endings"
    ],
    why: "tengo → teng- → tenga. Any irregularity in the yo form is carried along for free."
  },
  {
    q: "-ar verbs in the present subjunctive",
    k: "subjunctive:ar",
    sub: "Which vowel do the endings use?",
    a: "e",
    opts: ["a", "e", "i", "o"],
    why: "hable, hables, hable, hablemos, hablen. The -ar vowel flips to e."
  },
  {
    q: "-er and -ir verbs in the present subjunctive",
    k: "subjunctive:er-ir",
    sub: "Which vowel do the endings use?",
    a: "a",
    opts: ["a", "e", "i", "o"],
    why: "coma, comas, coma, comamos, coman — and viva, vivas, viva. Both flip to a."
  }
];

window.MX.ruleSubjunctiveForms = [
  { v: "tener", a: "tenga", irr: false, why: "yo tengo → tenga. The yo-go g comes along." },
  { v: "hacer", a: "haga", irr: false, why: "yo hago → haga." },
  { v: "conocer", a: "conozca", irr: false, why: "yo conozco → conozca. The -zco survives intact." },
  { v: "ser", a: "sea", irr: true, why: "No -o yo form to build on. Memorize it." },
  { v: "ir", a: "vaya", irr: true, why: "Irregular. Ojalá que vaya todo bien." },
  {
    v: "estar",
    a: "esté",
    irr: true,
    why: "Irregular. Every form carries the accent except nosotros: esté, estés, esté, estemos, estén."
  },
  {
    v: "dar",
    a: "dé",
    irr: true,
    why: "Irregular. The accent is there only to keep it apart from the preposition de."
  },
  { v: "saber", a: "sepa", irr: true, why: "Irregular. No creo que sepa." },
  { v: "haber", a: "haya", irr: true, why: "Irregular. Espero que haya tiempo." }
];

window.MX.ruleAccents = [
  {
    q: "café · nación · inglés",
    a: "Ends in a vowel, n or s, but the stress falls on the last syllable",
    why: "The default would put the stress one syllable earlier, so the accent overrides it."
  },
  {
    q: "árbol · fácil · lápiz",
    a: "Ends in another consonant, but the stress falls on the second-to-last",
    why: "The default would stress the last syllable. The accent pulls it back."
  },
  {
    q: "México · médico · rápido",
    a: "Stressed on the third-to-last syllable, which is always written",
    why: "No rule ever produces that stress on its own, so it always carries an accent."
  },
  {
    q: "tú / tu · él / el · sí / si · sé / se",
    a: "Telling apart two words spelled the same",
    why: "Nothing to do with stress — both are said the same way. Tú eres, tu casa."
  },
  {
    q: "¿qué? · ¿cómo? · ¿dónde? · ¿cuándo?",
    a: "Marking a question word",
    why: "The accent marks the asking, and an indirect question is still asking: ¿dónde vives? and sé dónde vives both keep it. It goes only when the word stops asking and merely joins: donde vives está lejos."
  }
];
