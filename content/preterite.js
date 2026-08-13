/* The preterite

   Mexico reaches for the simple past where Spain would use the present
   perfect — ya comí, not ya he comido — so this is the past tense that
   actually gets spoken, and its irregulars are a closed set.

   `stems` are the preterites worth knowing cold. Most of them are strong: one
   set of endings (-e, -iste, -o, -imos, -ieron) on a changed stem. The last
   three are not strong at all — ser/ir, dar and ver are each irregular in
   their own way, and their rows say how. What the whole table does share is
   that no form carries a written accent. Forms are listed in the order
   yo, tú, él/ella, nosotros, ellos — Mexico has no vosotros.

   `sentences` drive the production drill, same shape as verbs.js. */

window.MX = window.MX || {};

window.MX.preteriteStems = [
  {
    v: "tener", stem: "tuv-", f: "tuve, tuviste, tuvo, tuvimos, tuvieron",
    n: "The model for the whole group."
  },
  {
    v: "estar", stem: "estuv-", f: "estuve, estuviste, estuvo, estuvimos, estuvieron",
    n: "Same shape as tener, with the est- carried over."
  },
  {
    v: "andar", stem: "anduv-", f: "anduve, anduviste, anduvo, anduvimos, anduvieron",
    n: "Regular in the present, strong in the preterite — the one that catches people out."
  },
  {
    v: "poder", stem: "pud-", f: "pude, pudiste, pudo, pudimos, pudieron",
    n: "No pude means didn't manage to, not merely couldn't."
  },
  {
    v: "poner", stem: "pus-", f: "puse, pusiste, puso, pusimos, pusieron",
    n: "And every compound with it: propuse, supuse."
  },
  {
    v: "saber", stem: "sup-", f: "supe, supiste, supo, supimos, supieron",
    n: "In the preterite it means found out, not knew."
  },
  {
    v: "querer", stem: "quis-", f: "quise, quisiste, quiso, quisimos, quisieron",
    n: "Negated it means refused: no quiso venir."
  },
  {
    v: "venir", stem: "vin-", f: "vine, viniste, vino, vinimos, vinieron",
    n: "vino is also wine — context does the work."
  },
  {
    v: "hacer", stem: "hic-", f: "hice, hiciste, hizo, hicimos, hicieron",
    n: "The c becomes z before o, to keep the sound: hizo, never hico."
  },
  {
    v: "decir", stem: "dij-", f: "dije, dijiste, dijo, dijimos, dijeron",
    n: "A j-stem, so ellos drops the i: dijeron, not dijieron."
  },
  {
    v: "traer", stem: "traj-", f: "traje, trajiste, trajo, trajimos, trajeron",
    n: "Another j-stem: trajeron."
  },
  {
    v: "conducir", stem: "conduj-", f: "conduje, condujiste, condujo, condujimos, condujeron",
    n: "Every -ducir verb behaves this way. Mexico usually says manejar, which is regular."
  },
  {
    v: "ser / ir", stem: "fu-", f: "fui, fuiste, fue, fuimos, fueron",
    n: "One set of forms for two verbs. Fue un buen día, fue al mercado — only context separates them."
  },
  {
    v: "dar", stem: "d-", f: "di, diste, dio, dimos, dieron",
    n: "Takes -er endings despite being -ar, and drops the accents: di, dio."
  },
  {
    v: "ver", stem: "v-", f: "vi, viste, vio, vimos, vieron",
    n: "Regular but unaccented, for the same reason: vi, vio."
  },
];

