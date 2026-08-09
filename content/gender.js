/* Gender

   `endings` is the rule table; `nouns` are the drill items. Keep the two
   in step — a noun whose ending contradicts the table should be an
   exception worth teaching, not an oversight. */

window.MX = window.MX || {};

window.MX.genderEndings = [
  { end: "-ción, -sión", g: "f", ex: "la nación, la decisión" },
  { end: "-dad, -tad, -tud", g: "f", ex: "la ciudad, la libertad, la actitud" },
  { end: "-umbre", g: "f", ex: "la costumbre, la cumbre" },
  { end: "-a (default)", g: "f", ex: "la casa, la mesa" },
  { end: "-o (default)", g: "m", ex: "el libro, el trabajo" },
  { end: "-or", g: "m", ex: "el color, el doctor" },
  { end: "-ma (from Greek)", g: "m", ex: "el problema, el sistema, el idioma" },
  { end: "-aje", g: "m", ex: "el viaje, el paisaje" }
];

window.MX.genderNouns = [
  ["información", "la"],
  ["problema", "el"],
  ["ciudad", "la"],
  ["viaje", "el"],
  ["libertad", "la"],
  ["color", "el"],
  ["costumbre", "la"],
  ["sistema", "el"],
  ["decisión", "la"],
  ["paisaje", "el"],
  ["actitud", "la"],
  ["idioma", "el"],
  ["universidad", "la"],
  ["tema", "el"],
  ["nación", "la"],
  ["calor", "el"],
  ["mano", "la"],
  ["día", "el"],
  ["foto", "la"],
  ["mapa", "el"],
  ["camión", "el"],
  ["alberca", "la"],
  ["computadora", "la"],
  ["celular", "el"]
];

/* The exceptions table, shown under the endings on the Gender tab.
   Display only — the drilled version of these lives in content/rules.js.
   Rows are [word, article, why it surprises]. */
window.MX.genderExceptionTable = [
  ["la mano", "la", "Ends in -o but is feminine"],
  ["el día", "el", "Ends in -a but is masculine"],
  ["el mapa · el sofá", "el", "Masculine despite the -a"],
  ["la foto · la moto", "la", "Clipped from fotografía and motocicleta"],
  ["el agua", "el", "A feminine noun that takes el to avoid the a-a clash — but el agua fría"],
  ["el problema · el sistema · el tema", "el", "Greek -ma nouns, all masculine"],
  ["la computadora", "la", "Feminine in Mexico; Spain's ordenador is masculine"]
];
