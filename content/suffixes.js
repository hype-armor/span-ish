/* The suffix map

   English endings and their Spanish counterparts. Drives the Transformer
   tab's live converter, its reference table, and the suffix drills.
   `re` and `tail` are what the converter matches and appends.

   `ex` are the taught examples — they appear in the reference table and are
   drilled as ordinary cards. `probe` is held back: those words are never shown
   as cards and never scheduled, so they can be used to ask whether the rule
   itself transfers to a word you have not met. See src/lib/probe.js.

   A probe pair must be answerable from the ending swap alone. Words needing
   Spanish orthography on top of the rule — illusion → ilusión drops an l,
   security → seguridad changes the stem — belong in `ex` where they can be
   taught, not in `probe` where they would fail a learner who knew the rule
   perfectly well. tools/test-lib.js enforces this by requiring every probe
   pair to agree with what the converter derives. */

window.MX = window.MX || {};

window.MX.suffixes = [
  {
    en: "-tion",
    es: "-ción",
    re: /tion$/i,
    tail: "ción",
    ex: [["nation", "nación"], ["information", "información"], ["situation", "situación"]],
    probe: [
      ["action", "acción"], ["condition", "condición"], ["education", "educación"],
      ["reaction", "reacción"], ["section", "sección"], ["tradition", "tradición"],
      ["operation", "operación"], ["celebration", "celebración"],
    ],
    note: "Always feminine. The plural drops the accent: naciones."
  },
  {
    en: "-sion",
    es: "-sión",
    re: /sion$/i,
    tail: "sión",
    ex: [["decision", "decisión"], ["television", "televisión"], ["tension", "tensión"]],
    probe: [
      ["confusion", "confusión"], ["division", "división"], ["explosion", "explosión"],
      ["mansion", "mansión"], ["version", "versión"], ["revision", "revisión"],
      ["precision", "precisión"], ["conclusion", "conclusión"],
    ],
    note: "Feminine, same as -ción."
  },
  {
    en: "-ty",
    es: "-dad",
    re: /ty$/i,
    tail: "dad",
    ex: [["university", "universidad"], ["reality", "realidad"], ["community", "comunidad"]],
    probe: [
      ["activity", "actividad"], ["curiosity", "curiosidad"], ["dignity", "dignidad"],
      ["identity", "identidad"], ["intensity", "intensidad"], ["quality", "calidad"],
      ["society", "sociedad"], ["velocity", "velocidad"],
    ],
    note: "Feminine. Sometimes -tad instead: libertad, dificultad."
  },
  {
    en: "-ly",
    es: "-mente",
    re: /ly$/i,
    tail: "mente",
    ex: [["rapidly", "rápidamente"], ["normally", "normalmente"], ["exactly", "exactamente"]],
    probe: [
      ["absolutely", "absolutamente"], ["constantly", "constantemente"],
      ["correctly", "correctamente"], ["directly", "directamente"],
      ["perfectly", "perfectamente"], ["totally", "totalmente"],
      ["naturally", "naturalmente"], ["generally", "generalmente"],
    ],
    note: "Two steps: take the Spanish adjective, put it in the feminine, add -mente. rápido → rápida → rápidamente."
  },
  {
    en: "-ous",
    es: "-oso",
    re: /ous$/i,
    tail: "oso",
    ex: [["famous", "famoso"], ["delicious", "delicioso"], ["generous", "generoso"]],
    probe: [
      ["curious", "curioso"], ["numerous", "numeroso"], ["precious", "precioso"],
      ["religious", "religioso"], ["furious", "furioso"], ["glorious", "glorioso"],
      ["victorious", "victorioso"], ["vigorous", "vigoroso"],
    ],
    note: "An adjective, so it agrees: famosa, famosos, famosas."
  },
  {
    en: "-ist",
    es: "-ista",
    re: /ist$/i,
    tail: "ista",
    ex: [["artist", "artista"], ["tourist", "turista"], ["dentist", "dentista"]],
    probe: [
      ["pianist", "pianista"], ["novelist", "novelista"], ["realist", "realista"],
      ["idealist", "idealista"], ["optimist", "optimista"], ["pessimist", "pesimista"],
      ["florist", "florista"], ["violinist", "violinista"],
    ],
    note: "Ends in -a but takes either gender: el artista, la artista."
  },
  {
    en: "-ment",
    es: "-mento",
    re: /ment$/i,
    tail: "mento",
    ex: [["moment", "momento"], ["document", "documento"], ["monument", "monumento"]],
    probe: [
      ["argument", "argumento"], ["element", "elemento"], ["fragment", "fragmento"],
      ["instrument", "instrumento"], ["ornament", "ornamento"], ["segment", "segmento"],
      ["temperament", "temperamento"], ["experiment", "experimento"],
    ],
    note: "Masculine."
  },
  {
    en: "-ic",
    es: "-ico",
    re: /ic$/i,
    tail: "ico",
    ex: [["public", "público"], ["magic", "mágico"], ["classic", "clásico"]],
    probe: [
      ["automatic", "automático"], ["dramatic", "dramático"], ["economic", "económico"],
      ["fantastic", "fantástico"], ["historic", "histórico"], ["romantic", "romántico"],
      ["tragic", "trágico"], ["electric", "eléctrico"],
    ],
    note: "Nearly always stressed on the third-from-last syllable, which means a written accent."
  },
  {
    en: "-ance / -ence",
    es: "-ancia / -encia",
    re: /(ance|ence)$/i,
    tail: "ancia",
    ex: [["importance", "importancia"], ["difference", "diferencia"], ["experience", "experiencia"]],
    probe: [
      ["abundance", "abundancia"], ["distance", "distancia"], ["elegance", "elegancia"],
      ["ignorance", "ignorancia"], ["evidence", "evidencia"], ["existence", "existencia"],
      ["influence", "influencia"], ["presence", "presencia"],
    ],
    note: "-ance → -ancia, -ence → -encia. Feminine."
  },
  {
    en: "-ary",
    es: "-ario",
    re: /ary$/i,
    tail: "ario",
    ex: [["necessary", "necesario"], ["ordinary", "ordinario"], ["salary", "salario"]],
    probe: [
      ["contrary", "contrario"], ["imaginary", "imaginario"], ["literary", "literario"],
      ["primary", "primario"], ["solitary", "solitario"], ["voluntary", "voluntario"],
      ["adversary", "adversario"], ["arbitrary", "arbitrario"],
    ],
    note: "Masculine as a noun; agrees as an adjective."
  },
  {
    en: "-ize",
    es: "-izar",
    re: /(ize|ise|yze|yse)$/i,
    tail: "izar",
    ex: [["organize", "organizar"], ["analyze", "analizar"], ["memorize", "memorizar"]],
    probe: [
      ["authorize", "autorizar"], ["civilize", "civilizar"], ["formalize", "formalizar"],
      ["idealize", "idealizar"], ["modernize", "modernizar"], ["normalize", "normalizar"],
      ["utilize", "utilizar"], ["visualize", "visualizar"],
    ],
    note: "A regular -ar verb, so it conjugates with no surprises."
  },
  {
    en: "-able / -ible",
    es: "-able / -ible",
    re: /(able|ible)$/i,
    tail: "able",
    ex: [["probable", "probable"], ["terrible", "terrible"], ["possible", "posible"]],
    probe: [
      ["adorable", "adorable"], ["comparable", "comparable"], ["considerable", "considerable"],
      ["favorable", "favorable"], ["inevitable", "inevitable"], ["memorable", "memorable"],
      ["flexible", "flexible"], ["visible", "visible"],
    ],
    note: "Unchanged, except that Spanish doesn't double s, m, f, p or t: posible, not possible."
  },
  {
    en: "-ct",
    es: "-cto",
    re: /ct$/i,
    tail: "cto",
    ex: [["perfect", "perfecto"], ["correct", "correcto"], ["exact", "exacto"]],
    probe: [
      ["abstract", "abstracto"], ["act", "acto"], ["aspect", "aspecto"],
      ["conflict", "conflicto"], ["direct", "directo"], ["effect", "efecto"],
      ["insect", "insecto"], ["product", "producto"],
    ],
    note: "Add a vowel — Spanish words don't end in -ct."
  },
  {
    en: "-al",
    es: "-al",
    re: /al$/i,
    tail: "al",
    ex: [["natural", "natural"], ["general", "general"], ["total", "total"]],
    probe: [
      ["animal", "animal"], ["central", "central"], ["cultural", "cultural"],
      ["federal", "federal"], ["ideal", "ideal"], ["legal", "legal"],
      ["local", "local"], ["moral", "moral"],
    ],
    note: "Free words. Identical spelling; the Spanish stress falls on the last syllable."
  },
  {
    en: "-or",
    es: "-or",
    re: /or$/i,
    tail: "or",
    ex: [["doctor", "doctor"], ["color", "color"], ["actor", "actor"]],
    probe: [
      ["error", "error"], ["favor", "favor"], ["honor", "honor"],
      ["horror", "horror"], ["inferior", "inferior"], ["interior", "interior"],
      ["motor", "motor"], ["superior", "superior"],
    ],
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
