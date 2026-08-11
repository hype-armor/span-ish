import React, { useState } from "../react.js";
import { Table, Speak } from "../components/bits.jsx";
import { Drill } from "../components/Drill.jsx";
import {
  subjunctiveTriggers, imperfectSubjunctiveEndings, imperfectSubjunctiveUses,
  imperfectSubjunctiveRegular, preteriteStems,
} from "../lib/content.js";

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

      <h2 style={{ marginTop: 44 }}>The same triggers, once the sentence is in the past</h2>
      <p className="lede">
        Everything above is the present subjunctive. Move the main verb into the past and the
        subjunctive has to follow: <em>quiero que vengas</em> becomes <em>quería que vinieras</em>. The
        trigger list does not change — only the form does.
      </p>

      <div className="card" style={{ marginTop: 10, borderLeft: "3px solid var(--accent)" }}>
        <div className="card-k">You already know how to build it</div>
        <div className="card-v">
          The present subjunctive comes from the yo present. This one comes from the <b>ellos preterite</b>: drop <b>-ron</b>, add <b>-ra</b>. Every irregularity carries over
          for free, so the fifteen strong preterites on the Past tab are the fifteen imperfect
          subjunctives — there is no second list to learn.
        </div>
      </div>

      <Table head={["Endings", "Example", "Note"]}>
        {imperfectSubjunctiveEndings.map((e) => (
          <tr key={e.set}>
            <td className="mono term">{e.set}</td>
            <td className="dim mono" style={{ fontSize: 12 }}>{e.ex}</td>
            <td className="dim">{e.n}</td>
          </tr>
        ))}
      </Table>

      <h3>The recipe, worked through</h3>
      <Table head={["Verb", "Ellos preterite", "Imperfect subjunctive"]}>
        {[...imperfectSubjunctiveRegular, ...preteriteStems.map((v) => {
          const ellos = v.f.split(",")[4].trim();
          return { v: v.v, ellos, a: ellos.replace(/ron$/, "") + "ra" };
        })].map((v) => (
          <tr key={v.v}>
            <td className="key">{v.v}</td>
            <td className="dim mono">{v.ellos}</td>
            <td className="mono term" style={{ color: "var(--accent)" }}>
              <span className="row-flex">{v.a}<Speak text={v.a} speak={speak} /></span>
            </td>
          </tr>
        ))}
      </Table>

      <h3>Where it turns up</h3>
      <Table head={["Situation", "Example", "Why"]}>
        {imperfectSubjunctiveUses.map((u) => (
          <tr key={u.use}>
            <td className="key">{u.use}</td>
            <td>
              <span className="row-flex">
                <span className="mono" style={{ fontSize: 13 }}>{u.ex}</span>
                <Speak text={u.ex} speak={speak} />
              </span>
              <span style={{ fontSize: 12, color: "var(--faint)" }}>{u.t}</span>
            </td>
            <td className="dim">{u.n}</td>
          </tr>
        ))}
      </Table>

      <p className="lede" style={{ marginTop: 20 }}>
        The one error worth burying is <em>si tendría</em>. Si takes the subjunctive and the other
        half takes the conditional — <em>si tuviera dinero, viajaría</em> — never the reverse, and
        never two conditionals. The drill below puts the conditional in as the wrong answer every
        time, because that is the mistake that actually gets made.
      </p>

      <Drill mod="subjunctive" label="Triggers, sentences & si clauses" progress={progress} record={record} speak={speak} count={12} />
    </section>
  );
}
