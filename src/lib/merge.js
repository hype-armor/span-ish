/* Merging two review histories.
 *
 * Once the app is installed on more than one device, each one keeps its own
 * history and they drift apart. Replacing one with the other throws away
 * whichever side you did not export, so restore can merge instead.
 *
 * The rule for an item both sides know: the more recent review wins, because
 * it is the freshest evidence about that memory — including when it is a
 * lapse. Cumulative counters take the larger of the two so totals never go
 * backwards, and a side that has never seen the item contributes nothing. */

function mergeItem(mine, theirs) {
  if (!mine) return theirs;
  if (!theirs) return mine;

  const newer = (theirs.last || 0) > (mine.last || 0) ? theirs : mine;

  return {
    ...newer,
    right: Math.max(mine.right || 0, theirs.right || 0),
    wrong: Math.max(mine.wrong || 0, theirs.wrong || 0),
    lapses: Math.max(mine.lapses || 0, theirs.lapses || 0),
  };
}

/* Per-module tallies: keep whichever side has done more rounds, but the best
   score is a high-water mark and belongs to neither device in particular. */
function mergeScore(mine, theirs) {
  if (!mine) return theirs;
  if (!theirs) return mine;
  const fuller = (theirs.total || 0) > (mine.total || 0) ? theirs : mine;
  return { ...fuller, best: Math.max(mine.best || 0, theirs.best || 0) };
}

export function mergeProgress(mine, theirs) {
  const items = { ...mine.items };
  let added = 0;
  let updated = 0;

  for (const [id, incoming] of Object.entries(theirs.items || {})) {
    if (!items[id]) added++;
    else updated++;
    items[id] = mergeItem(items[id], incoming);
  }

  const scores = { ...mine.scores };
  for (const [mod, incoming] of Object.entries(theirs.scores || {})) {
    scores[mod] = mergeScore(scores[mod], incoming);
  }

  return { progress: { scores, items }, added, updated };
}
