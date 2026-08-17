/* Probes: asking whether a rule transfers to a word you have never been shown.
 *
 * Everything else in the app is drawn from a frozen pool of authored cards, and
 * every number it reports is computed on cards already seen. That means a
 * learner who memorised the pairs and one who induced the rules produce
 * identical readings — the app cannot tell them apart, and neither can you.
 *
 * A probe closes that gap. It is a card built from a held-out item, answered
 * and graded and given its explanation like any other, whose result then goes
 * to a small aggregate while the item itself is thrown away. Four rules make it
 * a measurement rather than just more cards:
 *
 *   1. A probe never becomes a scheduled item. Probing is destructive — the act
 *      of asking spends the item — so a probe set that entered the schedule
 *      would be a memorised set within three sessions, which is the disease.
 *   2. A probe pays nothing: no XP, no goal, no streak, no mastery, no region
 *      fill. Nothing here may move a number, because a probe is by definition
 *      not the work the scheduler asked for. See docs/learning-design.md.
 *   3. A probe is never repeated. `asked` is both the cursor into the inventory
 *      and the denominator of the score, so the two cannot disagree.
 *   4. A probe says what it is. The learner is told the card does not count.
 *
 * The state is one small record per family — `{ suffix: { asked, right } }` —
 * bounded, and merged by taking the larger side so that merging twice changes
 * nothing, exactly as the review bands do.
 */
import { suffixes } from "./content.js";

/* Below this many answers a rate is noise, and reading transfer out of it would
   be worse than reading nothing. Mirrors MIN_REVIEWS_TO_READ. */
export const MIN_PROBES_TO_READ = 20;

export const PROBE_FAMILIES = [
  {
    id: "suffix",
    mod: "suffix",
    label: "Ending swaps",
    /* What the learner is asked to do, for the card's instruction line. */
    sub: "Type the Spanish — a word the app has never shown you",
  },
];

export const familyFor = (mod) => PROBE_FAMILIES.find((f) => f.mod === mod) || null;

/* A stable order, computed from the words themselves rather than drawn at
   random. Two things depend on it: the cursor has to mean the same position on
   every device and every build, and consecutive probes should not all come from
   the same rule — a hash interleaves them where a flat concat would not. */
function fingerprint(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function inventoryFor(familyId) {
  if (familyId !== "suffix") return [];
  const out = [];
  for (const rule of suffixes) {
    for (const [en, es] of rule.probe || []) {
      out.push({ en, es, rule, key: fingerprint(en) });
    }
  }
  return out.sort((a, b) => a.key - b.key || (a.en < b.en ? -1 : 1));
}

/* The next `n` items this device has not asked yet. Returns fewer — or none —
   when the family runs out, which is a real state the Lab reports rather than
   a reason to start recycling. */
export function drawProbes(familyId, probes, n) {
  if (n <= 0) return [];
  const asked = (probes && probes[familyId] && probes[familyId].asked) || 0;
  return inventoryFor(familyId).slice(asked, asked + n);
}

export function remainingFor(familyId, probes) {
  const asked = (probes && probes[familyId] && probes[familyId].asked) || 0;
  return Math.max(0, inventoryFor(familyId).length - asked);
}

/* Call once per probe answered. */
export function tallyProbe(probes, familyId, correct) {
  const at = (probes && probes[familyId]) || { asked: 0, right: 0 };
  return {
    ...probes,
    [familyId]: { asked: at.asked + 1, right: at.right + (correct ? 1 : 0) },
  };
}

/* Larger side wins, so merging the same export twice is a no-op. Summing would
   be more accurate across two devices that genuinely probed different items,
   but idempotence is worth more here than exactness — the same trade the review
   bands make. */
export function mergeProbes(mine = {}, theirs = {}) {
  const out = { ...mine };
  for (const [family, incoming] of Object.entries(theirs)) {
    const here = out[family] || { asked: 0, right: 0 };
    out[family] = {
      asked: Math.max(here.asked || 0, incoming.asked || 0),
      right: Math.max(here.right || 0, incoming.right || 0),
    };
  }
  return out;
}

/* A mission's results carry both kinds. Probe results must never reach the
   scheduler, the day's counters or the module tallies, so they are split out
   before any of that runs. */
export function partitionAnswers(results) {
  const answers = [];
  const probes = [];
  for (const result of results || []) (result.probe ? probes : answers).push(result);
  return { answers, probes };
}
