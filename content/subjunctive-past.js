/* The imperfect subjunctive

   The present subjunctive is built from the yo present. This one is built
   from the ellos preterite: drop -ron, add -ra. That means every preterite
   irregularity you already know carries straight over, and the fifteen rows in
   preterite.js are fifteen imperfect subjunctives — so the drill derives those
   forms from that file rather than repeating them here.

   It shows up in five places: si clauses that are contrary to fact, any
   trigger from subjunctive.js once the main verb is in the past, ojalá when
   you are wishing rather than hoping, como si, and quisiera as a softer quiero.

   Forms are listed yo, tú, él/ella, nosotros, ellos. */

window.MX = window.MX || {};

window.MX.imperfectSubjunctiveEndings = [
  {
    set: "-ra",
    ex: "hablara, hablaras, hablara, habláramos, hablaran",
    n: "What Mexico uses, effectively always. Only nosotros takes a written accent.",
  },
  {
    set: "-se",
    ex: "hablase, hablases, hablase, hablásemos, hablasen",
    n: "Identical in meaning. Peninsular and literary — worth recognising, never worth producing here.",
  },
];

/* The regular models. The irregulars come from preterite.js, since the
   derivation is the same for every verb in the language. */
window.MX.imperfectSubjunctiveRegular = [
  { v: "hablar", ellos: "hablaron", a: "hablara" },
  { v: "comer", ellos: "comieron", a: "comiera" },
  { v: "vivir", ellos: "vivieron", a: "viviera" },
];

window.MX.imperfectSubjunctiveUses = [
  {
    use: "si + contrary to fact",
    ex: "Si tuviera tiempo, iría contigo.",
    t: "If I had time, I'd go with you.",
    n: "The other half is the conditional. Si itself never takes one — si tendría is the error to bury.",
  },
  {
    use: "a trigger, with the main verb in the past",
    ex: "Quería que vinieras.",
    t: "I wanted you to come.",
    n: "Every phrase from the trigger table above. A past main verb drags the subjunctive back with it.",
  },
  {
    use: "ojalá, about now",
    ex: "Ojalá que tuviera más tiempo.",
    t: "I wish I had more time.",
    n: "Ojalá + present subjunctive hopes; + imperfect wishes for something you don't expect.",
  },
  {
    use: "como si",
    ex: "Habla como si fuera experto.",
    t: "He talks as if he were an expert.",
    n: "Como si takes nothing else, ever, whatever tense the main verb is in.",
  },
  {
    use: "quisiera, for politeness",
    ex: "Quisiera un café, por favor.",
    t: "I'd like a coffee, please.",
    n: "The imperfect subjunctive used purely to soften. Constant in Mexico, and worth having ready.",
  },
];

/* si clauses. The wrong answer is the conditional, because putting it after
   si is the mistake people actually make. */
window.MX.siClauses = [
  { id: "dinero", s: "Si ___ dinero, viajaría más.", sub: "tuviera", cond: "tendría", t: "If I had money, I'd travel more." },
  { id: "temprano", s: "Si ___ más temprano, alcanzaríamos el camión.", sub: "saliéramos", cond: "saldríamos", t: "If we left earlier, we'd catch the bus." },
  { id: "mexico", s: "Si ___ en México, hablaría mejor español.", sub: "viviera", cond: "viviría", t: "If I lived in Mexico, I'd speak better Spanish." },
  { id: "verdad", s: "Si ___ la verdad, te la diría.", sub: "supiera", cond: "sabría", t: "If I knew the truth, I'd tell you." },
  { id: "ir", s: "Si ___ ir, iría contigo.", sub: "pudiera", cond: "podría", t: "If I could go, I'd go with you." },
  { id: "trafico", s: "Si no ___ tanto tráfico, llegaríamos a tiempo.", sub: "hubiera", cond: "habría", t: "If there weren't so much traffic, we'd get there on time." },
  { id: "fuera-tu", s: "Si yo ___ tú, no diría nada.", sub: "fuera", cond: "sería", t: "If I were you, I wouldn't say anything." },
  { id: "terminar", s: "Si ___ el trabajo hoy, mañana descansaríamos.", sub: "termináramos", cond: "terminaríamos", t: "If we finished the work today, we'd rest tomorrow." },
];

