import React from "../react.js";
import { REGIONS, unlockedRegions, stagesFor, regionMastery, stagesCleared } from "../lib/game.js";
import { idsForMod } from "../lib/decks.js";
import { dueCount } from "../lib/srs.js";

/* The road, which is what replaced the row of tabs.
 *
 * Eleven regions on a serpentine path, laid out on a grid that is exactly as
 * tall as the space it is given — no scrolling, no panning, no zoom. The whole
 * course is visible at once on purpose: what you have done, what is next, and
 * how much is still dark.
 *
 * A region opens when the one before it has had two missions cleared. That is
 * deliberately a low bar. Gating on mastery would be truer to the material and
 * would also leave a learner staring at the same region for a fortnight; the
 * scheduler already drags old material forward into everything that follows.
 */

/* Serpentine: left to right, then right to left, three to a row. */
const COLUMNS = 3;
function cellFor(index) {
  const row = Math.floor(index / COLUMNS);
  const within = index % COLUMNS;
  const column = row % 2 === 0 ? within : COLUMNS - 1 - within;
  return { row, column };
}

const RADIUS = 15.9155; // a circle with a circumference of 100, so dasharray is a percentage

export function MapScreen({ game, progress, onRegion }) {
  const open = unlockedRegions(game);
  const now = Date.now();

  const cells = REGIONS.map((region, i) => ({ region, ...cellFor(i) }));
  const rows = Math.max(...cells.map((c) => c.row)) + 1;

  /* The path runs through the middle of each cell. The viewBox is the grid
     itself, stretched rather than scaled, so the line lands on the nodes at
     any aspect ratio. */
  const points = cells.map((c) => `${c.column + 0.5},${c.row + 0.5}`).join(" ");

  return (
    <div className="screen map-screen">
      <div className="map-wrap">
        <svg
          className="map-path"
          viewBox={`0 0 ${COLUMNS} ${rows}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline points={points} />
        </svg>

        <div className="map-grid" style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}>
          {cells.map(({ region, row, column }) => {
            const unlocked = open.has(region.id);
            const ids = idsForMod(region.mod);
            const mastery = regionMastery(progress.items, ids);
            const due = unlocked ? dueCount(progress.items, ids, now) : 0;
            const done = stagesCleared(game, region.id);
            const total = stagesFor(region).length;
            const percent = Math.round(mastery.fraction * 100);

            return (
              <div
                className="map-cell"
                key={region.id}
                style={{ gridRow: row + 1, gridColumn: column + 1 }}
              >
                <button
                  className="node"
                  data-open={unlocked}
                  data-done={done >= total}
                  data-endless={!!region.endless}
                  disabled={!unlocked}
                  onClick={() => onRegion(region)}
                  aria-label={
                    unlocked
                      ? `${region.name}, ${region.en}. ${percent} per cent held, ${done} of ${total} missions cleared${due ? `, ${due} due` : ""}`
                      : `${region.name} is locked`
                  }
                >
                  <svg className="node-ring" viewBox="0 0 36 36" aria-hidden="true">
                    <circle className="node-track" cx="18" cy="18" r={RADIUS} />
                    <circle
                      className="node-fill"
                      cx="18"
                      cy="18"
                      r={RADIUS}
                      strokeDasharray={`${percent} 100`}
                    />
                  </svg>
                  <span className="node-glyph" aria-hidden="true">{unlocked ? region.glyph : "🔒"}</span>
                  {due > 0 && <span className="node-pip" aria-hidden="true">{due}</span>}
                  <span className="node-stages" aria-hidden="true">
                    {Array.from({ length: total }, (_, i) => (
                      <i key={i} data-on={i < done} />
                    ))}
                  </span>
                </button>
                <span className="node-label">{region.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
