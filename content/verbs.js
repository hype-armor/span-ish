/* Verbs

   `irregular` powers the yo-form drill and the reference table.
   `sentences` are fill-in-the-blank items; one is picked at random per
   verb and person each session, so add as many as you like per entry. */

window.MX = window.MX || {};

window.MX.irregularVerbs = [
  { v: "ser", m: "to be (essence)", yo: "soy", g: "fully irregular", f: "soy, eres, es, somos, son" },
  {
    v: "estar",
    m: "to be (state, place)",
    yo: "estoy",
    g: "fully irregular",
    f: "estoy, estás, está, estamos, están"
  },
  { v: "ir", m: "to go", yo: "voy", g: "fully irregular", f: "voy, vas, va, vamos, van" },
  { v: "haber", m: "to have (auxiliary)", yo: "he", g: "fully irregular", f: "he, has, ha, hemos, han" },
  { v: "tener", m: "to have", yo: "tengo", g: "yo-go + e→ie", f: "tengo, tienes, tiene, tenemos, tienen" },
  { v: "hacer", m: "to do, to make", yo: "hago", g: "yo-go", f: "hago, haces, hace, hacemos, hacen" },
  { v: "decir", m: "to say", yo: "digo", g: "yo-go + e→i", f: "digo, dices, dice, decimos, dicen" },
  { v: "venir", m: "to come", yo: "vengo", g: "yo-go + e→ie", f: "vengo, vienes, viene, venimos, vienen" },
  { v: "poner", m: "to put", yo: "pongo", g: "yo-go", f: "pongo, pones, pone, ponemos, ponen" },
  { v: "salir", m: "to leave, to go out", yo: "salgo", g: "yo-go", f: "salgo, sales, sale, salimos, salen" },
  { v: "traer", m: "to bring", yo: "traigo", g: "yo-go", f: "traigo, traes, trae, traemos, traen" },
  { v: "oír", m: "to hear", yo: "oigo", g: "yo-go + spelling shift", f: "oigo, oyes, oye, oímos, oyen" },
  {
    v: "saber",
    m: "to know (facts)",
    yo: "sé",
    g: "irregular yo only",
    f: "sé, sabes, sabe, sabemos, saben"
  },
  {
    v: "conocer",
    m: "to know (people, places)",
    yo: "conozco",
    g: "-zco yo",
    f: "conozco, conoces, conoce, conocemos, conocen"
  },
  { v: "dar", m: "to give", yo: "doy", g: "irregular yo only", f: "doy, das, da, damos, dan" },
  { v: "ver", m: "to see", yo: "veo", g: "irregular yo only", f: "veo, ves, ve, vemos, ven" },
  { v: "poder", m: "to be able", yo: "puedo", g: "o→ue boot", f: "puedo, puedes, puede, podemos, pueden" },
  {
    v: "querer",
    m: "to want",
    yo: "quiero",
    g: "e→ie boot",
    f: "quiero, quieres, quiere, queremos, quieren"
  },
  {
    v: "pedir",
    m: "to ask for, to order",
    yo: "pido",
    g: "e→i boot",
    f: "pido, pides, pide, pedimos, piden"
  },
  {
    v: "dormir",
    m: "to sleep",
    yo: "duermo",
    g: "o→ue boot",
    f: "duermo, duermes, duerme, dormimos, duermen"
  },
  {
    v: "pensar",
    m: "to think",
    yo: "pienso",
    g: "e→ie boot",
    f: "pienso, piensas, piensa, pensamos, piensan"
  },
  {
    v: "volver",
    m: "to return",
    yo: "vuelvo",
    g: "o→ue boot",
    f: "vuelvo, vuelves, vuelve, volvemos, vuelven"
  },
  {
    v: "jugar",
    m: "to play",
    yo: "juego",
    g: "u→ue boot — the only one",
    f: "juego, juegas, juega, jugamos, juegan"
  },
  {
    v: "seguir",
    m: "to follow, to keep on",
    yo: "sigo",
    g: "e→i boot, u drops in yo",
    f: "sigo, sigues, sigue, seguimos, siguen"
  }
];

