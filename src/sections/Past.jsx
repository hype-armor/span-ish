import React from "../react.js";
import { Table, Speak, Lede } from "../components/bits.jsx";
import { Drill } from "../components/Drill.jsx";
import { preteriteStems, imperfectEndings, imperfectIrregular, aspectCues } from "../lib/content.js";

export function PastTab({ progress, record, speak }) {
  return (
    <section>
      <h2>One past tense does most of the work</h2>
      <Lede>
        Mexico reaches for the simple past where Spain would use the present perfect — <em>ya comí</em>,
        not <em>ya he comido</em> — so this is the past tense you actually hear. Regular verbs follow
        the two ending tables on the Rules tab. The irregulars are a closed set of about fifteen, and
        they are irregular together rather than each in its own way.
      </Lede>

      <div className="grid g3">
        <div className="card lift">
          <div className="card-k">one set of endings</div>
          <div className="card-v">
            -e, -iste, -o, -imos, -ieron for every verb below, whatever its infinitive ends in.
          </div>
        </div>
        <div className="card lift">
          <div className="card-k">no written accents</div>
          <div className="card-v">
            tuve and tuvo, against regular hablé and habló. The stress moves back a syllable, so the
            accent has nothing to correct.
          </div>
        </div>
        <div className="card lift">
          <div className="card-k">only the stem changes</div>
          <div className="card-v">
            Learn tuv-, pus-, dij- and the endings come free. That is the whole trick.
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 10, borderLeft: "3px solid var(--accent)" }}>
        <div className="card-k">Two wrinkles worth knowing</div>
        <div className="card-v">
          A stem ending in <b>j</b> swallows the i in the ellos form: <b>dijeron</b>, not dijieron. And <b>ser</b> and <b>ir</b> share one set of forms outright — <em>fue un buen día</em> and <em>fue al mercado</em> are the same word doing two jobs.
        </div>
      </div>

      <h3>The strong preterites</h3>
      <Table head={["Verb", "Stem", "Forms", "Note"]}>
        {preteriteStems.map((v) => (
          <tr key={v.v}>
            <td className="key">
              <span className="row-flex">{v.v}<Speak text={v.f} speak={speak} label={"Play " + v.v} /></span>
            </td>
            <td className="mono term" style={{ color: "var(--accent)" }}>{v.stem}</td>
            <td className="dim mono" style={{ fontSize: 12 }}>{v.f}</td>
            <td className="dim">{v.n}</td>
          </tr>
        ))}
      </Table>

      <h2 style={{ marginTop: 44 }}>The other past tense, and how to choose</h2>
      <Lede>
        The imperfect is the easiest tense in the language to form: two sets of endings and exactly
        three irregular verbs. Choosing between it and the preterite is the part worth practising, and
        it has nothing to do with how long ago something happened.
      </Lede>

      <Table head={["Verbs", "Endings", "Example"]}>
        {imperfectEndings.map((e) => (
          <tr key={e.kind}>
            <td className="term">{e.kind}</td>
            <td className="key mono">{e.e}</td>
            <td className="dim mono" style={{ fontSize: 12 }}>{e.ex}</td>
          </tr>
        ))}
      </Table>

      <h3>Every irregular verb in the tense</h3>
      <div className="grid g3">
        {imperfectIrregular.map((v) => (
          <div className="card lift" key={v.v}>
            <div className="row-flex" style={{ justifyContent: "space-between" }}>
              <span className="card-k mono" style={{ fontSize: 14, color: "var(--primary)" }}>{v.v}</span>
              <Speak text={v.f} speak={speak} label={"Play " + v.v} />
            </div>
            <div className="card-x mono">{v.f}</div>
            <div className="card-v">{v.n}</div>
          </div>
        ))}
      </div>

      <h3>Which one, and why</h3>
      <Lede>
        The preterite reports an event: it happened, it finished, you can count it. The imperfect
        describes the world the event happened in — what was going on, what used to be true, what time
        it was. Most sentences with both are the same shape: the imperfect sets the scene and the
        preterite interrupts it. <em>Cocinaba cuando alguien tocó la puerta.</em>
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

      <Lede style={{ marginTop: 20 }}>
        Four verbs change meaning rather than just tense. <em>Supe</em> is found out where <em>sabía</em> is knew; <em>conocí</em> is met where <em>conocía</em> is knew of; <em>quiso</em> is tried to and <em>no quiso</em> is refused; <em>pude</em> is managed to. The
        drill below mixes forms and choices, so the wrong answer is always the other real form.
      </Lede>

      <Drill mod="past" label="Past tense: forms and choices" progress={progress} record={record} speak={speak} count={12} />
    </section>
  );
}
