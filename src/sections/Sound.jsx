import React from "../react.js";
import { Table, Speak } from "../components/bits.jsx";
import { Drill } from "../components/Drill.jsx";
import { vowels, consonants, xSounds, stressRules } from "../lib/content.js";

export function SoundTab({ progress, record, speak }) {
  return (
    <section>
      <h2>Learn it once, then stop thinking about it</h2>
      <p className="lede">
        Spanish spelling is fully phonetic: five vowel sounds, no reduction, no schwa, no silent
        endings. The drill runs both directions — rules about letters, and dictation where a word
        plays and you spell it. Dictation is the half that trains your ears.
      </p>

      <h3>The five vowels</h3>
      <div className="grid g3">
        {vowels.map((v) => (
          <div className="card lift" key={v.l}>
            <div className="row-flex" style={{ justifyContent: "space-between" }}>
              <span className="row-flex" style={{ gap: 10 }}>
                <span className="mono" style={{ fontSize: 26, fontWeight: 600, color: "var(--primary)" }}>{v.l}</span>
                <span className="pill pill-acc">{v.s}</span>
              </span>
              <Speak text={v.w} speak={speak} label={"Play " + v.w} />
            </div>
            <div className="card-v">{v.g}</div>
            <div className="card-x mono">{v.w}</div>
          </div>
        ))}
      </div>

      <h3>The consonants that differ</h3>
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

      <h3>The letter x, which is only a problem in Mexico</h3>
      <p className="lede">
        Old Spanish spelled a sh sound with x. In most words that sound later hardened into the j
        rasp, but the spelling never caught up — hence México. Indigenous place names went their own
        way, some keeping the sh and some softening to s.
      </p>
      <div className="grid g2">
        {xSounds.map((x) => (
          <div className="card lift" key={x.s}>
            <div className="row-flex" style={{ justifyContent: "space-between" }}>
              <span className="card-k mono" style={{ fontSize: 14 }}>{x.w}</span>
              <span className="row-flex">
                <span className="pill pill-acc">{x.s}</span>
                <Speak text={x.ex} speak={speak} label={"Play " + x.ex} />
              </span>
            </div>
            <div className="card-v">{x.n}</div>
          </div>
        ))}
      </div>

      <h3>Stress is a three-line algorithm</h3>
      <div className="grid g3">
        {stressRules.map((r) => (
          <div className="card lift" key={r.cond}>
            <div className="card-k" style={{ fontSize: 13.5 }}>{r.cond}</div>
            <div className="card-v">{r.rule}</div>
            <div className="card-x mono">{r.ex}</div>
          </div>
        ))}
      </div>

      <Drill mod="sound" label="Sound & dictation" progress={progress} record={record} speak={speak} count={12} />
    </section>
  );
}