window.MX.preteriteSentences = [
  {
    v: "tener", p: "yo", a: "tuve",
    sents: [
      { s: "___ que salir temprano.", t: "I had to leave early." },
      { s: "Ayer ___ un día pesado.", t: "Yesterday I had a rough day." },
    ],
  },
  {
    v: "estar", p: "nosotros", a: "estuvimos",
    sents: [
      { s: "___ en Oaxaca la semana pasada.", t: "We were in Oaxaca last week." },
      { s: "___ esperando dos horas.", t: "We were waiting two hours." },
    ],
  },
  {
    v: "poder", p: "yo", a: "pude",
    sents: [
      { s: "No ___ dormir anoche.", t: "I couldn't sleep last night." },
      { s: "Al final ___ entrar.", t: "In the end I managed to get in." },
    ],
  },
  {
    v: "poner", p: "él / ella", a: "puso",
    sents: [
      { s: "Mi mamá ___ la mesa.", t: "My mom set the table." },
      { s: "___ el dinero en la bolsa.", t: "He put the money in the bag." },
    ],
  },
  {
    v: "saber", p: "yo", a: "supe",
    sents: [
      { s: "Lo ___ ayer.", t: "I found out yesterday." },
      { s: "Nunca ___ su nombre.", t: "I never found out his name." },
    ],
  },
  {
    v: "querer", p: "ellos", a: "quisieron",
    sents: [
      { s: "No ___ venir.", t: "They refused to come." },
      { s: "___ pagar la cuenta.", t: "They wanted to pay the bill." },
    ],
  },
  {
    v: "venir", p: "tú", a: "viniste",
    sents: [
      { s: "¿A qué hora ___?", t: "What time did you get here?" },
      { s: "___ solo, ¿verdad?", t: "You came on your own, right?" },
    ],
  },
  {
    v: "hacer", p: "él / ella", a: "hizo",
    sents: [
      { s: "¿Quién ___ esto?", t: "Who did this?" },
      { s: "___ mucho calor ayer.", t: "It was very hot yesterday." },
    ],
  },
  {
    v: "decir", p: "ellos", a: "dijeron",
    sents: [
      { s: "Me ___ que sí.", t: "They told me yes." },
      { s: "No ___ nada.", t: "They didn't say anything." },
    ],
  },
  {
    v: "traer", p: "yo", a: "traje",
    sents: [
      { s: "___ el postre.", t: "I brought dessert." },
      { s: "No ___ paraguas.", t: "I didn't bring an umbrella." },
    ],
  },
  {
    v: "ser / ir", p: "él / ella", a: "fue",
    sents: [
      { s: "___ un buen día.", t: "It was a good day." },
      { s: "___ al mercado temprano.", t: "She went to the market early." },
    ],
  },
  {
    v: "dar", p: "yo", a: "di",
    sents: [
      { s: "Le ___ las gracias.", t: "I thanked him." },
      { s: "___ una vuelta por el centro.", t: "I took a walk around downtown." },
    ],
  },
  {
    v: "ver", p: "nosotros", a: "vimos",
    sents: [
      { s: "___ la película anoche.", t: "We saw the movie last night." },
      { s: "Nunca ___ el volcán.", t: "We never did see the volcano." },
    ],
  },
  {
    v: "andar", p: "ellos", a: "anduvieron",
    sents: [
      { s: "___ buscando casa todo el mes.", t: "They spent the month looking for a house." },
      { s: "___ por todo el centro.", t: "They walked all over downtown." },
    ],
  },
];

/* Rule-level cards for the Rules deck. */
window.MX.rulePreterite = [
  {
    q: "A strong preterite like tuve or dijo",
    sub: "Which endings does it take?",
    a: "-e, -iste, -o, -imos, -ieron",
    opts: [
      "-e, -iste, -o, -imos, -ieron",
      "-é, -aste, -ó, -amos, -aron",
      "-í, -iste, -ió, -imos, -ieron",
      "-o, -es, -e, -emos, -en",
    ],
    why: "One set for the whole group, and not one of them carries a written accent — unlike regular hablé and habló.",
  },
  {
    q: "dije · traje · conduje",
    sub: "What happens in the ellos form?",
    a: "The i drops: dijeron",
    opts: ["The i drops: dijeron", "It is regular: dijieron", "The j becomes g: digeron", "It takes an accent: dijierón"],
    why: "Stems ending in j swallow the i. dijeron, trajeron, condujeron.",
  },
  {
    q: "fui · fuiste · fue · fuimos · fueron",
    sub: "Which verb is this?",
    a: "Both ser and ir",
    opts: ["Both ser and ir", "Only ser", "Only ir", "Only estar"],
    why: "The two share one preterite. Fue un buen día is ser; fue al mercado is ir.",
  },
  {
    q: "hacer in the él form",
    sub: "Why hizo rather than hico?",
    a: "c becomes z before o, to keep the sound",
    opts: [
      "c becomes z before o, to keep the sound",
      "It is simply irregular, with no reason",
      "The stem is hiz- throughout",
      "To avoid matching hice",
    ],
    why: "Spanish spells the s sound with z before o and a. The stem is still hic-.",
  },
];
