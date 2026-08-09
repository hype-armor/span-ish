/* Subjunctive

   `triggers` is the lookup table: s:true forces the subjunctive.
   `sentences` give a real pair of forms to choose between — the wrong
   answer is always the other real form, never something ruled out on sight. */

window.MX = window.MX || {};

window.MX.subjunctiveTriggers = [
  { p: "ojalá que", s: true, m: "hopefully" },
  { p: "creo que", s: false, m: "I think that" },
  { p: "no creo que", s: true, m: "I don't think that" },
  { p: "es importante que", s: true, m: "it's important that" },
  { p: "es verdad que", s: false, m: "it's true that" },
  { p: "para que", s: true, m: "so that" },
  { p: "porque", s: false, m: "because" },
  { p: "antes de que", s: true, m: "before" },
  { p: "después de que (past event)", s: false, m: "after" },
  { p: "quiero que", s: true, m: "I want (someone) to" },
  { p: "sé que", s: false, m: "I know that" },
  { p: "espero que", s: true, m: "I hope that" },
  { p: "dudo que", s: true, m: "I doubt that" },
  { p: "es obvio que", s: false, m: "it's obvious that" },
  { p: "a menos que", s: true, m: "unless" },
  { p: "sin que", s: true, m: "without" },
  { p: "es posible que", s: true, m: "it's possible that" },
  { p: "cuando (still to happen)", s: true, m: "when" },
  { p: "cuando (routine or past)", s: false, m: "when" },
  { p: "me alegra que", s: true, m: "I'm glad that" },
  { p: "en caso de que", s: true, m: "in case" },
  { p: "ya que", s: false, m: "since, given that" }
];

window.MX.subjunctiveSentences = [
  {
    id: "espero",
    trig: "espero que",
    mood: "sub",
    sents: [
      { s: "Espero que ___ pronto.", ind: "viene", sub: "venga", t: "I hope he comes soon." },
      { s: "Espero que te ___ bien.", ind: "va", sub: "vaya", t: "I hope it goes well for you." }
    ]
  },
  {
    id: "creo",
    trig: "creo que",
    mood: "ind",
    sents: [
      { s: "Creo que ___ razón.", ind: "tienes", sub: "tengas", t: "I think you're right." },
      { s: "Creo que ___ en el cajón.", ind: "está", sub: "esté", t: "I think it's in the drawer." }
    ]
  },
  {
    id: "nocreo",
    trig: "no creo que",
    mood: "sub",
    sents: [
      { s: "No creo que ___ buena idea.", ind: "es", sub: "sea", t: "I don't think it's a good idea." },
      { s: "No creo que ___ hoy.", ind: "llega", sub: "llegue", t: "I don't think he's arriving today." }
    ]
  },
  {
    id: "ojala",
    trig: "ojalá que",
    mood: "sub",
    sents: [
      {
        s: "Ojalá que no ___ mañana.",
        ind: "llueve",
        sub: "llueva",
        t: "Hopefully it won't rain tomorrow."
      },
      { s: "Ojalá que ___ boletos.", ind: "hay", sub: "haya", t: "Hopefully there are tickets." }
    ]
  },
  {
    id: "se",
    trig: "sé que",
    mood: "ind",
    sents: [
      { s: "Sé que ___ en Guadalajara.", ind: "vives", sub: "vivas", t: "I know you live in Guadalajara." },
      { s: "Sé que ___ cansado.", ind: "estás", sub: "estés", t: "I know you're tired." }
    ]
  },
  {
    id: "quiero",
    trig: "quiero que",
    mood: "sub",
    sents: [
      { s: "Quiero que ___ conmigo.", ind: "vienes", sub: "vengas", t: "I want you to come with me." },
      {
        s: "Quiero que me ___ la verdad.",
        ind: "dices",
        sub: "digas",
        t: "I want you to tell me the truth."
      }
    ]
  },
  {
    id: "cuandofut",
    trig: "cuando (still to happen)",
    mood: "sub",
    sents: [
      {
        s: "Cuando ___ , me llamas.",
        ind: "llegas",
        sub: "llegues",
        t: "When you get there, call me — it hasn't happened yet."
      },
      { s: "Te aviso cuando ___ listo.", ind: "está", sub: "esté", t: "I'll let you know when it's ready." }
    ]
  },
  {
    id: "cuandohab",
    trig: "cuando (routine)",
    mood: "ind",
    sents: [
      {
        s: "Cuando ___ a casa, siempre ceno.",
        ind: "llego",
        sub: "llegue",
        t: "When I get home I always eat — a routine."
      },
      {
        s: "Cuando ___ café, no duermo.",
        ind: "tomo",
        sub: "tome",
        t: "When I drink coffee, I don't sleep."
      }
    ]
  },
  {
    id: "paraque",
    trig: "para que",
    mood: "sub",
    sents: [
      {
        s: "Te lo explico para que lo ___ .",
        ind: "entiendes",
        sub: "entiendas",
        t: "I'm explaining it so you understand it."
      },
      { s: "Lo hago para que ___ contenta.", ind: "está", sub: "esté", t: "I do it so she's happy." }
    ]
  },
  {
    id: "porque",
    trig: "porque",
    mood: "ind",
    sents: [
      {
        s: "No salgo porque ___ lloviendo.",
        ind: "está",
        sub: "esté",
        t: "I'm not going out because it's raining."
      },
      { s: "Como porque ___ hambre.", ind: "tengo", sub: "tenga", t: "I'm eating because I'm hungry." }
    ]
  },
  {
    id: "dudo",
    trig: "dudo que",
    mood: "sub",
    sents: [
      { s: "Dudo que ___ venir.", ind: "puede", sub: "pueda", t: "I doubt he can come." },
      { s: "Dudo que ___ abierto.", ind: "está", sub: "esté", t: "I doubt it's open." }
    ]
  },
  {
    id: "esverdad",
    trig: "es verdad que",
    mood: "ind",
    sents: [
      { s: "Es verdad que ___ mucho.", ind: "cuesta", sub: "cueste", t: "It's true that it costs a lot." },
      { s: "Es verdad que ___ lejos.", ind: "queda", sub: "quede", t: "It's true that it's far." }
    ]
  },
  {
    id: "antes",
    trig: "antes de que",
    mood: "sub",
    sents: [
      { s: "Hablamos antes de que te ___ .", ind: "vas", sub: "vayas", t: "Let's talk before you leave." },
      { s: "Cierra antes de que ___ frío.", ind: "hace", sub: "haga", t: "Close it before it gets cold." }
    ]
  },
  {
    id: "amenos",
    trig: "a menos que",
    mood: "sub",
    sents: [
      {
        s: "Voy, a menos que ___ que trabajar.",
        ind: "tengo",
        sub: "tenga",
        t: "I'll go, unless I have to work."
      },
      { s: "Salimos, a menos que ___ .", ind: "llueve", sub: "llueva", t: "We'll go out, unless it rains." }
    ]
  },
  {
    id: "esposible",
    trig: "es posible que",
    mood: "sub",
    sents: [
      { s: "Es posible que ___ tráfico.", ind: "hay", sub: "haya", t: "There might be traffic." },
      { s: "Es posible que no ___ .", ind: "viene", sub: "venga", t: "He might not come." }
    ]
  },
  {
    id: "mealegra",
    trig: "me alegra que",
    mood: "sub",
    sents: [
      { s: "Me alegra que ___ aquí.", ind: "estás", sub: "estés", t: "I'm glad you're here." },
      { s: "Me alegra que te ___ .", ind: "gusta", sub: "guste", t: "I'm glad you like it." }
    ]
  }
];
