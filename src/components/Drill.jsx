import React, { useState, useEffect, useRef, useCallback } from "../react.js";
import { cardsFor } from "../lib/decks.js";
import { matches } from "../lib/text.js";
import { buildRound, previewInterval, isDue } from "../lib/srs.js";
import { Results } from "./Results.jsx";
import { Glossed, useGlossary } from "./Glossary.jsx";

const ACCENTS = ["á", "é", "í", "ó", "ú", "ñ", "¿", "¡"];
const BLANK = "⌷";

/* One round of cards for one module.
 *
 * A missed card is not shown again this round. Re-testing within a session is
 * massed practice: it produces a success drawn from short-term memory, which
 * mostly inflates your sense of knowing. The value of the miss was already
 * taken at the moment of feedback, and a miss sets the card due immediately,
 * so it returns in the next session anyway. See docs/learning-design.md. */
export function Drill({ mod, label, progress, record, speak, count }) {
  const size = count || 10;
  const { active: glossOpen } = useGlossary();
  const freshRound = () => buildRound(cardsFor(mod), size, progress.items, Date.now());

  const [round, setRound] = useState(freshRound);
  const [index, setIndex] = useState(0);
  const [verdict, setVerdict] = useState("open"); // open | right | wrong
  const [typed, setTyped] = useState("");
  const [chosen, setChosen] = useState(null);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);

  const recorded = useRef(false);
  const inputRef = useRef(null);
  const bodyRef = useRef(null);

  const card = round[index];
  const answered = verdict !== "open";
  const score = progress.scores[mod];
  const history = card ? progress.items[card.id] : null;

  const rightSoFar = results.filter((r) => r.right).length;

  /* Captured before the round is recorded, so the results screen can say
     whether this round beat the previous best. */
  const bestBefore = useRef(score ? score.best : 0);

  /* Skip the very first run: autoplaying audio and stealing focus the moment
     the tab renders is hostile. */
  const started = useRef(false);
  useEffect(() => {
    if (!card) return;
    if (!started.current) { started.current = true; return; }
    if (card.listen) speak(card.audio);
    if (card.kind === "type" && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    } else if (bodyRef.current) {
      /* Advancing removes the button that had focus, and where focus goes next
         is up to the engine: Chromium drops it on <body>, iOS hands it to the
         next focusable element — the first option of the card that just
         appeared, which then draws a focus ring and reads as already chosen.
         Park it somewhere harmless instead, which also points a screen reader
         at the new question rather than leaving it stranded. */
      bodyRef.current.focus({ preventScroll: true });
    }
  }, [index, card, speak]);

  const settle = useCallback(
    (right, given) => {
      setVerdict(right ? "right" : "wrong");
      setResults((prev) => [...prev, { id: card.id, right, canon: card.canon || card.a, given }]);
    },
    [card],
  );

  const checkTyped = () => {
    if (answered || !typed.trim()) return;
    settle(matches(typed, card.a, card.strict), typed);
  };
  const giveUp = () => { if (!answered) settle(false, null); };
  const choose = (option) => {
    if (answered) return;
    setChosen(option);
    settle(option === card.a, option);
  };

  const advance = useCallback(() => {
    if (index + 1 >= round.length) {
      if (!recorded.current) {
        recorded.current = true;
        record(mod, results);
      }
      setDone(true);
      return;
    }
    setIndex(index + 1);
    setVerdict("open");
    setTyped("");
    setChosen(null);
  }, [index, round.length, results, mod, record]);

  const restart = () => {
    bestBefore.current = progress.scores[mod] ? progress.scores[mod].best : 0;
    setRound(freshRound());
    setIndex(0);
    setVerdict("open");
    setTyped("");
    setChosen(null);
    setResults([]);
    setDone(false);
    recorded.current = false;
  };

  /* Number keys pick an option; Enter or Space moves on. Ignored while the
     caret is in a field, and while a button already has focus so that Enter
     does not both activate the button and advance. */
  useEffect(() => {
    if (done) return;
    const onKey = (e) => {
      if (!card) return;
      /* A definition is open on top of the card; Escape and Space belong to it. */
      if (glossOpen) return;
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.target && e.target.isContentEditable) return;

      if (answered && (e.key === "Enter" || e.key === " ")) {
        if (document.activeElement && document.activeElement.tagName === "BUTTON") return;
        e.preventDefault();
        advance();
        return;
      }
      if (!answered && card.kind === "mc" && /^[1-9]$/.test(e.key)) {
        const i = Number(e.key) - 1;
        if (i < card.opts.length) { e.preventDefault(); choose(card.opts[i]); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, answered, done, advance, glossOpen]);

  /* Accent buttons insert at the caret rather than appending. */
  const insert = (ch) => {
    const el = inputRef.current;
    if (!el) { setTyped(typed + ch); return; }
    const from = el.selectionStart ?? typed.length;
    const to = el.selectionEnd ?? typed.length;
    setTyped(typed.slice(0, from) + ch + typed.slice(to));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(from + 1, from + 1);
    });
  };

  if (done) {
    return (
      <Results label={label} results={results} total={results.length} best={bestBefore.current} onRestart={restart} />
    );
  }
  if (!card) return null;

  const percent = Math.round((index / round.length) * 100);
  const nextIn = answered ? previewInterval(history, verdict === "right") : 0;
  const hasBlank = card.q && card.q.indexOf(BLANK) >= 0;

  return (
    <div className="drill">
      <div className="drill-top">
        <div className="drill-meta">
          <span className="drill-title">{label}</span>
          <span className="counter">
            {Math.min(index + 1, round.length)} / {round.length} · {rightSoFar} right
          </span>
        </div>
        <div className="bar"><i style={{ width: percent + "%" }} /></div>
      </div>

      <div className="qbody" key={index} ref={bodyRef} tabIndex={-1}>
        <div className="tags">{statusPill(card, history)}</div>

        {card.listen ? (
          <div style={{ textAlign: "center", marginBottom: 6 }}>
            <button
              className={"speak speak-xl" + (answered ? "" : " pulsing")}
              onClick={() => speak(card.audio)}
              aria-label="Play the word again"
            >▶</button>
          </div>
        ) : (
          <div className={"prompt" + (hasBlank ? " mono" : "")}>
            {hasBlank
              ? card.q.split(BLANK).map((part, i, all) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < all.length - 1 && <span className="blank" />}
                  </React.Fragment>
                ))
              : card.q}
          </div>
        )}

        <p className="prompt-sub" style={card.listen ? { textAlign: "center" } : undefined}>
          <Glossed>{card.sub}</Glossed>
        </p>

        {card.kind === "mc" ? (
          <div className="opts">
            {card.opts.map((option, i) => {
              const state = !answered ? undefined
                : option === card.a ? "right"
                : option === chosen ? "wrong"
                : undefined;
              return (
                <button
                  key={i}
                  className={"opt" + (answered && !state ? " faded" : "")}
                  disabled={answered}
                  data-s={state}
                  onClick={() => choose(option)}
                >
                  <kbd>{i + 1}</kbd>
                  {option}
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <div className="answer-row">
              <input
                ref={inputRef}
                className="answer-input"
                data-s={answered ? verdict : undefined}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  if (answered) advance(); else checkTyped();
                }}
                disabled={answered}
                placeholder="Type your answer…"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                aria-label="Your answer"
              />
              {!answered && (
                <button className="btn" onClick={checkTyped} disabled={!typed.trim()}>Check</button>
              )}
            </div>
            {!answered && (
              <>
                <div className="accentbar">
                  {ACCENTS.map((ch) => (
                    <button key={ch} onClick={() => insert(ch)} tabIndex={-1} aria-label={"Insert " + ch}>{ch}</button>
                  ))}
                </div>
                <div className="actions">
                  <button className="btn quiet" onClick={giveUp}>I don't know</button>
                </div>
              </>
            )}
          </>
        )}

        {answered && (
          <>
            <div
              className={"verdict " + (verdict === "right" ? "verdict-good" : "verdict-bad")}
              role="status"
              aria-live="polite"
            >
              <span className="verdict-icon" aria-hidden="true">{verdict === "right" ? "✓" : "✕"}</span>
              <span className="verdict-text">
                {verdict === "right" ? "Correct" : "The answer is "}
                {verdict === "right" ? (
                  /* right, but the accents were forgiven — show the spelling */
                  card.canon && typed && typed.trim() !== card.canon ? (
                    <> — spelled <span className="mono">{card.canon}</span></>
                  ) : null
                ) : (
                  <span className="mono">{card.canon || card.a}</span>
                )}
              </span>
              {card.audio && (
                <button className="speak" onClick={() => speak(card.audio)} aria-label="Hear it">▶</button>
              )}
            </div>

            <div className="why"><Glossed>{card.why}</Glossed></div>

            <div className="sched">
              {verdict === "right"
                ? `Scheduled again in ${nextIn}${nextIn === 1 ? " day" : " days"}`
                : "Due again in your next session"}
            </div>

            <div className="actions">
              <button className="btn" onClick={advance}>
                {index + 1 >= round.length ? "See results" : "Next"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function statusPill(card, history) {
  if (!history) return <span className="pill pill-good">New</span>;
  if (history.streak === 0 && history.wrong > 0) return <span className="pill pill-bad">Missed before</span>;
  if (isDue(history, Date.now())) return <span className="pill pill-pri">Due for review</span>;
  return <span className="pill pill-pri">Early review</span>;
}
