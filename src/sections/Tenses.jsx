import React from "../react.js";
import { Table, Speak, Lede } from "../components/bits.jsx";
import { Drill } from "../components/Drill.jsx";
import { periphrasis } from "../lib/content.js";

export function TensesTab({ progress, record, speak }) {
  return (
    <section>
      <h2>Ten patterns replace most of the tense system</h2>
      <Lede>
        A helper verb plus an infinitive says what English needs a whole separate tense for. These
        aren't beginner crutches — Mexican speakers reach for them first. A bonus: Mexico prefers the
        simple past over the present perfect, so <em>ya comí</em> covers what Spain would say with <em>ya he comido</em>.
      </Lede>

      <Table head={["Pattern", "Means", "Example", "Note"]}>
        {periphrasis.map((p) => (
          <tr key={p.p}>
            <td className="key">{p.p}</td>
            <td className="dim">{p.m}</td>
            <td>
              <span className="row-flex">
                <span className="mono" style={{ fontSize: 13 }}>{p.ex}</span>
                <Speak text={p.ex} speak={speak} />
              </span>
              <span style={{ fontSize: 12, color: "var(--faint)" }}>{p.t}</span>
            </td>
            <td className="dim">{p.note}</td>
          </tr>
        ))}
      </Table>

      <Drill mod="periphrasis" label="Pattern drill" progress={progress} record={record} speak={speak} />
    </section>
  );
}
