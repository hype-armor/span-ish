import React from "../react.js";
import { Table, Speak } from "../components/bits.jsx";
import { Drill } from "../components/Drill.jsx";
import { irregularVerbs } from "../lib/content.js";

export function VerbsTab({ progress, record, speak }) {
  return (
    <section>
      <h2>Irregularity is a finite list, not a condition</h2>
      <p className="lede">
        Three ending tables cover every regular verb, and the irregulars are a closed set about this
        size. Nothing new joins it — verbs entering Spanish today are always regular -ar: googlear,
        tuitear, chatear. The drill asks you to produce forms inside sentences, and each verb has
        several, so the cue stays the verb rather than one memorized line.
      </p>

      <div className="grid g3">
        <div className="card lift">
          <div className="card-k">yo-go group</div>
          <div className="card-v">
            Irregular in the yo form only, then regular. tener → tengo, poner → pongo, salir → salgo.
          </div>
        </div>
        <div className="card lift">
          <div className="card-k">boot changers</div>
          <div className="card-v">
            The stem vowel shifts in every form except nosotros. Draw the grid and the shaded cells
            look like a boot.
          </div>
        </div>
        <div className="card lift">
          <div className="card-k">the untameable four</div>
          <div className="card-v">
            ser, estar, ir, haber. No pattern at all — and the four you'll use most, so memorize them
            outright.
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 10, borderLeft: "3px solid var(--accent)" }}>
        <div className="card-k">Mexico deletes a column</div>
        <div className="card-v">
          Vosotros doesn't exist here. The plural "you" is always <b>ustedes</b>, formal or not, and it
          conjugates like ellos. Every table below has five forms instead of six, and you can ignore
          the vosotros column in any textbook you pick up.
        </div>
      </div>

      <h3>The closed set</h3>
      <Table head={["Verb", "Meaning", "Yo", "Pattern"]}>
        {irregularVerbs.map((v) => (
          <tr key={v.v}>
            <td className="key">
              <span className="row-flex">{v.v}<Speak text={v.f} speak={speak} label={"Play " + v.v} /></span>
            </td>
            <td className="dim">{v.m}</td>
            <td className="mono term" style={{ color: "var(--accent)" }}>{v.yo}</td>
            <td className="dim">{v.g}</td>
          </tr>
        ))}
      </Table>

      <Drill mod="verbs" label="Conjugation in context" progress={progress} record={record} speak={speak} count={12} />
    </section>
  );
}
