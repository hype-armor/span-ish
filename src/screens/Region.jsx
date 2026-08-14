import React from "../react.js";
import { Pages } from "../components/Pages.jsx";
import { stagesFor, stageOpen, regionMastery, MODES } from "../lib/game.js";
import { idsForMod } from "../lib/decks.js";
import { dueCount } from "../lib/srs.js";

/* One region: what it is, how much of it is standing up, and the four missions
 * that make it stand up.
 *
 * The stages escalate rather than branch. Recon has no clock and no penalty
 * because meeting new material under pressure is a bad trade; by the time you
 * reach the boss the material should be old news and the pressure is the point.
 */
export function RegionScreen({ region, game, progress, onStage, onCodex, onBack }) {
  const ids = idsForMod(region.mod);
  const mastery = regionMastery(progress.items, ids);
  const due = dueCount(progress.items, ids, Date.now());
  const stages = stagesFor(region);
  const cleared = (game.regions[region.id] || { stages: {} }).stages;

  return (
    <div className="screen region-screen">
      <header className="screen-top">
        <button className="icon-btn small" onClick={onBack} aria-label="Back to the map">‹</button>
        <div className="screen-title">
          <span className="screen-eyebrow">{region.en}</span>
          <h2><span className="region-glyph" aria-hidden="true">{region.glyph}</span>{region.name}</h2>
        </div>
        <span className="region-pct" aria-label={`${Math.round(mastery.fraction * 100)} per cent held`}>
          {Math.round(mastery.fraction * 100)}%
        </span>
      </header>

      <div className="screen-body">
        <Pages label="this region" grow>
          <p className="region-blurb" data-break="">{region.blurb}</p>

          <div className="region-meter" data-break="">
            <div className="meter">
              <i className="meter-held" style={{ width: mastery.fraction * 100 + "%" }} />
              <i
                className="meter-met"
                style={{ width: (mastery.met / mastery.total) * 100 + "%" }}
              />
            </div>
            <div className="meter-legend">
              <span><b>{mastery.held}</b> held</span>
              <span><b>{mastery.met}</b> met</span>
              <span><b>{mastery.total}</b> in all</span>
              {due > 0 && <span className="due-flag"><b>{due}</b> due</span>}
            </div>
          </div>

          <button className="codex-link" onClick={onCodex} data-break="">
            <span className="codex-icon" aria-hidden="true">☰</span>
            <span>
              <b>Open the codex</b>
              <em>The rules, the tables and the examples for {region.name}</em>
            </span>
            <span className="codex-go" aria-hidden="true">›</span>
          </button>

          <div className="stage-list">
            {stages.map((stage, i) => {
              const open = stageOpen(game, region.id, i);
              const done = !!(cleared[stage.id] || {}).cleared;
              const best = (cleared[stage.id] || {}).best || 0;
              return (
                <button
                  key={stage.id}
                  className="stage-btn"
                  data-break=""
                  data-mode={stage.mode}
                  data-done={done}
                  disabled={!open}
                  onClick={() => onStage(stage)}
                >
                  <span className="stage-n" aria-hidden="true">{done ? "✓" : open ? i + 1 : "🔒"}</span>
                  <span className="stage-text">
                    <b>{stage.name} <em>· {MODES[stage.mode].en}</em></b>
                    <em>
                      {open
                        ? stage.note
                        : `Clear ${stages[i - 1].name} to open this.`}
                    </em>
                  </span>
                  <span className="stage-meta">
                    <span className="stage-size">{stage.size}</span>
                    {best > 0 && <span className="stage-best">best {best}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </Pages>
      </div>
    </div>
  );
}
