/* Reading progress back in from storage, or from a pasted export.
 *
 * Anything on disk was written by an older version of this app, so every
 * field is re-derived rather than trusted. */
import { blank } from "./srs.js";
import { normaliseGame } from "./game.js";

const DEFAULT_EASE = blank().ease;

function normaliseItem(raw) {
  const streak = Number(raw.streak) || 0;
  return {
    right: Number(raw.right) || 0,
    wrong: Number(raw.wrong) || 0,
    streak,
    ease: typeof raw.ease === "number" ? raw.ease : DEFAULT_EASE,
    /* Older saves had no interval; infer one from the streak so those items
       do not all pile up as due today. */
    interval:
      typeof raw.interval === "number" ? raw.interval
      : streak === 0 ? 0
      : streak === 1 ? 1
      : streak === 2 ? 3
      : 7,
    due: typeof raw.due === "number" ? raw.due : 0,
    last: Number(raw.last) || 0,
    lapses: Number(raw.lapses) || Number(raw.wrong) || 0,
  };
}

/* The oldest saves were a bare scores object with no items at all. */
export function normalise(saved) {
  const shaped = saved && (saved.items || saved.scores) ? saved : { scores: saved || {}, items: {} };
  const items = {};
  for (const [id, raw] of Object.entries(shaped.items || {})) items[id] = normaliseItem(raw);

  /* Added later than the rest, so older saves simply have none. */
  const reviews = {};
  for (const [band, raw] of Object.entries(shaped.reviews || {})) {
    reviews[band] = { right: Number(raw.right) || 0, wrong: Number(raw.wrong) || 0 };
  }
  /* The game layer arrived last of all, so every save that predates it — and
     every export taken from one — simply starts it from scratch. Review
     history is the part that cannot be regenerated; levels and streaks are
     read back off that history anyway. */
  return { scores: shaped.scores || {}, items, reviews, game: normaliseGame(shaped.game, Date.now()) };
}
