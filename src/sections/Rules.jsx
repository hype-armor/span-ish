import React from "../react.js";
import { Table, Speak, Lede } from "../components/bits.jsx";
import { Drill } from "../components/Drill.jsx";
import {
  suffixes, genderEndings, ruleVerbForms, ruleVerbEndings,
  ruleSubjunctiveForms, ruleAccents,
} from "../lib/content.js";

export function RulesTab({ progress, record, speak }) {
  return (
    <section>
      <h2>Learn the rule first, then stop rebuilding it</h2>
      <Lede>
        Every other tab asks you to produce Spanish, which means recalling a rule and applying it in
        the same breath. This tab drills the rules by themselves — the ending maps, the gender table,
        the verb paradigms, the subjunctive recipe — so that by the time you're filling in a sentence,
        the rule is already free and your attention can go to the sentence.
      </Lede>

      <h3>The suffix map, ending to ending</h3>
      <Table head={["English", "Spanish", "Example"]}>
        {suffixes.map((r) => (
          <tr key={r.en}>
            <td className="mono term">{r.en}</td>
            <td className="key">{r.es}</td>
            <td className="dim">{r.ex[0][1]}</td>
          </tr>
        ))}
      </Table>

      <h3>Gender, by ending</h3>
      <Table head={["Ending", "Article", "Example"]}>
        {genderEndings.map((r) => (
          <tr key={r.end}>
            <td className="mono term">{r.end}</td>
            <td className="key">{r.g === "f" ? "la" : "el"}</td>
            <td className="dim">{r.ex}</td>
          </tr>
        ))}
      </Table>

      <h3>Verb endings worth knowing cold</h3>
      <Table head={["Form", "Endings"]}>
        {[...ruleVerbForms, ...ruleVerbEndings].map((r) => (
          <tr key={r.q}>
            <td className="term">{r.q}</td>
            <td className="key mono">{r.a}</td>
          </tr>
        ))}
      </Table>

      <h3>Building the present subjunctive</h3>
      <Lede>
        One recipe covers nearly everything: take the yo form, drop the -o, flip the vowel — -ar verbs
        take e, -er and -ir verbs take a. Whatever irregularity the yo form carries comes along for
        free. Six verbs refuse the recipe outright, and those are the ones to memorize.
      </Lede>
      <Table head={["Verb", "Subjunctive", "Why"]}>
        {ruleSubjunctiveForms.map((r) => (
          <tr key={r.v}>
            <td className="mono term">{r.v}</td>
            <td className="key">
              <span className="row-flex">{r.a}<Speak text={r.a} speak={speak} /></span>
            </td>
            <td className="dim">{r.irr ? "Irregular — memorize. " : ""}{r.why}</td>
          </tr>
        ))}
      </Table>

      <h3>When the accent actually gets written</h3>
      <Table head={["Words", "Why the accent"]}>
        {ruleAccents.map((r) => (
          <tr key={r.q}>
            <td className="key">{r.q}</td>
            <td className="dim">{r.a}. {r.why}</td>
          </tr>
        ))}
      </Table>

      <Lede style={{ marginTop: 20 }}>
        The stress rules on the Sound tab tell you where a word is stressed. These tell you when that
        stress has to be written down — the accent is never decoration, it is always correcting a
        default.
      </Lede>

      <Drill mod="rules" label="Rule recall" progress={progress} record={record} speak={speak} />
    </section>
  );
}
