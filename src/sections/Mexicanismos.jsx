import React from "../react.js";
import { Table, Speak, Lede } from "../components/bits.jsx";
import { Drill } from "../components/Drill.jsx";
import { mexicanismos, diminutives } from "../lib/content.js";

export function MexicanismosTab({ progress, record, speak }) {
  return (
    <section>
      <h2>The words your textbook got wrong</h2>
      <Lede>
        Most Spanish courses are written for Peninsular Spanish, so they teach vocabulary that marks
        you instantly in Mexico City. You'll be understood either way, but these are the swaps that
        matter — and one or two that avoid real embarrassment.
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

      <h3>The diminutive is politeness, not size</h3>
      <Lede>
        Mexican Spanish attaches -ito and -ita constantly, and it almost never means small. It softens
        a request, hedges a commitment, or warms up a sentence. Picking up the habit is one of the
        fastest ways to stop sounding blunt.
      </Lede>
      <div className="grid g2">
        {diminutives.map(([word, gloss]) => (
          <div className="card lift" key={word}>
            <div className="row-flex" style={{ justifyContent: "space-between" }}>
              <span className="card-k mono" style={{ fontSize: 14, color: "var(--primary)" }}>{word}</span>
              <Speak text={word} speak={speak} label={"Play " + word} />
            </div>
            <div className="card-v">{gloss}</div>
          </div>
        ))}
      </div>

      <h3>Register, from safest to riskiest</h3>
      <div className="grid g3">
        <div className="card lift">
          <div className="row-flex" style={{ justifyContent: "space-between" }}>
            <span className="card-k">usted</span>
            <span className="pill pill-good">safe</span>
          </div>
          <div className="card-v">
            Mexico is markedly more usted-forward than Spain. Use it with anyone older, any stranger,
            and anyone serving you. Nobody has ever been offended by it.
          </div>
        </div>
        <div className="card lift">
          <div className="row-flex" style={{ justifyContent: "space-between" }}>
            <span className="card-k">tú</span>
            <span className="pill pill-pri">once invited</span>
          </div>
          <div className="card-v">
            Peers and colleagues you know, or anyone who tutears you first. Let the other person drop
            to tú before you do.
          </div>
        </div>
        <div className="card lift">
          <div className="row-flex" style={{ justifyContent: "space-between" }}>
            <span className="card-k">güey / wey</span>
            <span className="pill pill-bad">not yet</span>
          </div>
          <div className="card-v">
            Dude. Constant among friends under forty and completely wrong from a stranger. Understand
            it, don't use it.
          </div>
        </div>
      </div>

      <Drill mod="mexicanismos" label="Mexicanismos" progress={progress} record={record} speak={speak} />
    </section>
  );
}
