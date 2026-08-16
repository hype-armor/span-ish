import React from "../react.js";

/* Three places, along the bottom where a thumb already is. This is what is
 * left of the navigation: the eleven tabs became the map's eleven regions, so
 * the only thing left to switch between is the road, the day, and the numbers. */
const PLACES = [
  { id: "map", label: "Ruta", en: "The road", glyph: "◈" },
  { id: "today", label: "Hoy", en: "Today", glyph: "◉" },
  { id: "lab", label: "Lab", en: "The numbers", glyph: "◎" },
];

export function Dock({ at, onGo, pip }) {
  return (
    <nav className="dock" aria-label="Main">
      {PLACES.map((place) => (
        <button
          key={place.id}
          className="dock-btn"
          data-on={at === place.id}
          onClick={() => onGo(place.id)}
          aria-current={at === place.id ? "page" : undefined}
          aria-label={`${place.label} — ${place.en}`}
        >
          <span className="dock-glyph" aria-hidden="true">{place.glyph}</span>
          <span className="dock-label">{place.label}</span>
          {place.id === "today" && pip > 0 && <span className="dock-pip" aria-hidden="true">{pip}</span>}
        </button>
      ))}
    </nav>
  );
}
