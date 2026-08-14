import React, { useState, useEffect, useRef, useCallback } from "../react.js";
import { poolFor } from "../lib/decks.js";
import { convert } from "../lib/suffix.js";
import { matches } from "../lib/text.js";
import { buildRound, bossRound, previewInterval, isDue } from "../lib/srs.js";
import { MODES, TIMED_MODES, comboMultiplier } from "../lib/game.js";
import { sfx } from "../lib/juice.js";
import { Pages } from "./Pages.jsx";
import { MissionResult } from "./Results.jsx";
import { Glossed, useGlossary } from "./Glossary.jsx";

const ACCENTS = ["á", "é", "í", "ó", "ú", "ñ", "¿", "¡"];
const BLANK = "⌷";

/* How long a choice card gets before it counts as a miss, per mode. A timer
 * only ever runs on cards you answer by choosing: putting a clock on a typed
 * retrieval buys drama at the cost of the retrieval, which is the thing the
 * app is actually for. Typed and dictation cards ignore this entirely. */
const LIMIT = { rapid: 11000, ambush: 7000 };

const BOSS_HP_PER_CARD = 10;
const BOSS_HEAL = 7;
const HEARTS = { boss: 3, sudden: 1 };

/* The Forge shows the rule being applied rather than just asking for a word.
 *
 * A suffix card is an English word whose ending decides the Spanish one, and
 * the whole argument of that region is that the swap is mechanical. Rendering
 * it as an ordinary typed prompt hides exactly the thing being taught, so the
 * ending is split off and coloured on both sides of the answer.
 *
 * Returns null when the word is not one the converter has a rule for, and the
 * card falls back to the ordinary layout. */
function forgeParts(card) {
  const english = String(card.q || "");
  const result = convert(english);
  if (!result || !result.ok) return null;

  /* A rule can cover two endings ("-able / -ible"), and each half carries its
     own hyphen — stripping only the first one leaves "-ible" unmatchable. */
  const enTail = result.rule.en
    .split(" / ")
    .map((t) => t.replace(/^-/, ""))
    .find((t) => english.toLowerCase().endsWith(t));
  if (!enTail) return null;

  const answer = card.canon || (Array.isArray(card.a) ? card.a[0] : card.a);
  const esTail = String(answer).slice(-result.tail.length);
  /* Only split the answer where its ending really is the rule's ending —
     otherwise colour nothing rather than colour the wrong letters. */
  const split = fold(esTail) === fold(result.tail)
    ? { stem: String(answer).slice(0, -result.tail.length), tail: esTail }
    : { stem: String(answer), tail: "" };

  return {
    enStem: english.slice(0, english.length - enTail.length),
    enTail,
    rule: result.rule,
    ...split,
  };
}

const fold = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/* Dictation is unanswerable without a voice, and silently playing nothing
   looks like a broken button rather than a missing feature. */
const VOICE = typeof window !== "undefined" && "speechSynthesis" in window;

/* One mission.
 *
 * The loop underneath is the same one the drill has always run — ask, take a
 * commitment, show the answer and the reason immediately, move on — because
 * that is the part with evidence behind it (docs/learning-design.md). The
 * modes change what is at stake around it, never that.
 *
 * A missed card is not shown again inside the mission. Re-testing within a
 * session is massed practice: the second attempt comes out of short-term
 * memory and mostly inflates your sense of knowing. A miss sets the card due
 * immediately, so it returns in the next session regardless.
 */
