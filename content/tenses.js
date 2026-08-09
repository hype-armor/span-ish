/* Periphrasis

   Verb + preposition + infinitive patterns that stand in for whole tenses.
   `conf` names the patterns worth confusing this one with — they become
   the wrong answers, so the drill never offers an obviously silly option. */

window.MX = window.MX || {};

window.MX.periphrasis = [
  {
    p: "ir a + infinitive",
    m: "going to / will",
    ex: "Voy a comer.",
    t: "I'm going to eat.",
    note: "Replaces the whole future tense, and Mexicans prefer it anyway.",
    conf: ["acabar de + infinitive", "volver a + infinitive"]
  },
  {
    p: "acabar de + infinitive",
    m: "to have just",
    ex: "Acabo de llegar.",
    t: "I just got here.",
    note: "Covers the recent past without touching the perfect tense.",
    conf: ["ir a + infinitive", "dejar de + infinitive"]
  },
  {
    p: "estar + gerund",
    m: "to be —ing",
    ex: "Estoy comiendo.",
    t: "I'm eating.",
    note: "Gerund: -ar → -ando, -er / -ir → -iendo.",
    conf: ["andar + gerund", "llevar + time + gerund"]
  },
  {
    p: "tener que + infinitive",
    m: "to have to",
    ex: "Tengo que salir.",
    t: "I have to leave.",
    note: "Personal obligation, and far more common than deber in Mexico.",
    conf: ["hay que + infinitive", "dejar de + infinitive"]
  },
  {
    p: "hay que + infinitive",
    m: "one must",
    ex: "Hay que estudiar.",
    t: "One has to study.",
    note: "Impersonal — no subject needed at all.",
    conf: ["tener que + infinitive", "soler + infinitive"]
  },
  {
    p: "soler + infinitive",
    m: "to usually",
    ex: "Suelo caminar.",
    t: "I usually walk.",
    note: "Mexicans often reach for 'acostumbro caminar' instead.",
    conf: ["llevar + time + gerund", "volver a + infinitive"]
  },
  {
    p: "volver a + infinitive",
    m: "to do again",
    ex: "Vuelvo a leerlo.",
    t: "I'm reading it again.",
    note: "Spanish packs 'again' into the verb.",
    conf: ["ir a + infinitive", "soler + infinitive"]
  },
  {
    p: "llevar + time + gerund",
    m: "to have been —ing",
    ex: "Llevo dos años estudiando.",
    t: "I've been studying two years.",
    note: "Sidesteps the perfect progressive completely.",
    conf: ["estar + gerund", "andar + gerund"]
  },
  {
    p: "dejar de + infinitive",
    m: "to stop —ing",
    ex: "Dejé de fumar.",
    t: "I stopped smoking.",
    note: "Pairs with empezar a (start) and seguir + gerund (keep on).",
    conf: ["acabar de + infinitive", "tener que + infinitive"]
  },
  {
    p: "andar + gerund",
    m: "to be going around —ing",
    ex: "Ando buscando casa.",
    t: "I'm out looking for a house.",
    note: "Very Mexican. Adds a wandering, unsettled feel.",
    conf: ["estar + gerund", "llevar + time + gerund"]
  }
];
