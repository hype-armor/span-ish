import React from "../react.js";
import { Glossed } from "./Glossary.jsx";

/* The little ▶ next to a word in a reference table. */
export function Speak({ text, speak, label }) {
  return (
    <button className="speak" onClick={() => speak(text)} aria-label={label || "Play audio"}>▶</button>
  );
}

/* Every reference table in the app. The wrapper is what scrolls on a phone. */
export function Table({ head, children }) {
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/* Every explanatory paragraph in the app. Routing them through one component
   means a grammar word is clickable wherever it appears, rather than only where
   someone remembered to mark it up. */
export function Lede({ children, style }) {
  return (
    <p className="lede" style={style}>
      <Glossed>{children}</Glossed>
    </p>
  );
}
