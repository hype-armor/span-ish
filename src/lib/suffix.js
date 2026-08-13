/* The Transformer tab's live converter: English word in, Spanish word out. */
import { suffixes } from "./content.js";

/* Spanish spells these sounds with fewer letters than English does. */
function respell(stem) {
  return stem
    .toLowerCase()
    .replace(/ph/g, "f")
    .replace(/th/g, "t")
    .replace(/qu([ao])/g, "c$1")
    .replace(/ou/g, "u")
    .replace(/([bdfgmpst])\1/g, "$1");
}

/* -mente attaches to the feminine adjective, not to the bare stem: rápida +
   mente, exacta + mente. Adjectives with no separate feminine take it directly
   — normal + mente, constante + mente — so which vowel to insert, if any,
   depends on how the adjective ends. */
function menteTail(stem) {
  const base = stem.replace(/e$/, ""); // English silent e: absolute → absolut
  if (/nt$/.test(base)) return [base, "emente"]; // constante, importante
  if (/[lrz]$/.test(base)) return [base, "mente"]; // normal, mayor, feliz
  return [base, "amente"]; // rápida, exacta, absoluta
}

export function convert(input) {
  const word = input.trim();
  if (!word) return null;

  const rule = suffixes.find((r) => r.re.test(word));
  if (!rule) return { ok: false, raw: word };

  const matched = word.match(rule.re);
  let stem = respell(word.slice(0, word.length - matched[0].length));

  /* Two rules cover a pair of endings each, so the tail depends on which
     half matched rather than on the rule's default. */
  let tail = rule.tail;
  if (/ence$/i.test(word)) tail = "encia";
  if (/ible$/i.test(word)) tail = "ible";
  if (rule.en === "-ly") [stem, tail] = menteTail(stem);

  return { ok: true, raw: word, stem, tail, rule };
}
