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
