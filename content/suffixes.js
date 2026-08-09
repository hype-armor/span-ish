/* The suffix map

   English endings and their Spanish counterparts. Drives the Transformer
   tab's live converter, its reference table, and the suffix drills.
   `re` and `tail` are what the converter matches and appends. */

window.MX = window.MX || {};

window.MX.suffixes = [
  {
    en: "-tion",
    es: "-ción",
    re: /tion$/i,
    tail: "ción",
    ex: [["nation", "nación"], ["information", "información"], ["situation", "situación"]],
    note: "Always feminine. The plural drops the accent: naciones."
  },
  {
    en: "-sion",
    es: "-sión",
    re: /sion$/i,
    tail: "sión",
    ex: [["decision", "decisión"], ["television", "televisión"], ["tension", "tensión"]],
    note: "Feminine, same as -ción."
  },
  {
    en: "-ty",
    es: "-dad",
    re: /ty$/i,
    tail: "dad",
    ex: [["university", "universidad"], ["reality", "realidad"], ["community", "comunidad"]],
    note: "Feminine. Sometimes -tad instead: libertad, dificultad."
  },
  {
    en: "-ly",
    es: "-mente",
    re: /ly$/i,
    tail: "mente",
    ex: [["rapidly", "rápidamente"], ["normally", "normalmente"], ["exactly", "exactamente"]],
    note: "Two steps: take the Spanish adjective, put it in the feminine, add -mente. rápido → rápida → rápidamente."
  },
  {
    en: "-ous",
    es: "-oso",
    re: /ous$/i,
    tail: "oso",
    ex: [["famous", "famoso"], ["delicious", "delicioso"], ["generous", "generoso"]],
    note: "An adjective, so it agrees: famosa, famosos, famosas."
  },
  {
    en: "-ist",
    es: "-ista",
    re: /ist$/i,
    tail: "ista",
    ex: [["artist", "artista"], ["tourist", "turista"], ["dentist", "dentista"]],
    note: "Ends in -a but takes either gender: el artista, la artista."
  },
  {
    en: "-ment",
    es: "-mento",
    re: /ment$/i,
    tail: "mento",
    ex: [["moment", "momento"], ["document", "documento"], ["monument", "monumento"]],
    note: "Masculine."
  },
  {
    en: "-ic",
    es: "-ico",
    re: /ic$/i,
    tail: "ico",
    ex: [["public", "público"], ["magic", "mágico"], ["classic", "clásico"]],
    note: "Nearly always stressed on the third-from-last syllable, which means a written accent."
  },
  {
    en: "-ance / -ence",
    es: "-ancia / -encia",
    re: /(ance|ence)$/i,
    tail: "ancia",
    ex: [["importance", "importancia"], ["difference", "diferencia"], ["experience", "experiencia"]],
    note: "-ance → -ancia, -ence → -encia. Feminine."
  },
  {
    en: "-ary",
    es: "-ario",
    re: /ary$/i,
    tail: "ario",
    ex: [["necessary", "necesario"], ["ordinary", "ordinario"], ["salary", "salario"]],
    note: "Masculine as a noun; agrees as an adjective."
  },
  {
    en: "-ize",
    es: "-izar",
    re: /(ize|ise)$/i,
    tail: "izar",
    ex: [["organize", "organizar"], ["analyze", "analizar"], ["memorize", "memorizar"]],
    note: "A regular -ar verb, so it conjugates with no surprises."
  },
  {
    en: "-able / -ible",
    es: "-able / -ible",
    re: /(able|ible)$/i,
    tail: "able",
    ex: [["probable", "probable"], ["terrible", "terrible"], ["possible", "posible"]],
    note: "Unchanged, except that Spanish doesn't double s, m, f, p or t: posible, not possible."
  },
  {
    en: "-ct",
    es: "-cto",
    re: /ct$/i,
    tail: "cto",
    ex: [["perfect", "perfecto"], ["correct", "correcto"], ["exact", "exacto"]],
    note: "Add a vowel — Spanish words don't end in -ct."
  },
  {
    en: "-al",
    es: "-al",
    re: /al$/i,
    tail: "al",
    ex: [["natural", "natural"], ["general", "general"], ["total", "total"]],
    note: "Free words. Identical spelling; the Spanish stress falls on the last syllable."
  },
  {
    en: "-or",
    es: "-or",
    re: /or$/i,
    tail: "or",
    ex: [["doctor", "doctor"], ["color", "color"], ["actor", "actor"]],
    note: "Identical, and masculine. People-words add -a for the feminine: doctora."
  }
];

/* Words offered as one-tap examples under the Transformer's live converter.
   Each must end in one of the suffixes above, or it will show "no rule matches". */
window.MX.converterExamples = [
  "situation",
  "university",
  "delicious",
  "artist",
  "document",
  "public",
  "importance",
  "organize",
  "perfect",
  "necessary"
];
