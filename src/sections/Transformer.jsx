import React, { useState, useMemo } from "../react.js";
import { Table, Lede } from "../components/bits.jsx";
import { Drill } from "../components/Drill.jsx";
import { convert } from "../lib/suffix.js";
import { suffixes, converterExamples } from "../lib/content.js";

export function TransformerTab({ progress, record, speak }) {
  const [word, setWord] = useState("information");
  const result = useMemo(() => convert(word), [word]);

  return (
    <section>
      <h2>English suffixes are Spanish suffixes wearing a coat</h2>
      <Lede>
        Both languages pulled the same words out of Latin, so thousands of them are cognates.
        Fifteen ending swaps turn English words you already own into Spanish you never studied. Type
        anything that ends in one of them.
      </Lede>

      <div className="machine">
        <p className="machine-label">Live conversion</p>
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          spellCheck="false"
          autoComplete="off"
          aria-label="English word to convert"
          placeholder="Type an English word…"
        />
        <div className="out">
          {result && result.ok ? (
            <>
              <span className="stem">{result.stem}</span>
              {/* keyed on the text so the tail re-animates when it changes */}
              <span className="tail" key={result.tail + result.stem}>{result.tail}</span>
            </>
          ) : (
            <span style={{ color: "var(--deep-faint)", fontSize: "50%", fontFamily: "inherit" }}>
              {result ? "No rule matches that ending — try one below." : "Waiting for a word."}
            </span>
          )}
        </div>
        {result && result.ok && (
          <p className="machine-note">
            <b>{result.rule.en} → {result.rule.es}</b> · {result.rule.note} Written accents follow the
            stress rule, so the machine leaves them off — that's the Sound tab.
          </p>
        )}
        <div className="chips">
          {converterExamples.map((example) => (
            <button key={example} className="chip chip-d" onClick={() => setWord(example)}>{example}</button>
          ))}
        </div>
      </div>

      <h3>The full table</h3>
      <Table head={["English", "Spanish", "Example", "Watch for"]}>
        {suffixes.map((r) => (
          <tr key={r.en}>
            <td className="mono term">{r.en}</td>
            <td className="key">{r.es}</td>
            <td className="dim">{r.ex[0][0]} → {r.ex[0][1]}</td>
            <td className="dim">{r.note}</td>
          </tr>
        ))}
      </Table>

      <Lede style={{ marginTop: 20 }}>
        A handful are false friends. <em>Embarazada</em> is pregnant, not embarrassed;<em> éxito</em> is
        success, not exit; <em>constipado</em> means you have a head cold. And in Mexico, <em>molestar</em> only ever means to bother.
      </Lede>

      <Drill mod="suffix" label="Suffix drill" progress={progress} record={record} speak={speak} />
    </section>
  );
}
