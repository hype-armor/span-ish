import React, { useState } from "../react.js";
import { Pages } from "../components/Pages.jsx";
import { entriesFor } from "../codex/entries.jsx";

/* The reference material for one region, one entry at a time.
 *
 * This is the half of the app that is read rather than answered, and keeping
 * it somewhere you go on purpose is the point: the old layout put a wall of
 * tables above every drill, which meant the material was always in the way and
 * never actually studied. Here it is a place, and the missions are next door.
 */
export function CodexScreen({ region, speak, onExit }) {
  const entries = entriesFor(region.id);
  const [at, setAt] = useState(0);
  const entry = entries[at];

  if (!entry) return null;
  const Body = entry.Body;
  const step = (delta) => setAt((i) => Math.max(0, Math.min(entries.length - 1, i + delta)));

  return (
    <div className="screen codex">
      <header className="screen-top">
        <button className="icon-btn small" onClick={onExit} aria-label="Back to the region">‹</button>
        <div className="screen-title">
          <span className="screen-eyebrow">{region.name} · codex</span>
          <h2>{entry.title}</h2>
        </div>
        <span className="entry-count" aria-hidden="true">{at + 1}/{entries.length}</span>
      </header>

      <div className="screen-body">
        <Pages label={entry.title} grow key={entry.id}>
          <div className="codex-body">
            <Body speak={speak} />
          </div>
        </Pages>
      </div>

      {entries.length > 1 && (
        <footer className="screen-foot">
          <button className="btn ghost" onClick={() => step(-1)} disabled={at === 0}>‹ Back</button>
          <div className="entry-rail" role="tablist" aria-label="Codex entries">
            {entries.map((e, i) => (
              <button
                key={e.id}
                className="rail-dot"
                data-on={i === at}
                onClick={() => setAt(i)}
                aria-label={e.title}
                aria-current={i === at}
              />
            ))}
          </div>
          <button className="btn" onClick={() => step(1)} disabled={at === entries.length - 1}>
            Next ›
          </button>
        </footer>
      )}
    </div>
  );
}
