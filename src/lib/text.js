/* Comparing what the learner typed against what the card wanted. */

/* Accents are forgiving everywhere except dictation, where spelling is the
   whole exercise — so ñ survives `loose` but not `strict`. */
const fold = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u")
    .replace(/ü/g, "u")
    .replace(/[¿?¡!.,;:]/g, "")
    .replace(/\s+/g, " ");

export const loose = (s) => fold(s).replace(/ñ/g, "n");
export const strict = (s) => fold(s);

/* `answer` may be a list, in which case any of them counts. */
export function matches(given, answer, isStrict) {
  const norm = isStrict ? strict : loose;
  return (Array.isArray(answer) ? answer : [answer]).some((a) => norm(a) === norm(given));
}

export const shuffle = (list) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export const sample = (list, n) => shuffle(list).slice(0, n);
export const pick = (list) => list[Math.floor(Math.random() * list.length)];

/* Wrong answers for a multiple-choice card. An entry's `conf` names the
   options worth confusing it with; anything still missing is filled at
   random, so the drill never offers something you could rule out on sight. */
export function distractors(entry, all, keyOf, valueOf, count) {
  const named = (entry.conf || [])
    .map((name) => all.find((x) => keyOf(x) === name))
    .filter(Boolean)
    .map(valueOf);
  const out = [...new Set(named)].slice(0, count);
  if (out.length < count) {
    const rest = all.filter((x) => keyOf(x) !== keyOf(entry) && !out.includes(valueOf(x))).map(valueOf);
    out.push(...sample([...new Set(rest)], count - out.length));
  }
  return out;
}
