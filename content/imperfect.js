/* The imperfect, and choosing between it and the preterite

   Forming the imperfect is the easiest thing in Spanish: two sets of endings
   and exactly three irregular verbs. Choosing between it and the preterite is
   the hard part, and it is not about how long ago something happened — it is
   about whether you are reporting a finished event or describing the state of
   the world around one.

   `contrasts` drive the choice drill. Each sentence carries both real forms
   and `mood` says which one fits, so the wrong answer is always the other
   genuine form. Forms are listed yo, tú, él/ella, nosotros, ellos. */

window.MX = window.MX || {};

window.MX.imperfectEndings = [
  {
    kind: "-ar verbs", e: "-aba, -abas, -aba, -ábamos, -aban",
    ex: "hablaba, hablabas, hablaba, hablábamos, hablaban",
    n: "The nosotros form is the only one with a written accent.",
  },
  {
    kind: "-er and -ir verbs", e: "-ía, -ías, -ía, -íamos, -ían",
    ex: "comía, comías, comía, comíamos, comían",
    n: "One set for both, and every form carries its accent.",
  },
];

/* The entire list of irregulars. There is no fourth. */
window.MX.imperfectIrregular = [
  { v: "ser", f: "era, eras, era, éramos, eran", n: "Era mi maestro. The most used verb in the tense." },
  { v: "ir", f: "iba, ibas, iba, íbamos, iban", n: "Iba al mercado cada sábado." },
  { v: "ver", f: "veía, veías, veía, veíamos, veían", n: "Barely irregular — it just keeps the e of ver." },
];

/* Words that decide the choice before you have thought about it. */
window.MX.aspectCues = [
  { cue: "ayer · anoche · la semana pasada", side: "pret", n: "A finished window of time. The event is over and bounded." },
  { cue: "de repente · en ese momento", side: "pret", n: "Marks the interruption, which is always the preterite." },
  { cue: "dos veces · una vez · tres días", side: "pret", n: "A counted number of times means a countable, finished event." },
  { cue: "siempre · todos los días · cada verano", side: "imp", n: "A habit has no single end, so it never takes the preterite." },
  { cue: "mientras", side: "imp", n: "Sets the scene something else happens inside." },
  { cue: "cuando era niño · de joven", side: "imp", n: "Describes a stretch of life rather than an event in it." },
  { cue: "generalmente · normalmente", side: "imp", n: "Explicitly says this was the usual state of affairs." },
];

window.MX.aspectContrasts = [
  {
    id: "ayer", cue: "ayer", mood: "pret",
    sents: [{ s: "Ayer ___ a mi abuela.", pret: "visité", imp: "visitaba", t: "Yesterday I visited my grandmother." }],
  },
  {
    id: "siempre-bici", cue: "siempre", mood: "imp",
    sents: [{ s: "De niño siempre ___ en bicicleta a la escuela.", pret: "fui", imp: "iba", t: "As a kid I always rode my bike to school." }],
  },
  {
    id: "derepente", cue: "de repente", mood: "pret",
    sents: [{ s: "Caminaba por el centro cuando de repente ___ un ruido.", pret: "escuché", imp: "escuchaba", t: "I was walking downtown when suddenly I heard a noise." }],
  },
  {
    id: "mientras", cue: "mientras", mood: "imp",
    sents: [{ s: "Mientras ___ la cena, sonó el teléfono.", pret: "preparé", imp: "preparaba", t: "While I was making dinner, the phone rang." }],
  },
  {
    id: "cuando-nino", cue: "cuando era niño", mood: "imp",
    sents: [{ s: "Cuando era niño ___ mucho miedo a los perros.", pret: "tuve", imp: "tenía", t: "As a child I was very afraid of dogs." }],
  },
  {
    id: "dos-veces", cue: "dos veces", mood: "pret",
    sents: [{ s: "___ a Oaxaca dos veces el año pasado.", pret: "fui", imp: "iba", t: "I went to Oaxaca twice last year." }],
  },
  {
    id: "todos-los-dias", cue: "todos los días", mood: "imp",
    sents: [{ s: "Mi abuelo ___ el periódico todos los días.", pret: "leyó", imp: "leía", t: "My grandfather read the newspaper every day." }],
  },
  {
    id: "anoche", cue: "anoche", mood: "pret",
    sents: [{ s: "Anoche ___ tarde a la casa.", pret: "llegué", imp: "llegaba", t: "Last night I got home late." }],
  },
  {
    id: "la-hora", cue: "telling the time", mood: "imp",
    sents: [{ s: "___ las tres de la tarde cuando salimos.", pret: "fueron", imp: "eran", t: "It was three in the afternoon when we left." }],
  },
  {
    id: "interrupcion", cue: "the interruption", mood: "pret",
    sents: [{ s: "Alguien ___ la puerta mientras yo cocinaba.", pret: "tocó", imp: "tocaba", t: "Someone knocked at the door while I was cooking." }],
  },
  {
    id: "la-edad", cue: "age in the past", mood: "imp",
    sents: [{ s: "___ veinte años cuando se casó.", pret: "tuvo", imp: "tenía", t: "She was twenty when she got married." }],
  },
  {
    id: "una-vez", cue: "una vez", mood: "pret",
    sents: [{ s: "Una vez ___ al volcán.", pret: "subimos", imp: "subíamos", t: "Once we climbed the volcano." }],
  },
  {
    id: "empezo", cue: "a clear starting point", mood: "pret",
    sents: [{ s: "La película ___ a las ocho.", pret: "empezó", imp: "empezaba", t: "The movie started at eight." }],
  },
  {
    id: "generalmente", cue: "generalmente", mood: "imp",
    sents: [{ s: "Generalmente ___ en el mercado.", pret: "compramos", imp: "comprábamos", t: "We generally shopped at the market." }],
  },
];

