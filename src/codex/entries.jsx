import React, { useState, useMemo } from "../react.js";
import { Table, Speak, Lede, Head, Cards, Card } from "../components/bits.jsx";
import { convert } from "../lib/suffix.js";
import {
  suffixes, converterExamples, genderEndings, genderExceptionTable,
  ruleVerbForms, ruleVerbEndings, ruleSubjunctiveForms, ruleAccents,
  vowels, consonants, xSounds, stressRules,
  irregularVerbs, preteriteStems, imperfectEndings, imperfectIrregular, aspectCues,
  periphrasis, subjunctiveTriggers, imperfectSubjunctiveEndings,
  imperfectSubjunctiveUses, imperfectSubjunctiveRegular,
  mexicanismos, diminutives, connectors,
} from "../lib/content.js";

/* The codex: everything the old tabs explained, with nothing dropped.
 *
 * Each region's reference material is broken into entries, and an entry taller
 * than the screen scrolls. This is the half of the app that is read rather
 * than answered, and reading is what scrolling is for.
 *
 * These exist to be read once. Nothing here is a retrieval attempt and nothing
 * here is scheduled; the missions are where the learning happens. Keeping the
 * two apart is the whole reason the reference is a place you visit rather than
 * something that scrolls past above a drill.
 */

/* The imperfect subjunctive is derived rather than restated, so the strong
   stems can never drift out of step with content/preterite.js. */
const derived = () =>
  preteriteStems.map((v) => {
    const ellos = v.f.split(",")[4].trim();
    return { v: v.v, ellos, a: ellos.replace(/ron$/, "") + "ra" };
  });

/* ---------- La Fragua's live converter ---------- */

function Converter() {
  const [word, setWord] = useState("information");
  const result = useMemo(() => convert(word), [word]);

  return (
    <div className="machine">
      <p className="machine-label">Live conversion</p>
      <input
        value={word}
        onChange={(e) => setWord(e.target.value)}
        spellCheck="false"
        autoComplete="off"
        aria-label="English word to convert"
        placeholder="Type an English word…"
      />
      <div className="out">
        {result && result.ok ? (
          <>
            <span className="stem">{result.stem}</span>
            {/* keyed on the text so the tail re-animates when it changes */}
            <span className="tail" key={result.tail + result.stem}>{result.tail}</span>
          </>
        ) : (
          <span className="out-empty">
            {result ? "No rule matches that ending — try one below." : "Waiting for a word."}
          </span>
        )}
      </div>
      {result && result.ok && (
        <p className="machine-note">
          <b>{result.rule.en} → {result.rule.es}</b> · {result.rule.note} Written accents follow the
          stress rule, so the machine leaves them off — that is El Oído's business.
        </p>
      )}
      <div className="chips">
        {converterExamples.map((example) => (
          <button key={example} className="chip chip-d" onClick={() => setWord(example)}>{example}</button>
        ))}
      </div>
    </div>
  );
}

/* ---------- El Subjuntivo's trigger list, filtered ---------- */

const FILTERS = [
  ["all", "Everything"],
  ["sub", "Forces subjunctive"],
  ["ind", "Stays indicative"],
];

