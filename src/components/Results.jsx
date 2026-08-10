import React, { useState, useEffect } from "../react.js";

const RADIUS = 58;

/* Shown when a round ends. The ring animates from zero on mount, which is why
   the percentage is held in state rather than rendered directly. */
export function Results({ label, results, total, best, onRestart }) {
  const right = results.filter((r) => r.right).length;
  const percent = total ? Math.round((right / total) * 100) : 0;

  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(percent), 80);
    return () => clearTimeout(t);
  }, [percent]);

  const missed = results.filter((r) => !r.right);
  const circumference = 2 * Math.PI * RADIUS;
  const colour = percent >= 80 ? "var(--good)" : percent >= 50 ? "var(--primary)" : "var(--bad)";
  const headline =
    percent === 100 ? "Perfect round"
    : percent >= 80 ? "Strong round"
    : percent >= 50 ? "Getting there"
    : "Worth another pass";

  return (
    <div className="drill">
      <div className="drill-top">
        <div className="drill-meta">
          <span className="drill-title">{label} · complete</span>
        </div>
      </div>

      <div className="result">
        <div className="ring">
          <svg width="132" height="132">
            <circle className="track" cx="66" cy="66" r={RADIUS} />
            <circle
              className="fill"
              cx="66"
              cy="66"
              r={RADIUS}
              stroke={colour}
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * shown) / 100}
            />
          </svg>
          <div className="ring-mid">
            <div className="ring-n" style={{ color: colour }}>{percent}%</div>
            <div className="ring-l">{right} of {total}</div>
          </div>
        </div>

        <div className="result-h">{headline}</div>
        <p className="result-p">
          {missed.length === 0
            ? "Every item moved further out on the schedule. Come back when the review counter fills up."
            : "Correct answers moved further out. The misses reset to zero and are due again now."}
          {percent > best && percent > 0 ? " That's a new best for this drill." : ""}
        </p>

        {missed.length > 0 && (
          <div className="requeue">
            <div className="requeue-h">Reset and due now</div>
            <div className="requeue-l">
              {missed.map((m, i) => <span key={i}>{m.canon}</span>)}
            </div>
          </div>
        )}

        <div className="actions" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={onRestart}>Another round</button>
        </div>
      </div>
    </div>
  );
}
