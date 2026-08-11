/* Spaced repetition, per item rather than per deck.
 *
 * Each item carries its own ease, so something you keep missing comes back
 * sooner forever, and something you never miss stretches out faster than a
 * fixed ladder would. */
import { sample } from "./text.js";

export const DAY = 864e5;

const EASE_START = 2.4;
const EASE_MIN = 1.3;
const EASE_MAX = 2.9;
/* The first gap matters more than any later one (Karpicke & Roediger, 2007),
   and the optimal gap is a fraction of the retention you want — roughly 20% at
   a few weeks, less further out (Cepeda et al., 2008). Against a target of
   months, 1 day was far too short. These assume study roughly three times a
   week, so 3 days lands on the next session and 8 on the third or fourth.
   See docs/learning-design.md before changing them. */
const FIRST_INTERVAL = 3; // days, after the first correct answer
const SECOND_INTERVAL = 8; // days, after the second

export function blank() {
  return { right: 0, wrong: 0, streak: 0, ease: EASE_START, interval: 0, due: 0, last: 0, lapses: 0 };
}

/* Days until this item should come back. A miss means today. */
function nextInterval(item, correct) {
  if (!correct) return 0;
  if (item.streak === 0) return FIRST_INTERVAL;
  if (item.streak === 1) return SECOND_INTERVAL;
  return Math.max(1, Math.round(item.interval * item.ease));
}

export function record(prev, correct, now) {
  const item = { ...blank(), ...(prev || {}) };
  const interval = nextInterval(item, correct);
  if (correct) {
    return {
      right: item.right + 1,
      wrong: item.wrong,
      streak: item.streak + 1,
      ease: Math.min(EASE_MAX, item.ease + 0.06),
      interval,
      due: now + interval * DAY,
      last: now,
      lapses: item.lapses,
    };
  }
  return {
    right: item.right,
    wrong: item.wrong + 1,
    streak: 0,
    ease: Math.max(EASE_MIN, item.ease - 0.22),
    interval: 0,
    due: now,
    last: now,
    lapses: item.lapses + 1,
  };
}

/* What the card will say after you answer, before the answer is stored. */
export function previewInterval(prev, correct) {
  return nextInterval({ ...blank(), ...(prev || {}) }, correct);
}

export const dueAt = (item) => (item && typeof item.due === "number" ? item.due : 0);
export const isDue = (item, now) => now >= dueAt(item);

/* How badly an item wants to be asked. Unseen items sit at a flat 3 so they
   mix in without crowding out everything that is actually overdue. */
function weight(item, now) {
  if (!item) return 3;
  const daysLate = (now - dueAt(item)) / DAY;
  if (daysLate < 0) return 0.35; // not due, but still possible
  const shaky = item.streak === 0 ? 9 : Math.max(2, 7 - item.streak);
  const hard = (EASE_START - item.ease) * 3;
  return shaky + Math.min(daysLate, 8) + Math.max(0, hard);
}

/* Builds one round: weighted sampling without replacement, but reserving
   room for new material so a big backlog never fully crowds it out. */
export function buildRound(cards, size, items, now) {
  const unseen = cards.filter((c) => !items[c.id]);
  const seen = cards.filter((c) => items[c.id]);
  const newRoom = Math.max(3, Math.ceil(size * 0.4));

  let pool = cards;
  if (seen.length >= size - newRoom && unseen.length > newRoom) {
    pool = [...seen, ...sample(unseen, newRoom)];
  }

  const weighted = pool.map((card) => ({ card, w: weight(items[card.id], now) }));
  const round = [];
  while (round.length < size && weighted.length > 0) {
    const total = weighted.reduce((sum, x) => sum + x.w, 0);
    let roll = Math.random() * total;
    let hit = weighted.length - 1;
    for (let i = 0; i < weighted.length; i++) {
      roll -= weighted[i].w;
      if (roll <= 0) { hit = i; break; }
    }
    round.push(weighted[hit].card);
    weighted.splice(hit, 1);
  }
  return round;
}

/* The counters on the Review tab. */
export function summarise(items, now, allIds, idSet) {
  const known = Object.entries(items)
    .filter(([id]) => idSet.has(id))
    .map(([, item]) => item);

  const due = known.filter((i) => isDue(i, now)).length;
  const nextDue = known
    .filter((i) => !isDue(i, now))
    .map(dueAt)
    .sort((a, b) => a - b)[0];

  return {
    seen: known.length,
    due,
    lapsed: known.filter((i) => i.streak === 0 && i.wrong > 0).length,
    mature: known.filter((i) => (i.interval || 0) >= 21).length,
    resting: known.length - due,
    unseen: allIds.length - known.length,
    total: allIds.length,
    nextDays: nextDue ? Math.max(1, Math.round((nextDue - now) / DAY)) : null,
  };
}
