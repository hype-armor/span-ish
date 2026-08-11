import React, { useMemo } from "../react.js";
import { Table } from "./bits.jsx";
import { REVIEW_BANDS, MIN_REVIEWS_TO_READ } from "../lib/srs.js";
import { cardsFor, MODULES } from "../lib/decks.js";

const LABELS = {
  new: "first sight",
  relearning: "just missed",
  "1-3": "1–3 days",
  "4-9": "4–9 days",
  "10-29": "10–29 days",
  "30+": "30+ days",
};

/* Cards you keep missing are usually badly written rather than genuinely hard,
   so surfacing them points at content to fix. */
const LEECH_THRESHOLD = 3;

export function Diagnostics({ progress }) {
  /* Ids are not readable. Label by the prompt rather than the answer: on a
     multiple-choice card the answer is "el" or "la", which identifies nothing.
     Dictation has no visible prompt, so fall back to what is said. */
  const labelFor = useMemo(() => {
    const map = new Map();
    for (const card of cardsFor("mixed")) {
      if (map.has(card.id)) continue;
      /* Sentence prompts carry the blank glyph, which reads oddly out of the
         drill; show it as an ordinary gap. */
      const label = (card.q || card.canon || card.a || "").replace(/⌷/g, "___");
      map.set(card.id, label.trim());
    }
    return map;
  }, []);

  const reviews = progress.reviews || {};
  const bands = REVIEW_BANDS.map((band) => {
    const { right = 0, wrong = 0 } = reviews[band] || {};
    const total = right + wrong;
    return { band, right, total, rate: total ? Math.round((100 * right) / total) : null };
  }).filter((b) => b.total > 0);

  const answered = bands.reduce((n, b) => n + b.total, 0);

  const modules = MODULES.filter((m) => progress.scores[m])
    .map((m) => {
      const s = progress.scores[m];
      return { mod: m, total: s.total, rate: s.total ? Math.round((100 * s.right) / s.total) : 0 };
    })
    .sort((a, b) => a.rate - b.rate);

  const leeches = Object.entries(progress.items || {})
    .filter(([, item]) => (item.lapses || 0) >= LEECH_THRESHOLD)
    .sort((a, b) => (b[1].lapses || 0) - (a[1].lapses || 0))
    .slice(0, 12)
    .map(([id, item]) => ({ id, lapses: item.lapses, label: labelFor.get(id) || id }));

  if (!answered) {
    return (
      <div className="panel">
        <div className="card-k">How the schedule is doing</div>
        <div className="card-v" style={{ maxWidth: "58ch" }}>
          Nothing to report yet. Once you have finished a few rounds this will show how well each
          review interval is holding up, which is what decides whether the schedule needs changing.
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="card-k">How the schedule is doing</div>
      <div className="card-v" style={{ maxWidth: "58ch" }}>
        Every answer is filed under the gap that preceded it. A healthy schedule holds somewhere
        around 85–90% at each interval: much higher and the gaps are shorter than they need to be,
        much lower and material is being forgotten before it comes back. Judge a row only once it has
        a few dozen answers behind it.
      </div>

      <Table head={["Gap before the review", "Answered", "Held"]}>
        {bands.map((b) => (
          <tr key={b.band}>
            <td className="key">{LABELS[b.band] || b.band}</td>
            <td className="dim">{b.total}</td>
            <td className="mono term" style={{
              color: b.total < MIN_REVIEWS_TO_READ ? "var(--faint)"
                : b.rate >= 85 ? "var(--good)"
                : b.rate >= 70 ? "var(--primary)"
                : "var(--bad)",
            }}>
              {b.rate}%{b.total < MIN_REVIEWS_TO_READ ? " · too few" : ""}
            </td>
          </tr>
        ))}
      </Table>

      {modules.length > 0 && (
        <>
          <div className="card-k" style={{ marginTop: 22 }}>Accuracy by topic</div>
          <div className="card-v" style={{ maxWidth: "58ch" }}>
            Weakest first. A topic well below the others is usually a sign the cards need work rather
            than that you do.
          </div>
          <Table head={["Topic", "Answered", "Correct"]}>
            {modules.map((m) => (
              <tr key={m.mod}>
                <td className="key">{m.mod}</td>
                <td className="dim">{m.total}</td>
                <td className="mono term">{m.rate}%</td>
              </tr>
            ))}
          </Table>
        </>
      )}

      {leeches.length > 0 && (
        <>
          <div className="card-k" style={{ marginTop: 22 }}>Cards you keep missing</div>
          <div className="card-v" style={{ maxWidth: "58ch" }}>
            Missed {LEECH_THRESHOLD} times or more. A card that keeps coming back is usually written
            badly — an ambiguous prompt, or a wrong answer that is defensible — so treat this as a
            list of content to look at, not a list of your failings.
          </div>
          <div className="requeue">
            <div className="requeue-l">
              {leeches.map((l) => (
                <span key={l.id}>{l.label} · {l.lapses}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
