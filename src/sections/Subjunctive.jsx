import React, { useState } from "../react.js";
import { Table } from "../components/bits.jsx";
import { Drill } from "../components/Drill.jsx";
import { subjunctiveTriggers } from "../lib/content.js";

/* The ids are wired to the filter, so they are not content. */
const FILTERS = [
  ["all", "Everything"],
  ["sub", "Forces subjunctive"],
  ["ind", "Stays indicative"],
];

export function SubjunctiveTab({ progress, record, speak }) {
  const [filter, setFilter] = useState("all");
  const shown = subjunctiveTriggers.filter((t) =>
    filter === "all" ? true : filter === "sub" ? t.s : !t.s,
  );

  return (
    <section>
      <h2>Don't reason about mood. Match the phrase.</h2>
      <p className="lede">
        Textbooks explain the subjunctive as doubt, emotion and unreality — true, and useless
        mid-sentence. In practice a fixed set of phrases forces it and everything else doesn't. Treat
        it as a lookup, and let the underlying logic arrive later.
      </p>

      <div className="chips" style={{ marginBottom: 16 }}>
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

      <p className="lede" style={{ marginTop: 20 }}>
        The logic underneath, once you want it: asserting something real takes the indicative, while
        wanting, doubting or projecting forward takes the subjunctive. Notice how<em> creo que</em> and <em>no creo que</em> flip on exactly that line — and that the drill's wrong answer is always
        the other real form, never something you could rule out on sight.
      </p>

      <Drill mod="subjunctive" label="Triggers & sentences" progress={progress} record={record} speak={speak} count={12} />
    </section>
  );
}
