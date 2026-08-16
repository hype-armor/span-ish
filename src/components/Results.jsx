import React, { useState, useEffect } from "../react.js";
import { MODES } from "../lib/game.js";
import { burst, sfx } from "../lib/juice.js";

const RADIUS = 46;

/* How much of a variable-length list the screen will show before summarising
   the rest. The results screen does not scroll — it is the end of a mission,
   and a mission is a thing that fits — so the two lists that have no natural
   length are given one. Nothing is lost by the cap: every missed item is due
   again immediately and comes back on its own. */
const MISSES_SHOWN = 5;
const WON_SHOWN = 4;

/* What a mission adds up to.
 *
 * The numbers here are deliberately in a particular order: what you got right
 * first, what it did to the schedule second, and the game's own scoring last.
 * XP is the least important thing on this screen and is laid out like it. */
export function MissionResult({ region, stage, outcome, onRestart, onExit, motion, canvasRef }) {
  const { results, won, xp, combo, flawless, cram, level, badges, quests } = outcome;
  const right = results.filter((r) => r.right).length;
  const total = results.length;
  const percent = total ? Math.round((right / total) * 100) : 0;

  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(percent), 80);
    return () => clearTimeout(t);
  }, [percent]);

  /* The burst is saved for a mission actually cleared, so it keeps meaning
     something. With motion turned down it still fires — it just holds still. */
  useEffect(() => {
    if (won === false || !canvasRef || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const stop = burst(canvas, {
      x: canvas.clientWidth / 2,
      y: canvas.clientHeight * 0.34,
      hue: percent >= 80 ? 145 : 214,
      count: percent === 100 ? 70 : 44,
      still: motion === "reduced",
    });
    return typeof stop === "function" ? stop : undefined;
  }, [won, canvasRef, percent, motion]);

  useEffect(() => {
    if (level && level.after > level.before) {
      const t = setTimeout(() => sfx.levelUp(), 420);
      return () => clearTimeout(t);
    }
  }, [level]);

  const missed = results.filter((r) => !r.right);
  const missedShown = missed.slice(0, MISSES_SHOWN);
  const missedRest = missed.length - missedShown.length;

  /* Quests and badges are the same kind of thing on this screen — something
     the run won — so they share one row and one cap. */
  const spoils = [
    ...(quests || []).map((q) => ({ key: "q:" + q.id, kind: "quest", text: `✓ ${q.text}` })),
    ...(badges || []).map((b) => ({ key: "b:" + b.id, kind: "badge", text: `🏅 ${b.text}` })),
  ];
  const spoilsShown = spoils.slice(0, WON_SHOWN);
  const spoilsRest = spoils.length - spoilsShown.length;
  const circumference = 2 * Math.PI * RADIUS;
  const colour = won === false ? "var(--bad)" : percent >= 80 ? "var(--good)" : percent >= 50 ? "var(--primary)" : "var(--accent)";

  const headline =
    won === false && stage.mode === "boss" ? "It survived"
    : won === false ? "Run ended"
    : percent === 100 ? "Perfect"
    : stage.mode === "boss" ? "Boss down"
    : percent >= 80 ? "Strong run"
    : percent >= 50 ? "Getting there"
    : "Worth another pass";

  const levelled = level && level.after > level.before;

  return (
    <div className="mission result-screen">
      <header className="mission-top">
        <div className="mission-line">
          <button className="icon-btn small" onClick={onExit} aria-label="Back to the region">‹</button>
          <div className="mission-id">
            <span className="mission-mode">{MODES[stage.mode].name}</span>
            <span className="mission-where">{region.name}</span>
          </div>
          <div className="mission-count" aria-hidden="true">✓</div>
        </div>
      </header>

      <div className="mission-body report">
          <div className="result">
            <div className="ring">
              <svg width="108" height="108" viewBox="0 0 108 108">
                <circle className="track" cx="54" cy="54" r={RADIUS} />
                <circle
                  className="fill"
                  cx="54"
                  cy="54"
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

            {levelled && (
              <div className="levelup" role="status">
                Level {level.after} — <b>{level.title}</b>
              </div>
            )}

            <div className="tally">
              <div className="tally-cell">
                <span className="tally-n">+{xp}</span>
                <span className="tally-l">XP</span>
              </div>
              <div className="tally-cell">
                <span className="tally-n">{combo}</span>
                <span className="tally-l">best run</span>
              </div>
              <div className="tally-cell">
                <span className="tally-n">{right}</span>
                <span className="tally-l">pushed out</span>
              </div>
            </div>

            {cram && (
              <p className="result-note warn">
                Almost nothing here was due yet, so this was practice rather than review — the XP is
                a quarter of the usual. Reviewing early does not do much for a memory that has not
                started to fade.
              </p>
            )}

            {flawless && !cram && <p className="result-note good">Not a single miss. Bonus paid.</p>}

            {/* Only when there is no list below saying the same thing. With
                misses, "Reset and due now" is the heading of the block that
                follows and this sentence is two lines of restating it — which
                is also the two lines the screen could least afford. */}
            {missed.length === 0 && (
              <p className="result-p">Every item moved further out on the schedule.</p>
            )}

            {spoils.length > 0 && (
              <div className="badges-won">
                {spoilsShown.map((w) => (
                  <span key={w.key} className={"badge-chip" + (w.kind === "quest" ? " quest-chip" : "")}>
                    {w.text}
                  </span>
                ))}
                {spoilsRest > 0 && <span className="badge-chip more">+{spoilsRest} more</span>}
              </div>
            )}

            {missed.length > 0 && (
              <div className="requeue">
                <div className="requeue-h">
                  Reset and due now
                  {missedRest > 0 && <b> · {missed.length} in all</b>}
                </div>
                <div className="requeue-l">
                  {missedShown.map((m, i) => <span key={i} title={m.label}>{m.label}</span>)}
                  {missedRest > 0 && <span className="more">+{missedRest} more</span>}
                </div>
              </div>
            )}
          </div>
      </div>

      <footer className="mission-foot">
        <button className="btn" onClick={onRestart}>Run it again</button>
        <button className="btn ghost" onClick={onExit}>Back to {region.name}</button>
      </footer>
    </div>
  );
}