export function Mission({ region, stage, progress, speak, onFinish, onExit, motion, canvasRef }) {
  const mode = stage.mode;
  const { active: glossOpen } = useGlossary();

  const freshRound = () => {
    const now = Date.now();
    const pool = poolFor(region.mod, mode);
    return mode === "boss"
      ? bossRound(pool, stage.size, progress.items, now)
      : buildRound(pool, stage.size, progress.items, now);
  };

  const [round, setRound] = useState(freshRound);
  const [index, setIndex] = useState(0);
  const [verdict, setVerdict] = useState("open"); // open | right | wrong
  const [typed, setTyped] = useState("");
  const [chosen, setChosen] = useState(null);
  const [results, setResults] = useState([]);
  const [combo, setCombo] = useState(0);
  const [hp, setHp] = useState(stage.size * BOSS_HP_PER_CARD);
  const [hearts, setHearts] = useState(HEARTS[mode] || 0);
  const [flash, setFlash] = useState(null); // a damage number, briefly
  const [outcome, setOutcome] = useState(null);

  const inputRef = useRef(null);
  const bodyRef = useRef(null);
  const finished = useRef(false);

  const card = round[index];
  const answered = verdict !== "open";
  const history = card ? progress.items[card.id] : null;
  const rightSoFar = results.filter((r) => r.right).length;

  const maxHp = stage.size * BOSS_HP_PER_CARD;
  const timed = TIMED_MODES.has(mode) && card && card.kind === "mc";

  /* ---------- ending ---------- */

  const end = useCallback(
    (answers, won) => {
      if (finished.current) return;
      finished.current = true;
      const value =
        mode === "boss" ? Math.max(0, maxHp - hp)
        : mode === "sudden" ? answers.filter((a) => a.right).length
        : answers.length ? Math.round((100 * answers.filter((a) => a.right).length) / answers.length) : 0;

      const report = onFinish({
        answers: answers.map((a) => ({ id: a.id, right: a.right, wasDue: a.wasDue })),
        mode,
        region: region.id,
        stage: stage.id,
        score: { won, value },
      });
      setOutcome({ ...report, results: answers, won, value });
      if (won === false) sfx.fail();
      else sfx.clear();
    },
    [mode, hp, maxHp, onFinish, region.id, stage.id],
  );

  /* ---------- answering ---------- */

  const settle = useCallback(
    (right, given) => {
      if (finished.current) return;
      const wasDue = !history || isDue(history, Date.now());
      const nextCombo = right ? combo + 1 : 0;

      setVerdict(right ? "right" : "wrong");
      setCombo(nextCombo);
      setResults((prev) => [...prev, { id: card.id, right, wasDue, label: labelFor(card), given }]);

      if (right) {
        sfx.right(nextCombo);
        if (mode === "boss") {
          const damage = BOSS_HP_PER_CARD + Math.round(BOSS_HP_PER_CARD * (comboMultiplier(nextCombo - 1) - 1) * 0.5);
          setHp((h) => Math.max(0, h - damage));
          setFlash({ text: "−" + damage, kind: "hit" });
          sfx.hit();
        }
      } else {
        sfx.wrong();
        if (mode === "boss") {
          setHp((h) => Math.min(maxHp, h + BOSS_HEAL));
          setFlash({ text: "+" + BOSS_HEAL, kind: "heal" });
        }
        if (HEARTS[mode]) setHearts((n) => Math.max(0, n - 1));
      }
    },
    [card, combo, history, mode, maxHp],
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

  /* ---------- the clock ---------- */

  /* The countdown lives in its own component on purpose. Held here, its tick
     re-rendered the whole card ten times a second — which also tore down and
     rebuilt the pager's ResizeObserver on every tick, so a timed mission was
     re-measuring its own layout continuously for a bar four pixels tall. */

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(t);
  }, [flash]);

  /* ---------- moving on ---------- */

  const advance = useCallback(() => {
    const dead = HEARTS[mode] && hearts <= 0;
    const slain = mode === "boss" && hp <= 0;
    const last = index + 1 >= round.length;

    if (slain) return end(results, true);
    if (dead) return end(results, false);
    if (last) return end(results, mode === "boss" ? false : true);

    setIndex(index + 1);
    setVerdict("open");
    setTyped("");
    setChosen(null);
  }, [index, round.length, results, mode, hearts, hp, end]);

  const restart = () => {
    finished.current = false;
    setRound(freshRound());
    setIndex(0);
    setVerdict("open");
    setTyped("");
    setChosen(null);
    setResults([]);
    setCombo(0);
    setHp(stage.size * BOSS_HP_PER_CARD);
    setHearts(HEARTS[mode] || 0);
    setOutcome(null);
  };

  /* Skip the very first run: autoplaying audio and stealing focus the moment
     a mission opens is hostile. */
  const started = useRef(false);
  useEffect(() => {
    if (!card || outcome) return;
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
  }, [index, card, speak, outcome]);

  /* Number keys pick an option; Enter or Space moves on. Ignored while the
     caret is in a field, and while a button already has focus so that Enter
     does not both activate the button and advance. */
  useEffect(() => {
    if (outcome) return;
    const onKey = (e) => {
      if (!card) return;
      if (glossOpen) return; // a definition is on top; Escape and Space are its
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
  }, [card, answered, outcome, advance, glossOpen]);

  /* Ambush is two forms and a thumb. A flick left or right answers it without
     looking away from the sentence, which is the whole point of the mode —
     tapping the buttons still works, and is what a mouse does. */
  const flick = useRef(null);
  const onAmbushDown = (e) => {
    if (answered || e.pointerType === "mouse") return;
    flick.current = { x: e.clientX, y: e.clientY };
  };
  const onAmbushUp = (e) => {
    const from = flick.current;
    flick.current = null;
    if (!from || answered) return;
    const dx = e.clientX - from.x;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(e.clientY - from.y)) return;
    choose(card.opts[dx < 0 ? 0 : 1]);
  };

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

  if (outcome) {
    return (
      <MissionResult
        region={region}
        stage={stage}
        outcome={outcome}
        onRestart={restart}
        onExit={onExit}
        motion={motion}
        canvasRef={canvasRef}
      />
    );
  }
  if (!card) return null;

  const nextIn = answered ? previewInterval(history, verdict === "right") : 0;
  const hasBlank = card.q && card.q.indexOf(BLANK) >= 0;
  const ambush = mode === "ambush" && card.kind === "mc" && card.opts.length === 2;
  const forge = mode === "forge" ? forgeParts(card) : null;
  const multiplier = comboMultiplier(combo);

  return (
    <div className={"mission mode-" + mode} data-answered={answered}>
      <header className="mission-top">
        <div className="mission-line">
          <button className="icon-btn small" onClick={onExit} aria-label="Leave this mission">‹</button>
          <div className="mission-id">
            <span className="mission-mode">{MODES[mode].name}</span>
            <span className="mission-where">{region.name}</span>
          </div>
          <div className="mission-count">
            {Math.min(index + 1, round.length)}<span>/{round.length}</span>
          </div>
        </div>

        {mode === "boss" ? (
          <div className="bossbar">
            <div className="bosshp"><i style={{ width: (100 * hp) / maxHp + "%" }} /></div>
            <div className="hearts" aria-label={`${hearts} lives left`}>
              {Array.from({ length: HEARTS.boss }, (_, i) => (
                <span key={i} className="heart" data-on={i < hearts} aria-hidden="true">♥</span>
              ))}
            </div>
            {flash && <span className={"flash flash-" + flash.kind}>{flash.text}</span>}
          </div>
        ) : (
          <div className="runbar">
            <div className="bar"><i style={{ width: (100 * index) / round.length + "%" }} /></div>
            {timed && !answered && (
              <Clock key={index} limit={LIMIT[mode]} onExpire={() => settle(false, null)} />
            )}
          </div>
        )}

        <div className="mission-stats">
          <span className="stat-chip" data-hot={combo >= 3}>
            {combo > 0 ? `${combo} in a row` : "combo"}
            {multiplier > 1 && <b> ×{multiplier}</b>}
          </span>
          <span className="stat-chip quiet">{rightSoFar} right</span>
          {mode === "sudden" && (
            <span className="stat-chip" data-warn={true}>{hearts > 0 ? "one life" : "over"}</span>
          )}
        </div>
      </header>

      <div className="mission-body" key={index} ref={bodyRef} tabIndex={-1}>
        <Pages label="this card" className="fill" grow>
          <div className="qwrap">
            <div className="tags">{statusPill(card, history)}</div>

            {card.listen ? (
              <div className="listen">
                <button
                  className={"speak speak-xl" + (answered ? "" : " pulsing")}
                  onClick={() => speak(card.audio)}
                  aria-label="Play the word again"
                >▶</button>
                {!VOICE && (
                  <p className="no-voice">
                    This browser has no speech synthesis, so there is nothing to hear. Dictation needs
                    one — every other mission works without it.
                  </p>
                )}
              </div>
            ) : forge ? (
              <div className="forge">
                <div className="forge-in mono">
                  {forge.enStem}<b>{forge.enTail}</b>
                </div>
                <div className="forge-rule">
                  {forge.rule.en} <span aria-hidden="true">→</span> {forge.rule.es}
                </div>
                <div className="forge-out mono" aria-hidden={!answered}>
                  {answered
                    ? <>{forge.stem}<b key={forge.tail}>{forge.tail}</b></>
                    : <span className="forge-blank" />}
                </div>
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
              <div
                className={ambush ? "ambush" : "opts"}
                onPointerDown={ambush ? onAmbushDown : undefined}
                onPointerUp={ambush ? onAmbushUp : undefined}
              >
                {card.opts.map((option, i) => {
                  const state = !answered ? undefined
                    : option === card.a ? "right"
                    : option === chosen ? "wrong"
                    : undefined;
                  return (
                    <button
                      key={i}
                      className={(ambush ? "ambush-opt" : "opt") + (answered && !state ? " faded" : "")}
                      disabled={answered}
                      data-s={state}
                      onClick={() => choose(option)}
                    >
                      {!ambush && <kbd>{i + 1}</kbd>}
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : (
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
            )}

            {answered && (
              <div className="feedback">
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
              </div>
            )}
          </div>
        </Pages>
      </div>

      <footer className="mission-foot">
        {!answered && card.kind === "type" && (
          <>
            <div className="accentbar">
              {ACCENTS.map((ch) => (
                <button key={ch} onClick={() => insert(ch)} tabIndex={-1} aria-label={"Insert " + ch}>{ch}</button>
              ))}
            </div>
            <button className="btn quiet" onClick={giveUp}>I don't know</button>
          </>
        )}
        {answered && (
          <button className="btn wide" onClick={advance}>
            {hp <= 0 && mode === "boss" ? "Finish it"
              : HEARTS[mode] && hearts <= 0 ? "See how it ended"
              : index + 1 >= round.length ? "See results"
              : "Next"}
          </button>
        )}
      </footer>
    </div>
  );
}

/* The bar that runs out.
 *
 * Keyed on the card, so it restarts by being replaced rather than by an effect
 * noticing something changed. The callback goes through a ref so that a parent
 * re-render cannot reset the clock mid-card. */
function Clock({ limit, onExpire }) {
  const [left, setLeft] = useState(1);
  const expire = useRef(onExpire);
  expire.current = onExpire;

  useEffect(() => {
    const start = Date.now();
    let warned = false;
    const id = setInterval(() => {
      const remaining = Math.max(0, 1 - (Date.now() - start) / limit);
      setLeft(remaining);
      if (remaining < 0.28 && !warned) { warned = true; sfx.tick(); }
      /* Running out is a failed retrieval attempt, which still gets its answer
         and its reason — it is not skipped past. */
      if (remaining <= 0) { clearInterval(id); expire.current(); }
    }, 90);
    return () => clearInterval(id);
  }, [limit]);

  return <div className="clock" data-low={left < 0.28}><i style={{ width: left * 100 + "%" }} /></div>;
}

/* How a card is named on the results screen.
 *
 * The answer on its own is often not an identity: a gender card's answer is
 * "el" or "la", and a list of those tells you nothing about which nouns you
 * missed. Where the prompt is short enough to fit on a chip, it goes in front
 * of the answer; a sentence prompt is too long, but its answer — a verb form —
 * identifies the card by itself. */
function labelFor(card) {
  const answer = card.canon || (Array.isArray(card.a) ? card.a[0] : card.a);
  const prompt = String(card.q || "").replace(/⌷/g, "___").trim();
  if (card.kind === "mc" && prompt && prompt.length <= 20) return `${prompt} → ${answer}`;
  return answer;
}

/* What this card is to you, said before you answer it. Knowing an item is one
   you have missed before is part of the retrieval, not a spoiler. */
function statusPill(card, history) {
  if (!history) return <span className="pill pill-good">New</span>;
  if (history.streak === 0 && history.wrong > 0) return <span className="pill pill-bad">Missed before</span>;
  if (isDue(history, Date.now())) return <span className="pill pill-pri">Due for review</span>;
  return <span className="pill pill-pri">Early review</span>;
}
