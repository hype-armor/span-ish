import React from "../react.js";
import { Table, Speak, Lede } from "../components/bits.jsx";
import { Drill } from "../components/Drill.jsx";
import { connectors } from "../lib/content.js";

export function ConnectorsTab({ progress, record, speak }) {
  return (
    <section>
      <h2>Fluency is mostly stalling, well executed</h2>
      <Lede>
        Native speakers don't compose whole sentences before they start either. They open with a
        connector and assemble the rest while it's leaving their mouth. This is the Mexican set
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

      <Drill mod="connectors" label="Connector drill" progress={progress} record={record} speak={speak} />
    </section>
  );
}
