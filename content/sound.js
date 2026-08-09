/* Pronunciation

   Five vowels that never reduce, the consonants that differ from English,
   the four values of x, and the stress rules. `dictation` items are spelled
   from audio, so they are the one place accents are graded strictly. */

window.MX = window.MX || {};

window.MX.vowels = [
  { l: "a", s: "ah", w: "casa", g: "As in father — never the vowel of 'cat', never a schwa" },
  { l: "e", s: "eh", w: "mesa", g: "As in bet — never the 'ay' glide of 'day'" },
  { l: "i", s: "ee", w: "vino", g: "As in machine" },
  { l: "o", s: "oh", w: "loco", g: "As in pore — never the 'ow' glide of 'go'" },
  { l: "u", s: "oo", w: "luna", g: "As in rule — silent in que, qui, gue, gui" }
];

window.MX.consonants = [
  { l: "h", r: "Silent. Always.", w: "hola, hombre, hasta" },
  { l: "j", r: "A rasped h, softer in Mexico than in Spain", w: "jamón, trabajo, hijo" },
  { l: "g", r: "The same rasp before e and i; a hard g everywhere else", w: "gente, gigante, gato" },
  { l: "ll / y", r: "English y — no Argentine 'sh'", w: "llamar, calle, yo" },
  { l: "ñ", r: "ny, as in canyon", w: "año, mañana, niño" },
  { l: "rr", r: "Trilled — as is any r that starts a word", w: "perro, rojo, carro" },
  { l: "v", r: "Identical to b. Spanish has no English v sound", w: "vino, vaca, verde" },
  { l: "z / ce / ci", r: "Always s. Mexico has no 'th' sound", w: "zapato, cinco, gracias" },
  { l: "qu", r: "k — the u is silent", w: "que, quién, aquí" },
  { l: "x", r: "Four different values — see below", w: "México, taxi, Xochimilco" }
];

window.MX.xSounds = [
  {
    w: "México, Oaxaca, Xalapa",
    s: "h",
    ex: "México",
    n: "Frozen old spelling. Never 'ks' — it's MÉ-hi-co."
  },
  { w: "taxi, éxito, experto", s: "ks", ex: "taxi", n: "The Latin default, same as English." },
  { w: "Xochimilco, xilófono", s: "s", ex: "Xochimilco", n: "An x starting a word is usually just s." },
  {
    w: "mixiote, Uxmal, Xcaret",
    s: "sh",
    ex: "mixiote",
    n: "Nahuatl and Maya words that kept the older sh."
  }
];

window.MX.stressRules = [
  {
    cond: "Ends in a vowel, n, or s",
    rule: "Stress the second-to-last syllable",
    ex: "CA-sa, HA-blan, LI-bros"
  },
  {
    cond: "Ends in any other consonant",
    rule: "Stress the last syllable",
    ex: "ha-BLAR, ciu-DAD, es-pa-ÑOL"
  },
  {
    cond: "Carries a written accent",
    rule: "Stress the accent — the rules above are overridden",
    ex: "MÉ-di-co, ac-CIÓN, in-GLÉS"
  }
];

window.MX.dictation = [
  { w: "jamón", hint: "The j is a rasped h" },
  { w: "hola", hint: "The h is silent" },
  { w: "calle", hint: "ll sounds like English y" },
  { w: "año", hint: "That ny sound is ñ — año is 'year', ano is not" },
  { w: "gente", hint: "g before e rasps like j" },
  { w: "aquí", hint: "The k sound is spelled qu" },
  { w: "zapato", hint: "z is simply s in Mexico" },
  { w: "quiero", hint: "qu, then ie" },
  { w: "mañana", hint: "ñ in the middle" },
  { w: "hijo", hint: "Silent h, rasped j" },
  { w: "llave", hint: "ll to start, and v sounds like b" },
  { w: "ciudad", hint: "c before i is s; it ends in d" },
  { w: "trabajo", hint: "A rasped j before the o" },
  { w: "vaca", hint: "Sounds like it starts with b, spelled with v" },
  { w: "señor", hint: "ñ, and the stress falls on the last syllable" },
  { w: "guitarra", hint: "Silent u after g, then a trilled rr" }
];