window.MX.verbSentences = [
  {
    v: "tener",
    p: "yo",
    a: "tengo",
    sents: [
      { s: "___ veintidós años.", t: "I'm twenty-two." },
      { s: "No ___ tiempo hoy.", t: "I don't have time today." },
      { s: "___ que checar mi correo.", t: "I have to check my email." }
    ]
  },
  {
    v: "tener",
    p: "nosotros",
    a: "tenemos",
    sents: [
      { s: "___ mucha tarea.", t: "We have a lot of homework." },
      { s: "___ que salir temprano.", t: "We have to leave early." },
      { s: "No ___ boletos todavía.", t: "We don't have tickets yet." }
    ]
  },
  {
    v: "querer",
    p: "tú",
    a: "quieres",
    sents: [
      { s: "¿___ un cafecito?", t: "Want a little coffee?" },
      { s: "¿Qué ___ comer?", t: "What do you want to eat?" },
      { s: "Si ___ , te acompaño.", t: "If you want, I'll go with you." }
    ]
  },
  {
    v: "poder",
    p: "yo",
    a: "puedo",
    sents: [
      { s: "No ___ ir hoy.", t: "I can't go today." },
      { s: "¿___ pasar?", t: "May I come in?" },
      { s: "Ya no ___ más.", t: "I can't take any more." }
    ]
  },
  {
    v: "ser",
    p: "yo",
    a: "soy",
    sents: [
      { s: "___ de Monterrey.", t: "I'm from Monterrey." },
      { s: "___ ingeniero.", t: "I'm an engineer." },
      { s: "No ___ de aquí.", t: "I'm not from around here." }
    ]
  },
  {
    v: "estar",
    p: "él / ella",
    a: "está",
    sents: [
      { s: "¿Dónde ___ el baño?", t: "Where's the bathroom?" },
      { s: "Mi mamá ___ enferma.", t: "My mom is sick." },
      { s: "El carro ___ en el estacionamiento.", t: "The car is in the parking lot." }
    ]
  },
  {
    v: "ir",
    p: "yo",
    a: "voy",
    sents: [
      { s: "___ al mercado ahorita.", t: "I'm going to the market in a bit." },
      { s: "___ a checarlo.", t: "I'm going to check it." },
      { s: "Mañana ___ a Oaxaca.", t: "Tomorrow I'm going to Oaxaca." }
    ]
  },
  {
    v: "hacer",
    p: "tú",
    a: "haces",
    sents: [
      { s: "¿Qué ___ este fin?", t: "What are you doing this weekend?" },
      { s: "¿A qué hora lo ___ ?", t: "What time do you do it?" },
      { s: "Nunca ___ la tarea.", t: "You never do the homework." }
    ]
  },
  {
    v: "venir",
    p: "ellos",
    a: "vienen",
    sents: [
      { s: "Mis papás ___ mañana.", t: "My parents are coming tomorrow." },
      { s: "¿___ en camión o en carro?", t: "Are they coming by bus or by car?" },
      { s: "Siempre ___ con hambre.", t: "They always show up hungry." }
    ]
  },
  {
    v: "decir",
    p: "yo",
    a: "digo",
    sents: [
      { s: "___ la neta.", t: "I'm telling the truth." },
      { s: "Te ___ que sí.", t: "I'm telling you yes." },
      { s: "No ___ nada.", t: "I'm not saying anything." }
    ]
  },
  {
    v: "salir",
    p: "yo",
    a: "salgo",
    sents: [
      { s: "___ del trabajo a las seis.", t: "I leave work at six." },
      { s: "Ya ___ , nomás agarro las llaves.", t: "I'm leaving now, just grabbing my keys." },
      { s: "Casi nunca ___ entre semana.", t: "I hardly ever go out on weekdays." }
    ]
  },
  {
    v: "saber",
    p: "yo",
    a: "sé",
    sents: [
      { s: "No ___ la respuesta.", t: "I don't know the answer." },
      { s: "___ que tienes razón.", t: "I know you're right." },
      { s: "No ___ manejar.", t: "I don't know how to drive." }
    ]
  },
  {
    v: "conocer",
    p: "tú",
    a: "conoces",
    sents: [
      { s: "¿___ a mi hermana?", t: "Do you know my sister?" },
      { s: "¿___ un buen lugar de tacos?", t: "Do you know a good taco place?" },
      { s: "No ___ la ciudad, ¿verdad?", t: "You don't know the city, right?" }
    ]
  },
  {
    v: "poner",
    p: "yo",
    a: "pongo",
    sents: [
      { s: "___ las llaves en la mesa.", t: "I put the keys on the table." },
      { s: "Me ___ la chamarra.", t: "I'm putting on my jacket." },
      { s: "___ música mientras trabajo.", t: "I put on music while I work." }
    ]
  },
  {
    v: "dormir",
    p: "ellos",
    a: "duermen",
    sents: [
      { s: "Los niños ___ ocho horas.", t: "The kids sleep eight hours." },
      { s: "___ con la ventana abierta.", t: "They sleep with the window open." },
      { s: "Nunca ___ en el camión.", t: "They never sleep on the bus." }
    ]
  },
  {
    v: "pensar",
    p: "yo",
    a: "pienso",
    sents: [
      { s: "___ que va a llover.", t: "I think it's going to rain." },
      { s: "___ ir a la alberca.", t: "I'm thinking of going to the pool." },
      { s: "No ___ igual que tú.", t: "I don't think the same way you do." }
    ]
  },
  {
    v: "volver",
    p: "tú",
    a: "vuelves",
    sents: [
      { s: "¿A qué hora ___ a casa?", t: "What time are you coming home?" },
      { s: "¿Cuándo ___ de Guadalajara?", t: "When are you back from Guadalajara?" },
      { s: "Siempre ___ tarde de la chamba.", t: "You always get back late from work." }
    ]
  },
  {
    v: "jugar",
    p: "ella",
    a: "juega",
    sents: [
      { s: "Ella ___ fútbol los sábados.", t: "She plays soccer on Saturdays." },
      { s: "Mi hija ___ en el parque.", t: "My daughter plays in the park." },
      { s: "___ muy bien.", t: "She plays very well." }
    ]
  },
  {
    v: "pedir",
    p: "yo",
    a: "pido",
    sents: [
      { s: "___ un taco al pastor, por favor.", t: "I'll have a taco al pastor, please." },
      { s: "Siempre ___ lo mismo.", t: "I always order the same thing." },
      { s: "Te ___ un favor.", t: "I'm asking you a favor." }
    ]
  },
  {
    v: "oír",
    p: "tú",
    a: "oyes",
    sents: [
      { s: "¿Me ___ , o hablo más despacio?", t: "Can you hear me, or should I slow down?" },
      { s: "¿___ ese ruido?", t: "Do you hear that noise?" },
      { s: "No me ___ nada.", t: "You can't hear me at all." }
    ]
  },
  {
    v: "traer",
    p: "yo",
    a: "traigo",
    sents: [
      { s: "Te ___ un regalo de Oaxaca.", t: "I'm bringing you a gift from Oaxaca." },
      { s: "___ el celular en la bolsa.", t: "I've got my phone in my bag." },
      { s: "No ___ dinero.", t: "I don't have cash on me." }
    ]
  },
  {
    v: "ver",
    p: "yo",
    a: "veo",
    sents: [
      { s: "No ___ bien sin lentes.", t: "I don't see well without glasses." },
      { s: "___ la tele en la noche.", t: "I watch TV at night." },
      { s: "Ya ___ , tienes razón.", t: "I see now — you're right." }
    ]
  },
  {
    v: "dar",
    p: "yo",
    a: "doy",
    sents: [
      { s: "Le ___ las gracias.", t: "I thank him." },
      { s: "Te ___ mi número.", t: "I'll give you my number." },
      { s: "___ clases los martes.", t: "I teach on Tuesdays." }
    ]
  },
  {
    v: "seguir",
    p: "yo",
    a: "sigo",
    sents: [
      { s: "___ las instrucciones.", t: "I follow the instructions." },
      { s: "___ trabajando aquí.", t: "I still work here." },
      { s: "___ sin entender.", t: "I still don't get it." }
    ]
  }
];
