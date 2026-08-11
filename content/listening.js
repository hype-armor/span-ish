/* Sentence dictation

   The single-word dictation in sound.js trains the letter-to-sound rules. This
   trains the thing those rules are for: hearing a sentence at speed, where
   words run into each other and nothing is separated for you. That is where
   comprehension actually fails, and no amount of word-level practice reaches it.

   Each sentence is chosen to carry at least one feature the Sound tab teaches —
   silent h, the j rasp, ll, ñ, the trilled rr, x, c before e or i — inside
   ordinary Mexican speech rather than a demonstration sentence.

   Graded like the word dictation: accents forgiven, ñ required, punctuation
   ignored. Typing a whole sentence with every accent correct would be a
   spelling test, and the point here is what you heard. */

window.MX = window.MX || {};

window.MX.sentenceDictation = [
  {
    s: "¿A qué hora llega el camión?",
    t: "What time does the bus get here?",
    hint: "ll is an English y, and camión is the bus in Mexico",
  },
  {
    s: "Hay mucha gente en la calle.",
    t: "There are a lot of people in the street.",
    hint: "Silent h, then g before e takes the rasp",
  },
  {
    s: "Mi hijo se llama Guillermo.",
    t: "My son is called Guillermo.",
    hint: "Silent h, ll twice, and gui where the u is doing nothing",
  },
  {
    s: "Todavía no hablo muy bien español.",
    t: "I still don't speak Spanish very well.",
    hint: "The h is silent and the ñ is not optional",
  },
  {
    s: "¿Me puede traer la cuenta, por favor?",
    t: "Could you bring me the check, please?",
    hint: "Runs together as one phrase — the usted form is the polite default",
  },
  {
    s: "El año pasado fuimos a Oaxaca.",
    t: "Last year we went to Oaxaca.",
    hint: "ñ, and the x of Oaxaca is an h",
  },
  {
    s: "Ya está lloviendo otra vez.",
    t: "It's raining again.",
    hint: "Ya está runs into one word, and v sounds like b",
  },
  {
    s: "Necesito cambiar dinero.",
    t: "I need to change some money.",
    hint: "c before e is s, never the th of Spain",
  },
  {
    s: "La señora del mercado siempre me da un descuento.",
    t: "The lady at the market always gives me a discount.",
    hint: "Long enough that you have to hold it — ñ in the second word",
  },
  {
    s: "Ahorita regreso, espérame tantito.",
    t: "I'll be right back, wait for me a moment.",
    hint: "Silent h, trilled rr, and two diminutives doing the softening",
  },
  {
    s: "¿Cuánto cuesta el kilo de jitomate?",
    t: "How much is a kilo of tomatoes?",
    hint: "The j is a rasped h, and jitomate is the Mexican word",
  },
  {
    s: "Hace mucho calor hoy, ¿verdad?",
    t: "It's very hot today, isn't it?",
    hint: "Two silent h's, and hace opens with a c that is not a k",
  },
  {
    s: "Mi carro no quiso arrancar esta mañana.",
    t: "My car wouldn't start this morning.",
    hint: "rr twice, ñ at the end, and quiso here means refused",
  },
  {
    s: "Nos vemos el jueves en la esquina.",
    t: "See you Thursday on the corner.",
    hint: "The j of jueves is the rasp again",
  },
];
