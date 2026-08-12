/* Grammar words the app uses

   The drill offers "Subjunctive" as an answer without ever saying what one is.
   These definitions back the clickable terms in the prose and in every card's
   instruction and explanation.

   Written to be read mid-drill: one or two sentences, a Spanish example where
   it helps, and no term defined using another term you would also have to look
   up. `also` lists the other forms the text actually uses — plurals and
   adjectives — so the match works without a stemmer.

   Keep `term` lowercase; matching is case-insensitive and the original casing
   in the text is preserved. */

window.MX = window.MX || {};

window.MX.glossary = [
  {
    term: "mood",
    also: ["moods"],
    what: "Whether a verb is stating something as fact, or as something wanted, doubted or not yet real. Spanish marks the difference in the verb ending; English mostly does not.",
    ex: "Viene (fact) against venga (wanted or doubted).",
  },
  {
    term: "indicative",
    also: ["indicativo"],
    what: "The ordinary mood, used to assert that something is the case. It is what you use unless something forces otherwise.",
    ex: "Creo que viene — I think he's coming.",
  },
  {
    term: "subjunctive",
    also: ["subjunctives"],
    what: "The mood for things wanted, doubted, or not yet real. In practice a fixed set of phrases forces it, which is why this app teaches it as a lookup rather than as a feeling.",
    ex: "Espero que venga — I hope he comes.",
  },
  {
    term: "tense",
    also: ["tenses"],
    what: "When the verb happens — past, present, future. Separate from mood, which is about how certain or real it is.",
  },
  {
    term: "preterite",
    what: "The past tense for a finished event: it happened, it ended, you can count it.",
    ex: "Ayer comí tacos — yesterday I ate tacos.",
  },
  {
    term: "imperfect",
    what: "The past tense for what was going on around an event — habits, states, the scene. It has no clear end.",
    ex: "Comía tacos cada viernes — I used to eat tacos every Friday.",
  },
  {
    term: "conditional",
    what: "The would form. It is the other half of a si sentence, never the half after si itself.",
    ex: "Si tuviera dinero, viajaría — if I had money, I would travel.",
  },
  {
    term: "infinitive",
    also: ["infinitives"],
    what: "The unconjugated form of a verb, the one a dictionary lists. In Spanish it always ends in -ar, -er or -ir.",
    ex: "hablar, comer, vivir.",
  },
  {
    term: "conjugate",
    also: ["conjugated", "conjugation", "conjugations", "conjugating"],
    what: "To change a verb's ending so it matches who is doing it and when.",
    ex: "hablar becomes hablo, hablas, habla.",
  },
  {
    term: "stem",
    also: ["stems"],
    what: "What is left of a verb once you remove the ending. Endings are regular; it is usually the stem that misbehaves.",
    ex: "In tuvieron the stem is tuv-.",
  },
  {
    term: "ending",
    also: ["endings"],
    what: "The part added to a stem that carries the person and the tense.",
    ex: "In hablamos, -amos is the ending.",
  },
  {
    term: "person",
    also: ["persons"],
    what: "Who is doing the verb — I, you, he, we, they. Spanish shows it in the ending, so the pronoun is usually dropped.",
    ex: "Hablo already means I speak.",
  },
  {
    term: "gerund",
    also: ["gerunds"],
    what: "The -ing form, used after estar to say something is in progress.",
    ex: "Estoy comiendo — I'm eating.",
  },
  {
    term: "participle",
    also: ["participles"],
    what: "The -ed form, used after haber to build the perfect tenses.",
    ex: "He comido — I have eaten.",
  },
  {
    term: "auxiliary",
    also: ["auxiliaries"],
    what: "A helper verb carrying the grammar while another verb carries the meaning.",
    ex: "In he comido, haber is the auxiliary.",
  },
  {
    term: "clause",
    also: ["clauses"],
    what: "A piece of a sentence with its own verb. Most subjunctive rules are about what happens in the second one.",
    ex: "Espero que venga is two clauses joined by que.",
  },
  {
    term: "noun",
    also: ["nouns"],
    what: "A word for a thing, person or idea. In Spanish every one carries a gender.",
  },
  {
    term: "adjective",
    also: ["adjectives"],
    what: "A describing word. In Spanish it changes to match the gender and number of what it describes.",
    ex: "famoso, famosa, famosos, famosas.",
  },
  {
    term: "article",
    also: ["articles"],
    what: "The words the and a. Spanish has one for each gender, which is why the gender of a noun matters at all.",
    ex: "el libro, la casa.",
  },
  {
    term: "gender",
    also: ["genders", "gendered"],
    what: "Whether a noun counts as masculine or feminine. It is mostly predictable from the ending rather than from meaning.",
  },
  {
    term: "masculine",
    what: "The gender that takes el. Nouns ending in -o, -or and -aje usually are.",
  },
  {
    term: "feminine",
    what: "The gender that takes la. Nouns ending in -a, -ción, -dad and -umbre usually are.",
  },
  {
    term: "stress",
    also: ["stressed"],
    what: "Which syllable of a word is said loudest. Spanish has three rules for it, and the written accent exists to mark the exceptions.",
    ex: "HA-blo against ha-BLÓ.",
  },
  {
    term: "syllable",
    also: ["syllables"],
    what: "One beat of a word. ca-sa has two.",
  },
  {
    term: "accent",
    also: ["accents", "accented"],
    what: "The mark over a vowel. It is never decoration — it says the stress falls somewhere the rules would not have put it.",
    ex: "café, médico, inglés.",
  },
  {
    term: "suffix",
    also: ["suffixes"],
    what: "An ending attached to a word to make another word. English and Spanish inherited most of theirs from the same Latin, which is what the Transformer tab exploits.",
    ex: "-tion becomes -ción.",
  },
  {
    term: "cognate",
    also: ["cognates"],
    what: "A word that looks the same in both languages because both took it from the same source.",
    ex: "information and información.",
  },
  {
    term: "diminutive",
    also: ["diminutives"],
    what: "The -ito ending. In Mexico it almost never means small — it softens a request or warms up a sentence.",
    ex: "Espérame tantito — hang on a second.",
  },
  {
    term: "periphrasis",
    also: ["periphrastic"],
    what: "Saying with several words what another language says with one tense. Spanish leans on it heavily.",
    ex: "Voy a comer instead of a future tense.",
  },
  {
    term: "boot verb",
    also: ["boot verbs", "boot changer", "boot changers", "stem-changing", "stem change"],
    what: "A verb whose stem vowel shifts in every form except nosotros. Shade the changed cells in a table and they look like a boot.",
    ex: "puedo, puedes, puede, podemos, pueden.",
  },
  {
    term: "yo-go",
    also: ["yo-go group"],
    what: "Verbs that are irregular only in the yo form, which then ends in -go. Everything else behaves.",
    ex: "tengo, pongo, salgo.",
  },
  {
    term: "trigger",
    also: ["triggers"],
    what: "A phrase that forces the mood of whatever follows it, regardless of what you meant.",
    ex: "Ojalá que always takes the subjunctive.",
  },
];
