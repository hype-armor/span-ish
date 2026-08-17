/* Hand-written paradigms, for checking src/lib/conjugate.js against.
 *
 * Test data, so it lives here rather than in content/ — content/ is shipped to
 * the browser and hashed into the service worker's cache name, and a table
 * nobody reads has no business in either.
 *
 * Two verbs per class, all four tenses, every person: 120 cells, compared
 * exhaustively on every run rather than sampled. Person order is the repo's:
 * yo, tú, él/ella, nosotros, ellos.
 *
 * Be clear about what this proves. It checks the generator against what a
 * human wrote down — so it catches a mis-keyed row, a dropped accent, a stem
 * taken from the wrong place. It does NOT independently establish that these
 * verbs are regular, because the same judgement chose the verb and wrote the
 * table. That risk is handled by the mechanical exclusions in
 * tools/check-content.js and by keeping the lexicon to common, unambiguous
 * verbs.
 */
module.exports = {
  cantar: {
    present: ["canto", "cantas", "canta", "cantamos", "cantan"],
    preterite: ["canté", "cantaste", "cantó", "cantamos", "cantaron"],
    imperfect: ["cantaba", "cantabas", "cantaba", "cantábamos", "cantaban"],
    subjunctive: ["cante", "cantes", "cante", "cantemos", "canten"],
  },
  pintar: {
    present: ["pinto", "pintas", "pinta", "pintamos", "pintan"],
    preterite: ["pinté", "pintaste", "pintó", "pintamos", "pintaron"],
    imperfect: ["pintaba", "pintabas", "pintaba", "pintábamos", "pintaban"],
    subjunctive: ["pinte", "pintes", "pinte", "pintemos", "pinten"],
  },
  beber: {
    present: ["bebo", "bebes", "bebe", "bebemos", "beben"],
    preterite: ["bebí", "bebiste", "bebió", "bebimos", "bebieron"],
    imperfect: ["bebía", "bebías", "bebía", "bebíamos", "bebían"],
    subjunctive: ["beba", "bebas", "beba", "bebamos", "beban"],
  },
  vender: {
    present: ["vendo", "vendes", "vende", "vendemos", "venden"],
    preterite: ["vendí", "vendiste", "vendió", "vendimos", "vendieron"],
    imperfect: ["vendía", "vendías", "vendía", "vendíamos", "vendían"],
    subjunctive: ["venda", "vendas", "venda", "vendamos", "vendan"],
  },
  recibir: {
    present: ["recibo", "recibes", "recibe", "recibimos", "reciben"],
    preterite: ["recibí", "recibiste", "recibió", "recibimos", "recibieron"],
    imperfect: ["recibía", "recibías", "recibía", "recibíamos", "recibían"],
    subjunctive: ["reciba", "recibas", "reciba", "recibamos", "reciban"],
  },
  partir: {
    present: ["parto", "partes", "parte", "partimos", "parten"],
    preterite: ["partí", "partiste", "partió", "partimos", "partieron"],
    imperfect: ["partía", "partías", "partía", "partíamos", "partían"],
    subjunctive: ["parta", "partas", "parta", "partamos", "partan"],
  },
};