function Triggers() {
  const [filter, setFilter] = useState("all");
  const shown = subjunctiveTriggers.filter((t) =>
    filter === "all" ? true : filter === "sub" ? t.s : !t.s,
  );

  return (
    <>
      <div className="chips" style={{ marginBottom: 14 }}>
        {FILTERS.map(([id, label]) => (
          <button key={id} className={"chip" + (filter === id ? " on" : "")} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>
      <Table head={["Trigger", "Means", "What follows"]}>
        {shown.map((t) => (
          <tr key={t.p}>
            <td className="key">{t.p}</td>
            <td className="dim">{t.m}</td>
            <td>
              <span className={"pill " + (t.s ? "pill-acc" : "pill-good")}>
                {t.s ? "Subjunctive" : "Indicative"}
              </span>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}

/* ---------- the entries ---------- */

export const CODEX = {
  rules: [
    {
      id: "why",
      title: "Why rules first",
      Body: () => (
        <>
          <Lede>
            Every other region asks you to produce Spanish, which means recalling a rule and applying
            it in the same breath. This one drills the rules by themselves — the ending maps, the
            gender table, the verb paradigms, the subjunctive recipe — so that by the time you are
            filling in a sentence, the rule is already free and your attention can go to the sentence.
          </Lede>
          <Head>The suffix map, ending to ending</Head>
          <Table head={["English", "Spanish", "Example"]}>
            {suffixes.map((r) => (
              <tr key={r.en}>
                <td className="mono term">{r.en}</td>
                <td className="key">{r.es}</td>
                <td className="dim">{r.ex[0][1]}</td>
              </tr>
            ))}
          </Table>
        </>
      ),
    },
    {
      id: "gender",
      title: "Gender by ending",
      Body: () => (
        <Table head={["Ending", "Article", "Example"]}>
          {genderEndings.map((r) => (
            <tr key={r.end}>
              <td className="mono term">{r.end}</td>
              <td className="key">{r.g === "f" ? "la" : "el"}</td>
              <td className="dim">{r.ex}</td>
            </tr>
          ))}
        </Table>
      ),
    },
    {
      id: "endings",
      title: "Endings worth knowing cold",
      Body: () => (
        <Table head={["Form", "Endings"]}>
          {[...ruleVerbForms, ...ruleVerbEndings].map((r) => (
            <tr key={r.q}>
              <td className="term">{r.q}</td>
              <td className="key mono">{r.a}</td>
            </tr>
          ))}
        </Table>
      ),
    },
    {
      id: "subjunctive",
      title: "Building the present subjunctive",
      Body: ({ speak }) => (
        <>
          <Lede>
            One recipe covers nearly everything: take the yo form, drop the -o, flip the vowel — -ar
            verbs take e, -er and -ir verbs take a. Whatever irregularity the yo form carries comes
            along for free. Six verbs refuse the recipe outright, and those are the ones to memorize.
          </Lede>
          <Table head={["Verb", "Subjunctive", "Why"]}>
            {ruleSubjunctiveForms.map((r) => (
              <tr key={r.v}>
                <td className="mono term">{r.v}</td>
                <td className="key">
                  <span className="row-flex">{r.a}<Speak text={r.a} speak={speak} /></span>
                </td>
                <td className="dim">{r.irr ? "Irregular — memorize. " : ""}{r.why}</td>
              </tr>
            ))}
          </Table>
        </>
      ),
    },
    {
      id: "accents",
      title: "When the accent gets written",
      Body: () => (
        <>
          <Table head={["Words", "Why the accent"]}>
            {ruleAccents.map((r) => (
              <tr key={r.q}>
                <td className="key">{r.q}</td>
                <td className="dim">{r.a}. {r.why}</td>
              </tr>
            ))}
          </Table>
          <Lede style={{ marginTop: 18 }}>
            The stress rules in El Oído tell you where a word is stressed. These tell you when that
            stress has to be written down — the accent is never decoration, it is always correcting a
            default.
          </Lede>
        </>
      ),
    },
  ],

  suffix: [
    {
      id: "machine",
      title: "The converter",
      Body: () => (
        <>
          <Lede>
            Both languages pulled the same words out of Latin, so thousands of them are cognates.
            Fifteen ending swaps turn English words you already own into Spanish you never studied.
            Type anything that ends in one of them.
          </Lede>
          <Converter />
        </>
      ),
    },
    {
      id: "table",
      title: "The full table",
      Body: () => (
        <Table head={["English", "Spanish", "Example", "Watch for"]}>
          {suffixes.map((r) => (
            <tr key={r.en}>
              <td className="mono term">{r.en}</td>
              <td className="key">{r.es}</td>
              <td className="dim">{r.ex[0][0]} → {r.ex[0][1]}</td>
              <td className="dim">{r.note}</td>
            </tr>
          ))}
        </Table>
      ),
    },
    {
      id: "false",
      title: "False friends",
      Body: () => (
        <Lede>
          A handful of these cognates lie. <em>Embarazada</em> is pregnant, not embarrassed;
          <em> éxito</em> is success, not exit; <em>constipado</em> means you have a head cold. And in
          Mexico, <em>molestar</em> only ever means to bother.
        </Lede>
      ),
    },
  ],

  sound: [
    {
      id: "vowels",
      title: "The five vowels",
      Body: ({ speak }) => (
        <>
          <Lede>
            Spanish spelling is fully phonetic: five vowel sounds, no reduction, no schwa, no silent
            endings. The drills run both directions — rules about letters, and dictation where audio
            plays and you write it down.
          </Lede>
          <Cards cols={3}>
            {vowels.map((v) => (
              <Card className="lift" key={v.l}>
                <div className="row-flex" style={{ justifyContent: "space-between" }}>
                  <span className="row-flex" style={{ gap: 10 }}>
                    <span className="mono vowel-letter">{v.l}</span>
                    <span className="pill pill-acc">{v.s}</span>
                  </span>
                  <Speak text={v.w} speak={speak} label={"Play " + v.w} />
                </div>
                <div className="card-v">{v.g}</div>
                <div className="card-x mono">{v.w}</div>
              </Card>
            ))}
          </Cards>
        </>
      ),
    },
    {
      id: "consonants",
      title: "The consonants that differ",
      Body: ({ speak }) => (
        <Table head={["Letter", "Sound in Mexico", "Hear it"]}>
          {consonants.map((c) => (
            <tr key={c.l}>
              <td className="key" style={{ fontSize: 15 }}>{c.l}</td>
              <td>{c.r}</td>
              <td className="dim">
                <span className="row-flex">{c.w}<Speak text={c.w} speak={speak} /></span>
              </td>
            </tr>
          ))}
        </Table>
      ),
    },
    {
      id: "x",
      title: "The letter x",
      Body: ({ speak }) => (
        <>
          <Lede>
            Old Spanish spelled a sh sound with x. In most words that sound later hardened into the j
            rasp, but the spelling never caught up — hence México. Indigenous place names went their
            own way, some keeping the sh and some softening to s.
          </Lede>
          <Cards cols={2}>
            {xSounds.map((x) => (
              <Card className="lift" key={x.s}>
                <div className="row-flex" style={{ justifyContent: "space-between" }}>
                  <span className="card-k mono" style={{ fontSize: 14 }}>{x.w}</span>
                  <span className="row-flex">
                    <span className="pill pill-acc">{x.s}</span>
                    <Speak text={x.ex} speak={speak} label={"Play " + x.ex} />
                  </span>
                </div>
                <div className="card-v">{x.n}</div>
              </Card>
            ))}
          </Cards>
        </>
      ),
    },
    {
      id: "stress",
      title: "Stress is three lines",
      Body: () => (
        <Cards cols={3}>
          {stressRules.map((r) => (
            <Card className="lift" key={r.cond}>
              <div className="card-k" style={{ fontSize: 13.5 }}>{r.cond}</div>
              <div className="card-v">{r.rule}</div>
              <div className="card-x mono">{r.ex}</div>
            </Card>
          ))}
        </Cards>
      ),
    },
  ],

  verbs: [
    {
      id: "groups",
      title: "Three groups and four rogues",
      Body: () => (
        <>
          <Lede>
            Three ending tables cover every regular verb, and the irregulars are a closed set about
            this size. Nothing new joins it — verbs entering Spanish today are always regular -ar:
            googlear, tuitear, chatear.
          </Lede>
          <Cards cols={3}>
            <Card className="lift">
              <div className="card-k">yo-go group</div>
              <div className="card-v">
                Irregular in the yo form only; the rest of the conjugation is regular. tener → tengo,
                poner → pongo, salir → salgo.
              </div>
            </Card>
            <Card className="lift">
              <div className="card-k">boot changers</div>
              <div className="card-v">
                The stem vowel shifts in every form except nosotros. Draw the grid and the shaded
                cells look like a boot.
              </div>
            </Card>
            <Card className="lift">
              <div className="card-k">the untameable four</div>
              <div className="card-v">
                ser, estar, ir, haber. No pattern at all — and the four you will use most, so
                memorize them outright.
              </div>
            </Card>
          </Cards>
          <Card className="edge" style={{ marginTop: 10 }}>
            <div className="card-k">Mexico deletes a column</div>
            <div className="card-v">
              Vosotros does not exist here. The plural "you" is always <b>ustedes</b>, formal or not,
              and it conjugates like ellos. Every table below has five forms instead of six, and you
              can ignore the vosotros column in any textbook you pick up.
            </div>
          </Card>
        </>
      ),
    },
    {
      id: "closed",
      title: "The closed set",
      Body: ({ speak }) => (
        <Table head={["Verb", "Meaning", "Yo", "Pattern"]}>
          {irregularVerbs.map((v) => (
            <tr key={v.v}>
              <td className="key">
                <span className="row-flex">{v.v}<Speak text={v.f} speak={speak} label={"Play " + v.v} /></span>
              </td>
              <td className="dim">{v.m}</td>
              <td className="mono term accent">{v.yo}</td>
              <td className="dim">{v.g}</td>
            </tr>
          ))}
        </Table>
      ),
    },
  ],

  past: [
    {
      id: "preterite",
      title: "One past does most of the work",
      Body: () => (
        <>
          <Lede>
            Mexico reaches for the simple past where Spain would use the present perfect — <em>ya
            comí</em>, not <em>ya he comido</em> — so this is the past tense you actually hear.
            Regular verbs follow the two ending tables in Los Cimientos. The irregulars are a closed
            set of about fifteen, and they are irregular together rather than each in its own way.
          </Lede>
          <Cards cols={3}>
            <Card className="lift">
              <div className="card-k">one set of endings</div>
              <div className="card-v">-e, -iste, -o, -imos, -ieron for every verb below, whatever its infinitive ends in.</div>
            </Card>
            <Card className="lift">
              <div className="card-k">no written accents</div>
              <div className="card-v">
                tuve and tuvo, against regular hablé and habló. The stress moves back a syllable, so
                the accent has nothing to correct.
              </div>
            </Card>
            <Card className="lift">
              <div className="card-k">only the stem changes</div>
              <div className="card-v">Learn tuv-, pus-, dij- and the endings come free. That is the whole trick.</div>
            </Card>
          </Cards>
          <Card className="edge" style={{ marginTop: 10 }}>
            <div className="card-k">Two wrinkles worth knowing</div>
            <div className="card-v">
              A stem ending in <b>j</b> swallows the i in the ellos form: <b>dijeron</b>, not
              dijieron. And <b>ser</b> and <b>ir</b> share one set of forms outright — <em>fue un buen
              día</em> and <em>fue al mercado</em> are the same word doing two jobs.
            </div>
          </Card>
        </>
      ),
    },
    {
      id: "strong",
      title: "The strong preterites",
      Body: ({ speak }) => (
        <Table head={["Verb", "Stem", "Forms", "Note"]}>
          {preteriteStems.map((v) => (
            <tr key={v.v}>
              <td className="key">
                <span className="row-flex">{v.v}<Speak text={v.f} speak={speak} label={"Play " + v.v} /></span>
              </td>
              <td className="mono term accent">{v.stem}</td>
              <td className="dim mono small">{v.f}</td>
              <td className="dim">{v.n}</td>
            </tr>
          ))}
        </Table>
      ),
    },
    {
      id: "imperfect",
      title: "The other past tense",
      Body: () => (
        <>
          <Lede>
            The imperfect is the easiest tense in the language to form: two sets of endings and
            exactly three irregular verbs. Choosing between it and the preterite is the part worth
            practising, and it has nothing to do with how long ago something happened.
          </Lede>
          <Table head={["Verbs", "Endings", "Example"]}>
            {imperfectEndings.map((e) => (
              <tr key={e.kind}>
                <td className="term">{e.kind}</td>
                <td className="key mono">{e.e}</td>
                <td className="dim mono small">{e.ex}</td>
              </tr>
            ))}
          </Table>
          <Head>Every irregular verb in the tense</Head>
          <Cards cols={3}>
            {imperfectIrregular.map((v) => (
              <Card className="lift" key={v.v}>
                <div className="card-k mono primary">{v.v}</div>
                <div className="card-x mono">{v.f}</div>
                <div className="card-v">{v.n}</div>
              </Card>
            ))}
          </Cards>
        </>
      ),
    },
    {
      id: "choosing",
      title: "Which one, and why",
      Body: () => (
        <>
          <Lede>
            The preterite reports an event: it happened, it finished, you can count it. The imperfect
            describes the world the event happened in — what was going on, what used to be true, what
            time it was. Most sentences with both are the same shape: the imperfect sets the scene and
            the preterite interrupts it. <em>Cocinaba cuando alguien tocó la puerta.</em>
          </Lede>
          <Table head={["If you see", "Reach for", "Because"]}>
            {aspectCues.map((c) => (
              <tr key={c.cue}>
                <td className="key">{c.cue}</td>
                <td>
                  <span className={"pill " + (c.side === "pret" ? "pill-acc" : "pill-good")}>
                    {c.side === "pret" ? "Preterite" : "Imperfect"}
                  </span>
                </td>
                <td className="dim">{c.n}</td>
              </tr>
            ))}
          </Table>
          <Lede style={{ marginTop: 18 }}>
            Four verbs change meaning rather than just tense. <em>Supe</em> is found out where <em>sabía</em> is
            knew; <em>conocí</em> is met where <em>conocía</em> is knew of; <em>quiso</em> is tried to
            and <em>no quiso</em> is refused; <em>pude</em> is managed to.
          </Lede>
        </>
      ),
    },
  ],

  periphrasis: [
    {
      id: "patterns",
      title: "Ten patterns",
      Body: ({ speak }) => (
        <>
          <Lede>
            A helper verb plus an infinitive says what English needs a whole separate tense for. These
            are not beginner crutches — Mexican speakers reach for them first. A bonus: Mexico prefers
            the simple past over the present perfect, so <em>ya comí</em> covers what Spain would say
            with <em>ya he comido</em>.
          </Lede>
          <Table head={["Pattern", "Means", "Example", "Note"]}>
            {periphrasis.map((p) => (
              <tr key={p.p}>
                <td className="key">{p.p}</td>
                <td className="dim">{p.m}</td>
                <td>
                  <span className="row-flex">
                    <span className="mono small">{p.ex}</span>
                    <Speak text={p.ex} speak={speak} />
                  </span>
                  <span className="gloss-t">{p.t}</span>
                </td>
                <td className="dim">{p.note}</td>
              </tr>
            ))}
          </Table>
        </>
      ),
    },
  ],

  subjunctive: [
    {
      id: "triggers",
      title: "Match the phrase",
      Body: () => (
        <>
          <Lede>
            Textbooks explain the subjunctive as doubt, emotion and unreality — true, and useless
            mid-sentence. In practice a fixed set of phrases forces it and everything else does not.
            Treat it as a lookup, and let the underlying logic arrive later.
          </Lede>
          <Triggers />
        </>
      ),
    },
    {
      id: "logic",
      title: "The logic underneath",
      Body: () => (
        <Lede>
          Once you want it: asserting something real takes the indicative, while wanting, doubting or
          projecting forward takes the subjunctive. Notice how <em>creo que</em> and <em>no creo que</em> flip
          on exactly that line — and that a drill's wrong answer is always the other real form, never
          something you could rule out on sight.
        </Lede>
      ),
    },
    {
      id: "past",
      title: "Once the sentence is in the past",
      Body: () => (
        <>
          <Lede>
            Everything above is the present subjunctive. Move the main verb into the past and the
            subjunctive has to follow: <em>quiero que vengas</em> becomes <em>quería que
            vinieras</em>. The trigger list does not change — only the form does.
          </Lede>
          <Card className="edge">
            <div className="card-k">You already know how to build it</div>
            <div className="card-v">
              The present subjunctive comes from the yo present. This one comes from the <b>ellos
              preterite</b>: drop <b>-ron</b>, add <b>-ra</b>. Every irregularity carries over for
              free, so the fifteen strong preterites in El Pasado are the fifteen imperfect
              subjunctives — there is no second list to learn.
            </div>
          </Card>
          <Table head={["Endings", "Example", "Note"]}>
            {imperfectSubjunctiveEndings.map((e) => (
              <tr key={e.set}>
                <td className="mono term">{e.set}</td>
                <td className="dim mono small">{e.ex}</td>
                <td className="dim">{e.n}</td>
              </tr>
            ))}
          </Table>
        </>
      ),
    },
    {
      id: "recipe",
      title: "The recipe, worked through",
      Body: ({ speak }) => (
        <Table head={["Verb", "Ellos preterite", "Imperfect subjunctive"]}>
          {[...imperfectSubjunctiveRegular, ...derived()].map((v) => (
            <tr key={v.v}>
              <td className="key">{v.v}</td>
              <td className="dim mono">{v.ellos}</td>
              <td className="mono term accent">
                <span className="row-flex">{v.a}<Speak text={v.a} speak={speak} /></span>
              </td>
            </tr>
          ))}
        </Table>
      ),
    },
    {
      id: "uses",
      title: "Where it turns up",
      Body: ({ speak }) => (
        <>
          <Table head={["Situation", "Example", "Why"]}>
            {imperfectSubjunctiveUses.map((u) => (
              <tr key={u.use}>
                <td className="key">{u.use}</td>
                <td>
                  <span className="row-flex">
                    <span className="mono small">{u.ex}</span>
                    <Speak text={u.ex} speak={speak} />
                  </span>
                  <span className="gloss-t">{u.t}</span>
                </td>
                <td className="dim">{u.n}</td>
              </tr>
            ))}
          </Table>
          <Lede style={{ marginTop: 18 }}>
            The one error worth burying is <em>si tendría</em>. Si takes the subjunctive and the other
            half takes the conditional — <em>si tuviera dinero, viajaría</em> — never the reverse, and
            never two conditionals.
          </Lede>
        </>
      ),
    },
  ],

  gender: [
    {
      id: "endings",
      title: "The ending tells you",
      Body: () => (
        <>
          <Lede>
            Gender gets taught as arbitrary and memorized word by word. It is not. Eight endings
            settle the overwhelming majority of nouns, and the leftovers are a short famous list worth
            learning as a group.
          </Lede>
          <Cards cols={2}>
            {genderEndings.map((e) => (
              <Card className="lift" key={e.end}>
                <div className="row-flex" style={{ justifyContent: "space-between" }}>
                  <span className="card-k mono" style={{ fontSize: 14 }}>{e.end}</span>
                  <span className={"pill " + (e.g === "f" ? "pill-acc" : "pill-pri")}>
                    {e.g === "f" ? "la" : "el"}
                  </span>
                </div>
                <div className="card-x mono">{e.ex}</div>
              </Card>
            ))}
          </Cards>
        </>
      ),
    },
    {
      id: "exceptions",
      title: "The exceptions, as a group",
      Body: ({ speak }) => (
        <Table head={["Word", "Article", "Why it surprises"]}>
          {genderExceptionTable.map(([word, article, why]) => (
            <tr key={word}>
              <td className="key">
                <span className="row-flex">{word}<Speak text={word} speak={speak} /></span>
              </td>
              <td className="mono term">{article}</td>
              <td className="dim">{why}</td>
            </tr>
          ))}
        </Table>
      ),
    },
  ],

  mexicanismos: [
    {
      id: "swaps",
      title: "The swaps that matter",
      Body: ({ speak }) => (
        <>
          <Lede>
            Most Spanish courses are written for Peninsular Spanish, so they teach vocabulary that
            marks you instantly in Mexico City. You will be understood either way, but these are the
            swaps that matter — and one or two that avoid real embarrassment.
          </Lede>
          <Table head={["Mexico", "Spain", "English", "Note"]}>
            {mexicanismos.map((w) => (
              <tr key={w.mx}>
                <td className="key">
                  <span className="row-flex">{w.mx}<Speak text={w.mx} speak={speak} /></span>
                </td>
                <td className="dim">{w.sp}</td>
                <td className="dim">{w.en}</td>
                <td className="dim">{w.n}</td>
              </tr>
            ))}
          </Table>
        </>
      ),
    },
    {
      id: "diminutives",
      title: "The diminutive is politeness",
      Body: ({ speak }) => (
        <>
          <Lede>
            Mexican Spanish attaches -ito and -ita constantly, and it almost never means small. It
            softens a request, hedges a commitment, or warms up a sentence. Picking up the habit is
            one of the fastest ways to stop sounding blunt.
          </Lede>
          <Cards cols={2}>
            {diminutives.map(([word, gloss]) => (
              <Card className="lift" key={word}>
                <div className="row-flex" style={{ justifyContent: "space-between" }}>
                  <span className="card-k mono primary" style={{ fontSize: 14 }}>{word}</span>
                  <Speak text={word} speak={speak} label={"Play " + word} />
                </div>
                <div className="card-v">{gloss}</div>
              </Card>
            ))}
          </Cards>
        </>
      ),
    },
    {
      id: "register",
      title: "Register, safest to riskiest",
      Body: () => (
        <Cards cols={3}>
          <Card className="lift">
            <div className="row-flex" style={{ justifyContent: "space-between" }}>
              <span className="card-k">usted</span>
              <span className="pill pill-good">safe</span>
            </div>
            <div className="card-v">
              Mexico is markedly more usted-forward than Spain. Use it with anyone older, any
              stranger, and anyone serving you. Nobody has ever been offended by it.
            </div>
          </Card>
          <Card className="lift">
            <div className="row-flex" style={{ justifyContent: "space-between" }}>
              <span className="card-k">tú</span>
              <span className="pill pill-pri">once invited</span>
            </div>
            <div className="card-v">
              Peers and colleagues you know, or anyone who tutears you first. Let the other person
              drop to tú before you do.
            </div>
          </Card>
          <Card className="lift">
            <div className="row-flex" style={{ justifyContent: "space-between" }}>
              <span className="card-k">güey / wey</span>
              <span className="pill pill-bad">not yet</span>
            </div>
            <div className="card-v">
              Dude. Constant among friends under forty and completely wrong from a stranger.
              Understand it, do not use it.
            </div>
          </Card>
        </Cards>
      ),
    },
  ],

  connectors: [
    {
      id: "phrases",
      title: "Stalling, well executed",
      Body: ({ speak }) => (
        <>
          <Lede>
            Native speakers do not compose whole sentences before they start either. They open with a
            connector and assemble the rest while it is leaving their mouth. This is the Mexican set
            specifically — Spain's <em>vale</em> and <em>en plan</em> would mark you as having learned
            somewhere else.
          </Lede>
          <Table head={["Phrase", "Means", "When to use it"]}>
            {connectors.map((c) => (
              <tr key={c.p}>
                <td className="key">
                  <span className="row-flex">{c.p}<Speak text={c.p} speak={speak} /></span>
                </td>
                <td className="dim">{c.m}</td>
                <td className="dim">{c.u}</td>
              </tr>
            ))}
          </Table>
        </>
      ),
    },
  ],

  arena: [
    {
      id: "why",
      title: "Why everything at once",
      Body: () => (
        <>
          <Lede>
            A single-topic mission tells you which rule applies before you start — real Spanish does
            not. The Arena interleaves all ten regions and picks by how overdue each item is. Every
            item also carries its own difficulty: things you keep missing come back sooner forever,
            things you never miss stretch out faster than a fixed ladder would.
          </Lede>
          <Cards cols={2}>
            <Card className="lift">
              <div className="card-k">Interleaving, not variety</div>
              <div className="card-v">
                Mixing decks helps because it puts confusable forms next to each other and makes you
                tell them apart. That is why every wrong answer here is a real competing form.
              </div>
            </Card>
            <Card className="lift">
              <div className="card-k">Decay picks the order</div>
              <div className="card-v">
                Nothing is drawn at random. Whatever is furthest past its due date comes first, with
                room kept in every run for material you have not met yet.
              </div>
            </Card>
          </Cards>
        </>
      ),
    },
  ],
};

export const entriesFor = (regionId) => CODEX[regionId] || [];
