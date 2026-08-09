/* Connectors and fillers

   The glue that makes speech sound native. `conf` picks the distractors,
   same as tenses. */

window.MX = window.MX || {};

window.MX.connectors = [
  {
    p: "este…",
    m: "um…",
    u: "The default Mexican filler. Not 'this' — pure stalling.",
    conf: ["pues / pos", "o sea"]
  },
  {
    p: "o sea",
    m: "I mean, that is",
    u: "Restating when the first attempt came out wrong.",
    conf: ["es que", "la neta"]
  },
  {
    p: "es que",
    m: "the thing is",
    u: "Opens an excuse or an explanation. Enormously common.",
    conf: ["o sea", "la neta"]
  },
  {
    p: "la neta",
    m: "honestly, the truth is",
    u: "Casual. 'La neta es que…' buys four words of thinking time.",
    conf: ["de hecho", "o sea"]
  },
  {
    p: "órale",
    m: "wow, alright, let's go",
    u: "Agreement, surprise or encouragement, depending on tone.",
    conf: ["ándale", "híjole"]
  },
  {
    p: "ándale",
    m: "that's it, go on",
    u: "Confirms someone got it right. Also 'hurry up'.",
    conf: ["órale", "sale"]
  },
  {
    p: "ahorita",
    m: "in a bit",
    u: "Elastic — anywhere from thirty seconds to never.",
    conf: ["nomás", "ni modo"]
  },
  {
    p: "pues / pos",
    m: "well",
    u: "Universal sentence starter, often clipped to 'pos'.",
    conf: ["este…", "entonces"]
  },
  {
    p: "nomás",
    m: "just, only",
    u: "Nomás quería preguntar — I just wanted to ask.",
    conf: ["ahorita", "ni modo"]
  },
  {
    p: "¿a poco?",
    m: "really? seriously?",
    u: "Mild disbelief. Very Mexican.",
    conf: ["¿mande?", "híjole"]
  },
  {
    p: "ni modo",
    m: "oh well",
    u: "Nothing to be done. Closes a topic gracefully.",
    conf: ["ahorita", "sale"]
  },
  { p: "sale", m: "deal, okay", u: "Seals a plan. Sale, nos vemos.", conf: ["ándale", "órale"] },
  {
    p: "¿mande?",
    m: "sorry? pardon?",
    u: "The Mexican reply when you didn't catch something.",
    conf: ["¿a poco?", "híjole"]
  },
  {
    p: "híjole",
    m: "geez, wow",
    u: "Reaction to bad or surprising news. Always safe.",
    conf: ["órale", "¿a poco?"]
  },
  { p: "de hecho", m: "in fact", u: "Adds weight to a correction.", conf: ["la neta", "entonces"] },
  { p: "entonces", m: "so, then", u: "Chains one thought to the next.", conf: ["pues / pos", "de hecho"] }
];
