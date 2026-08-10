import React from "../react.js";
import { Table, Speak } from "../components/bits.jsx";
import { Drill } from "../components/Drill.jsx";
import { genderEndings, genderExceptionTable } from "../lib/content.js";

export function GenderTab({ progress, record, speak }) {
  return (
    <section>
      <h2>The ending tells you, nearly every time</h2>
      <p className="lede">
        Gender gets taught as arbitrary and memorized word by word. It isn't. Eight endings settle the
        overwhelming majority of nouns, and the leftovers are a short famous list worth learning as a
        group.
      </p>

      <div className="grid g2">
        {genderEndings.map((e) => (
          <div className="card lift" key={e.end}>
            <div className="row-flex" style={{ justifyContent: "space-between" }}>
              <span className="card-k mono" style={{ fontSize: 14 }}>{e.end}</span>
              <span className={"pill " + (e.g === "f" ? "pill-acc" : "pill-pri")}>
                {e.g === "f" ? "la" : "el"}
              </span>
            </div>
            <div className="card-x mono">{e.ex}</div>
          </div>
        ))}
      </div>

      <h3>The exceptions worth memorizing together</h3>
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

      <Drill mod="gender" label="El or la" progress={progress} record={record} speak={speak} />
    </section>
  );
}
