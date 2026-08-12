import React, { useState, useEffect, useMemo, useRef, useCallback, useContext } from "../react.js";
import { glossary } from "../lib/content.js";

/* Grammar words explained in place.
 *
 * The drill offers "Subjunctive" as an answer and never says what one is. Any
 * term from content/glossary.js appearing in prose, in a card's instruction, or
 * in its explanation becomes a button that opens a definition.
 *
 * Only the first mention inside a given block is linked. Linking every
 * occurrence turns a paragraph about the subjunctive into a page of buttons. */

const ENTRIES = glossary || [];

const BY_WORD = new Map();
for (const entry of ENTRIES) {
  BY_WORD.set(entry.term.toLowerCase(), entry);
  for (const alias of entry.also || []) BY_WORD.set(alias.toLowerCase(), entry);
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* Longest first, so "boot verbs" wins over "verbs" at the same position. */
const WORDS = [...BY_WORD.keys()].sort((a, b) => b.length - a.length);
const PATTERN = WORDS.length ? new RegExp(`\\b(${WORDS.map(escapeRe).join("|")})\\b`, "gi") : null;

const GlossaryContext = React.createContext({ open: () => {}, active: null });
export const useGlossary = () => useContext(GlossaryContext);

export function GlossaryProvider({ children }) {
  const [active, setActive] = useState(null);
  const open = useCallback((entry) => setActive(entry), []);
  const close = useCallback(() => setActive(null), []);
  const value = useMemo(() => ({ open, active }), [open, active]);

  return (
    <GlossaryContext.Provider value={value}>
      {children}
      {active && <GlossaryModal entry={active} onClose={close} />}
    </GlossaryContext.Provider>
  );
}

/* Wraps the string children of a block. Elements pass through untouched rather
   than being cloned — walking the tree would change React's reconciliation
   identity, and the drill has state and a ref that must survive a re-render. */
export function Glossed({ children }) {
  const { open } = useGlossary();
  if (!PATTERN) return <>{children}</>;

  const seen = new Set();
  const linked = React.Children.map(children, (child) =>
    typeof child === "string" ? linkString(child, seen, open) : child,
  );
  return <>{linked}</>;
}

function linkString(text, seen, open) {
  PATTERN.lastIndex = 0;
  const parts = [];
  let last = 0;
  let match;
  let n = 0;

  while ((match = PATTERN.exec(text)) !== null) {
    const entry = BY_WORD.get(match[0].toLowerCase());
    if (!entry || seen.has(entry.term)) continue;
    seen.add(entry.term);

    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <button
        key={`g${n++}`}
        type="button"
        className="term-link"
        onClick={() => open(entry)}
        title={`What does "${entry.term}" mean?`}
      >
        {match[0]}
      </button>,
    );
    last = match.index + match[0].length;
  }

  if (!parts.length) return text;
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function GlossaryModal({ entry, onClose }) {
  const closeRef = useRef(null);
  const returnTo = useRef(null);

  useEffect(() => {
    returnTo.current = document.activeElement;
    if (closeRef.current) closeRef.current.focus();
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      /* Put the caret back where it was, so a drill in progress is undisturbed. */
      if (returnTo.current && returnTo.current.focus) returnTo.current.focus({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div className="gloss-backdrop" onClick={onClose}>
      <div
        className="gloss-card"
        role="dialog"
        aria-modal="true"
        aria-label={entry.term}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gloss-head">
          <span className="gloss-term">{entry.term}</span>
          <button ref={closeRef} className="gloss-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="gloss-what">{entry.what}</p>
        {entry.ex && <p className="gloss-ex">{entry.ex}</p>}
      </div>
    </div>
  );
}
