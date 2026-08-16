import React, { useState, useRef, useEffect } from "../react.js";
import { Scroll } from "../components/Scroll.jsx";
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
  const rail = useRef(null);

  /* Keep the chapter you are on in view. With names rather than dots the rail
     is wider than a phone, so the one that matters can be off the edge. */
  useEffect(() => {
    const strip = rail.current;
    if (!strip) return;
    const chip = strip.children[at];
    if (chip && chip.scrollIntoView) chip.scrollIntoView({ block: "nearest", inline: "center" });
  }, [at]);

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
        <Scroll label={entry.title} key={entry.id}>
          <div className="codex-body">
            <Body speak={speak} />
          </div>
        </Scroll>
      </div>

      {entries.length > 1 && (
        <>
          {/* Named, not dots. The chapters are the structure of the region, and
              a row of anonymous marks makes you press Next to find out what it
              is. */}
          <nav className="entry-rail" ref={rail} aria-label={`${region.name} chapters`}>
            {entries.map((e, i) => (
              <button
                key={e.id}
                className="rail-chip"
                data-on={i === at}
                onClick={() => setAt(i)}
                aria-current={i === at ? "true" : undefined}
                title={e.title}
              >
                {e.short || e.title}
              </button>
            ))}
          </nav>
          <footer className="screen-foot">
            <button className="btn ghost" onClick={() => step(-1)} disabled={at === 0}>‹ Back</button>
            <span className="entry-of">{at + 1} of {entries.length}</span>
            <button className="btn" onClick={() => step(1)} disabled={at === entries.length - 1}>
              Next ›
            </button>
          </footer>
        </>
      )}
    </div>
  );
}
