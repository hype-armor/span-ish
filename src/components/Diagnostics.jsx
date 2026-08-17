import React, { useMemo } from "../react.js";
import { Table } from "./bits.jsx";
import { REVIEW_BANDS, MIN_REVIEWS_TO_READ } from "../lib/srs.js";
import { cardsFor, MODULES } from "../lib/decks.js";
import { PROBE_FAMILIES, MIN_PROBES_TO_READ, remainingFor } from "../lib/probe.js";

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

  /* The drilled side of the comparison is the module's own accuracy, since
     that is the same material asked the same way. */
  const transfer = PROBE_FAMILIES.map((family) => {
    const { asked = 0, right = 0 } = (progress.probes || {})[family.id] || {};
    const drilled = progress.scores[family.mod];
    return {
      ...family,
      asked,
      novelRate: asked ? Math.round((100 * right) / asked) : null,
      drilledTotal: drilled ? drilled.total : 0,
      drilledRate: drilled && drilled.total ? Math.round((100 * drilled.right) / drilled.total) : null,
      left: remainingFor(family.id, progress.probes),
    };
  }).filter((f) => f.asked > 0);

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

      {transfer.length > 0 && (
        <>
          <div className="card-k" style={{ marginTop: 22 }}>The rule, or the cards?</div>
          <div className="card-v" style={{ maxWidth: "58ch" }}>
            Every so often a mission slips in a word the app has never shown you, drawn from a rule
            you have been drilling. Those cards are never scheduled, never repeated, and earn
            nothing. Strong on the drilled cards and weak on the never-seen ones is the signal worth
            having: it means the pairs are learned and the rule is not. Read it as a floor rather
            than a measurement — some of those words you may simply know, and the drilled column is
            asked at the edge of forgetting while these are always at first sight.
          </div>
          <Table head={["Rule family", "Drilled", "Never seen", "Asked"]}>
            {transfer.map((f) => (
              <tr key={f.id}>
                <td className="key">{f.label}</td>
                <td className="mono term" style={{ color: "var(--faint)" }}>
                  {f.drilledRate === null ? "—" : f.drilledRate + "%"}
                </td>
                <td className="mono term" style={{
                  color: f.asked < MIN_PROBES_TO_READ ? "var(--faint)"
                    : f.novelRate >= 85 ? "var(--good)"
                    : f.novelRate >= 70 ? "var(--primary)"
                    : "var(--bad)",
                }}>
                  {f.novelRate}%
                </td>
                <td className="dim">
                  {f.asked}{f.asked < MIN_PROBES_TO_READ ? " · too few" : ""}
                  {f.left === 0 ? " · none left" : ""}
                </td>
              </tr>
            ))}
          </Table>
        </>
      )}

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
