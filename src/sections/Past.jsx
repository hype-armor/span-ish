import React from "../react.js";
import { Table, Speak } from "../components/bits.jsx";
import { Drill } from "../components/Drill.jsx";
import { preteriteStems } from "../lib/content.js";

export function PastTab({ progress, record, speak }) {
  return (
    <section>
      <h2>One past tense does most of the work</h2>
      <p className="lede">
        Mexico reaches for the simple past where Spain would use the present perfect — <em>ya comí</em>,
        not <em>ya he comido</em> — so this is the past tense you actually hear. Regular verbs follow
        the two ending tables on the Rules tab. The irregulars are a closed set of about fifteen, and
        they are irregular together rather than each in its own way.
      </p>

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

      <Drill mod="past" label="Preterite in context" progress={progress} record={record} speak={speak} count={12} />
    </section>
  );
}
