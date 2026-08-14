import React from "../react.js";
import { Pages } from "../components/Pages.jsx";
import {
  DAILY_GOAL, questsFor, questProgress, streakStatus, levelProgress,
  titleFor, BADGES, masteryPoints, rankOf, REGIONS, unlockedRegions,
} from "../lib/game.js";
import { ALL_IDS, idsForMod } from "../lib/decks.js";
import { dueCount } from "../lib/srs.js";

/* What today is asking for.
 *
 * Every number on this screen is a fact about the review schedule wearing a
 * game's clothes. The goal is scheduled items answered right — not minutes, not
 * lessons opened, not cards seen. A streak you can keep by replaying things you
 * already know is a streak that measures attendance, and attendance is not the
 * thing worth protecting. */
export function TodayScreen({ game, progress, summary, onRegion }) {
  const now = Date.now();
  const day = game.today;
  const streak = streakStatus(game, now);
  const points = masteryPoints(progress.items, ALL_IDS);
  const level = levelProgress(points);
  const quests = questsFor(day.key).map((q) => questProgress(game, q));
  const held = new Set(game.badges);

  const goalPct = Math.min(100, Math.round((day.due / DAILY_GOAL) * 100));

  const ranks = { unseen: 0, shaky: 0, learning: 0, solid: 0, mature: 0, burnished: 0 };
  for (const id of ALL_IDS) ranks[rankOf(progress.items[id])]++;

  /* Where the button at the bottom actually goes. The Arena is the right
     answer once it is open, since it interleaves; before that, send them to
     whichever open region owes the most — and name it, rather than promising
     the Arena and delivering somewhere else. */
  const open = unlockedRegions(game);
  const target = open.has("arena")
    ? { region: REGIONS.find((r) => r.id === "arena"), due: summary.due }
    : REGIONS.filter((r) => open.has(r.id) && !r.endless)
        .map((r) => ({ region: r, due: dueCount(progress.items, idsForMod(r.mod), now) }))
        .sort((a, b) => b.due - a.due)[0];

  return (
    <div className="screen today-screen">
      <header className="screen-top">
        <div className="screen-title wide">
          <span className="screen-eyebrow">Hoy</span>
          <h2>{day.goalMet ? "Today is done" : "Today"}</h2>
        </div>
      </header>

      <div className="screen-body">
        <Pages label="today">
          <div className="tile-row" data-break="">
            <div className="tile">
              <div className="tile-n">{level.level}</div>
              <div className="tile-l">level · {titleFor(level.level)}</div>
              <div className="tile-bar"><i style={{ width: level.fraction * 100 + "%" }} /></div>
              <div className="tile-x">{points} mastery from {ranks.mature + ranks.burnished} mature items</div>
            </div>
            <div className="tile" data-warn={streak.atRisk}>
              <div className="tile-n">{streak.count}<span className="tile-u">🔥</span></div>
              <div className="tile-l">day streak</div>
              <div className="tile-x">
                {streak.count === 0
                  ? "Clear the goal today to start one."
                  : streak.atRisk
                    ? "Not cleared yet today."
                    : "Cleared today."}
                {game.streak.freezes > 0 && ` · ${game.streak.freezes} grace day${game.streak.freezes === 1 ? "" : "s"} banked`}
              </div>
            </div>
          </div>

          <div className="goal" data-break="" data-met={day.goalMet}>
            <div className="goal-head">
              <b>Daily goal</b>
              <span>{Math.min(day.due, DAILY_GOAL)} / {DAILY_GOAL} scheduled items</span>
            </div>
            <div className="tile-bar big"><i style={{ width: goalPct + "%" }} /></div>
            <p className="goal-note">
              {day.goalMet
                ? "Done. The streak is safe, and anything else today is free practice."
                : summary.due > 0
                  ? `${summary.due} item${summary.due === 1 ? " is" : "s are"} overdue right now. Only scheduled items count here — replaying things you already know does not move this bar.`
                  : "Nothing is overdue. New material counts too, so any region with unmet items will do it."}
            </p>
          </div>

          <h3 className="section-h" data-break="">Quests</h3>
          <div className="quests">
            {quests.map((q) => (
              <div className="quest" key={q.id} data-done={q.done} data-break="">
                <span className="quest-mark" aria-hidden="true">{q.done ? "✓" : "◦"}</span>
                <span className="quest-text">
                  <b>{q.text}</b>
                  <span className="tile-bar thin"><i style={{ width: q.fraction * 100 + "%" }} /></span>
                </span>
                <span className="quest-n">{Math.min(q.have, q.target)}/{q.target}</span>
              </div>
            ))}
          </div>

          <h3 className="section-h" data-break="">The shape of what you know</h3>
          <div className="ranks" data-break="">
            {[
              ["burnished", "burnished", "60+ days"],
              ["mature", "mature", "21+ days"],
              ["solid", "solid", "8+ days"],
              ["learning", "learning", "under a week"],
              ["shaky", "shaky", "lapsed to zero"],
              ["unseen", "unmet", "never asked"],
            ].map(([key, label, note]) => (
              <div className="rank-row" key={key}>
                <span className={"rank-key rank-" + key}>{label}</span>
                <span className="rank-bar">
                  <i className={"rank-" + key} style={{ width: (100 * ranks[key]) / ALL_IDS.length + "%" }} />
                </span>
                <span className="rank-n">{ranks[key]}</span>
                <span className="rank-note">{note}</span>
              </div>
            ))}
          </div>

          <h3 className="section-h" data-break="">Badges</h3>
          <div className="badges">
            {BADGES.map((b) => (
              <span key={b.id} className="badge" data-on={held.has(b.id)} data-break="">
                <b aria-hidden="true">{held.has(b.id) ? "🏅" : "◦"}</b> {b.text}
              </span>
            ))}
          </div>

          {target && target.due > 0 && (
            <button className="btn wide spaced" data-break="" onClick={() => onRegion(target.region.id)}>
              Take {target.due} due item{target.due === 1 ? "" : "s"} into {target.region.name}
            </button>
          )}
        </Pages>
      </div>
    </div>
  );
}