/* The same triggers as the present-tense table, pulled back into the past.
   The wrong answer is the present subjunctive, which is the real error. */
window.MX.backshift = [
  { id: "queria-llegar", trig: "quería que", s: "Quería que ___ temprano.", past: "llegaras", present: "llegues", t: "I wanted you to arrive early." },
  { id: "esperaba-venir", trig: "esperaba que", s: "Esperaba que ___ a la fiesta.", past: "viniera", present: "venga", t: "I was hoping he'd come to the party." },
  { id: "era-importante", trig: "era importante que", s: "Era importante que lo ___.", past: "hicieras", present: "hagas", t: "It was important that you do it." },
  { id: "dudaba", trig: "dudaba que", s: "Dudaba que ___ verdad.", past: "fuera", present: "sea", t: "I doubted it was true." },
  { id: "para-que", trig: "para que", s: "Te lo dije para que lo ___.", past: "supieras", present: "sepas", t: "I told you so that you'd know." },
  { id: "no-creia", trig: "no creía que", s: "No creía que ___ hacerlo.", past: "pudiera", present: "pueda", t: "I didn't think he could do it." },
  { id: "me-alegro", trig: "me alegró que", s: "Me alegró que ___ ahí.", past: "estuvieras", present: "estés", t: "I was glad you were there." },
  { id: "antes-de-que", trig: "antes de que", s: "Se fue antes de que ___.", past: "salieras", present: "salgas", t: "He left before you went out." },
];

/* Rule-level cards for the Rules deck. */
window.MX.ruleImperfectSubjunctive = [
  {
    q: "The imperfect subjunctive",
    sub: "What is it built from?",
    a: "The ellos preterite, minus -ron",
    opts: [
      "The ellos preterite, minus -ron",
      "The yo present, minus -o",
      "The infinitive, plus the imperfect endings",
      "The nosotros imperfect, minus -mos",
    ],
    why: "tuvieron → tuvie- → tuviera. Every preterite irregularity carries straight over, so there is no second list to learn.",
  },
  {
    q: "Si tuviera dinero, ___ más",
    sub: "What goes in the other half?",
    a: "The conditional: viajaría",
    opts: ["The conditional: viajaría", "Another subjunctive: viajara", "The present: viajo", "The future: viajaré"],
    why: "Si takes the subjunctive and the result takes the conditional. Si tendría is the error worth burying.",
  },
  {
    q: "-ra or -se?",
    sub: "Which does Mexico use?",
    a: "-ra, effectively always",
    opts: ["-ra, effectively always", "-se, effectively always", "They mean different things", "-se only after si"],
    why: "hablara and hablase are identical in meaning. -se is Peninsular and literary — recognise it, don't produce it.",
  },
  {
    q: "como si",
    sub: "What follows it?",
    a: "Always the imperfect subjunctive",
    opts: ["Always the imperfect subjunctive", "Always the indicative", "The present subjunctive", "Whatever the main verb is"],
    why: "Habla como si fuera experto. There is no other option after como si, whatever tense the sentence is in.",
  },
  {
    q: "Quisiera un café",
    sub: "Why the subjunctive?",
    a: "It is a softer way of saying quiero",
    opts: [
      "It is a softer way of saying quiero",
      "It reports something that did not happen",
      "Café forces the subjunctive",
      "It is the only past form of querer",
    ],
    why: "Politeness, nothing more. Quisiera is to quiero what I'd like is to I want, and Mexico uses it constantly.",
  },
  {
    q: "Ojalá que venga · Ojalá que viniera",
    sub: "What is the difference?",
    a: "The first hopes, the second wishes",
    opts: [
      "The first hopes, the second wishes",
      "The second is simply the past of the first",
      "Nothing — they are interchangeable",
      "The second is wrong",
    ],
    why: "Ojalá que venga expects it might happen. Ojalá que viniera wishes for something you do not expect.",
  },
  {
    q: "habláramos · tuviéramos · fuéramos",
    sub: "Why do these carry an accent?",
    a: "The stress falls on the third-to-last syllable",
    opts: [
      "The stress falls on the third-to-last syllable",
      "Every imperfect subjunctive form takes one",
      "To separate them from the preterite",
      "Because nosotros forms always take one",
    ],
    why: "Same rule as México and médico: third-to-last stress is always written. Only the nosotros form lands there.",
  },
];