/* Rule-level cards for the Rules deck. */
window.MX.ruleImperfect = [
  {
    q: "-ar verbs in the imperfect",
    sub: "Which endings?",
    a: "-aba, -abas, -aba, -ábamos, -aban",
    opts: [
      "-aba, -abas, -aba, -ábamos, -aban",
      "-ía, -ías, -ía, -íamos, -ían",
      "-é, -aste, -ó, -amos, -aron",
      "-o, -as, -a, -amos, -an",
    ],
    why: "hablaba, hablabas, hablaba, hablábamos, hablaban. Only nosotros takes an accent.",
  },
  {
    q: "-er and -ir verbs in the imperfect",
    sub: "Which endings?",
    a: "-ía, -ías, -ía, -íamos, -ían",
    opts: [
      "-ía, -ías, -ía, -íamos, -ían",
      "-aba, -abas, -aba, -ábamos, -aban",
      "-í, -iste, -ió, -imos, -ieron",
      "-o, -es, -e, -emos, -en",
    ],
    why: "comía and vivía take the same set, and every form keeps its accent.",
  },
  {
    q: "Irregular verbs in the imperfect",
    sub: "How many are there?",
    a: "Three: ser, ir, ver",
    opts: ["Three: ser, ir, ver", "The same fifteen as the preterite", "None at all", "Around thirty"],
    why: "era, iba, veía. Every other verb in the language is regular here.",
  },
  {
    q: "A habit: every day, always, as a child",
    sub: "Preterite or imperfect?",
    a: "Imperfect",
    opts: ["Imperfect", "Preterite"],
    why: "A habit has no single end to report, so there is nothing for the preterite to bound.",
  },
  {
    q: "One finished event: yesterday, twice, at eight",
    sub: "Preterite or imperfect?",
    a: "Preterite",
    opts: ["Preterite", "Imperfect"],
    why: "Bounded and over. Counting the times something happened is the giveaway.",
  },
  {
    q: "Eran las tres cuando salimos",
    sub: "Why is the first verb imperfect?",
    a: "Time and age in the past are always imperfect",
    opts: [
      "Time and age in the past are always imperfect",
      "Because ser is irregular in the preterite",
      "Because the sentence has two verbs",
      "Because it happened long ago",
    ],
    why: "The clock is the backdrop, not the event. Salimos is what actually happened.",
  },
  {
    q: "Yo cocinaba cuando alguien tocó la puerta",
    sub: "Which verb is the interruption?",
    a: "tocó — the preterite one",
    opts: ["tocó — the preterite one", "cocinaba — the imperfect one", "Both equally", "Neither"],
    why: "The imperfect sets the scene and the preterite breaks into it. That pairing is the most common shape in the language.",
  },
];
