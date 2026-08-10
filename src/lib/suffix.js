/* The Transformer tab's live converter: English word in, Spanish word out. */
import { suffixes } from "./content.js";

/* Spanish spells these sounds with fewer letters than English does. */
function respell(stem) {
  return stem
    .toLowerCase()
    .replace(/ph/g, "f")
    .replace(/th/g, "t")
    .replace(/qu([ao])/g, "c$1")
    .replace(/([bdfgmpst])\1/g, "$1");
}

export function convert(input) {
  const word = input.trim();
  if (!word) return null;

  const rule = suffixes.find((r) => r.re.test(word));
  if (!rule) return { ok: false, raw: word };

  const matched = word.match(rule.re);
  const stem = respell(word.slice(0, word.length - matched[0].length));

  /* Two rules cover a pair of endings each, so the tail depends on which
     half matched rather than on the rule's default. */
  let tail = rule.tail;
  if (/ence$/i.test(word)) tail = "encia";
  if (/ible$/i.test(word)) tail = "ible";

  return { ok: true, raw: word, stem, tail, rule };
}
