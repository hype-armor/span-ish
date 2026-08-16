import React from "../react.js";
import { levelProgress, titleFor, streakStatus, DAILY_GOAL } from "../lib/game.js";

/* The permanent strip along the top: where you are, what today has left, and
 * whether the streak survives the night. Four numbers, no more — a heads-up
 * display that needs reading is a second screen. */
export function Hud({ game, points, summary }) {
  const level = levelProgress(points);
  const streak = streakStatus(game, Date.now());
  const day = game.today;
  const goal = Math.min(1, day.due / DAILY_GOAL);

  return (
    <header className="hud">
      <div className="hud-level" title={titleFor(level.level)}>
        <span className="hud-lv">{level.level}</span>
        <span className="hud-lv-bar"><i style={{ width: level.fraction * 100 + "%" }} /></span>
      </div>

      <div className="hud-goal" aria-label={`${day.due} of ${DAILY_GOAL} scheduled items today`}>
        <span className="hud-goal-bar" data-met={day.goalMet}><i style={{ width: goal * 100 + "%" }} /></span>
        <span className="hud-goal-n">{Math.min(day.due, DAILY_GOAL)}/{DAILY_GOAL}</span>
      </div>

      <div className="hud-right">
        {summary.due > 0 && (
          <span className="hud-chip due" aria-label={`${summary.due} items due`}>{summary.due} due</span>
        )}
        <span
          className="hud-chip streak"
          data-alive={streak.alive}
          data-risk={streak.atRisk}
          aria-label={`${streak.count} day streak`}
        >
          🔥 {streak.count}
        </span>
      </div>
    </header>
  );
}
