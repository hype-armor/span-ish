import React, { useState, useEffect, useRef, useCallback } from "./react.js";
import { useSpeech } from "./lib/speech.js";
import { record as recordItem, summarise, tallyReview } from "./lib/srs.js";
import { ALL_IDS, ALL_ID_SET } from "./lib/decks.js";
import { normalise } from "./lib/progress.js";
import { PROGRESS_KEYS, THEME_KEYS, readFirst } from "./lib/storage.js";

import { RulesTab } from "./sections/Rules.jsx";
import { TransformerTab } from "./sections/Transformer.jsx";
import { SoundTab } from "./sections/Sound.jsx";
import { VerbsTab } from "./sections/Verbs.jsx";
import { PastTab } from "./sections/Past.jsx";
import { TensesTab } from "./sections/Tenses.jsx";
import { SubjunctiveTab } from "./sections/Subjunctive.jsx";
import { GenderTab } from "./sections/Gender.jsx";
import { MexicanismosTab } from "./sections/Mexicanismos.jsx";
import { ConnectorsTab } from "./sections/Connectors.jsx";
import { ReviewTab } from "./sections/Review.jsx";

const TABS = [
  { id: "rules", label: "Rules", Section: RulesTab },
  { id: "transformer", label: "Transformer", Section: TransformerTab },
  { id: "sound", label: "Sound", Section: SoundTab },
  { id: "verbs", label: "Verbs", Section: VerbsTab },
  { id: "past", label: "Past", Section: PastTab },
  { id: "periphrasis", label: "Tenses", Section: TensesTab },
  { id: "subjunctive", label: "Subjunctive", Section: SubjunctiveTab },
  { id: "gender", label: "Gender", Section: GenderTab },
  { id: "mexicanismos", label: "Mexicanismos", Section: MexicanismosTab },
  { id: "connectors", label: "Connectors", Section: ConnectorsTab },
  { id: "mixed", label: "Review", Section: ReviewTab },
];

export function App() {
  const [tab, setTab] = useState("rules");
  const [progress, setProgress] = useState({ scores: {}, items: {} });
  const [theme, setTheme] = useState("light");
  const [loaded, setLoaded] = useState(false);
  const speak = useSpeech();

  /* Load once. Until this finishes, `loaded` keeps the save effect from
     writing the empty starting state over real history. */
  useEffect(() => {
    (async () => {
      const savedTheme = await readFirst(THEME_KEYS);
      const preferred =
        savedTheme ||
        (typeof window !== "undefined" && window.matchMedia
          ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
          : null);
      setTheme(preferred || "light");

      const savedProgress = await readFirst(PROGRESS_KEYS);
      if (savedProgress) {
        try {
          setProgress(normalise(JSON.parse(savedProgress)));
        } catch {
          /* unreadable progress is left alone rather than thrown away */
        }
      }
      setLoaded(true);
    })();
  }, []);

  /* Switching tabs scrolls back up, but not on first paint. */
  const firstTab = useRef(true);
  useEffect(() => {
    if (firstTab.current) { firstTab.current = false; return; }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  const firstSave = useRef(true);
  useEffect(() => {
    if (!loaded) return;
    if (firstSave.current) { firstSave.current = false; return; }
    (async () => {
      try {
        await window.storage.set("mx:progress", JSON.stringify(progress));
      } catch {
        /* nothing useful to do if the browser refuses to store it */
      }
    })();
  }, [progress, loaded]);

  const persist = useCallback((next) => setProgress(next), []);

  const toggleTheme = async () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      await window.storage.set("mx:theme", next);
    } catch {
      /* the theme is not worth failing over */
    }
  };

  /* Called once per finished round with that round's answers. */
  const record = useCallback((mod, answers) => {
    if (!answers.length) return;
    const now = Date.now();
    const right = answers.filter((a) => a.right).length;
    const percent = Math.round((right / answers.length) * 100);

    setProgress((prev) => {
      const score = prev.scores[mod] || { right: 0, total: 0, best: 0 };
      const items = { ...prev.items };
      let reviews = prev.reviews || {};
      for (const answer of answers) {
        /* Tally against the item as it stands *before* the update, since the
           question is how the interval that just elapsed performed. */
        reviews = tallyReview(reviews, items[answer.id], answer.right);
        items[answer.id] = recordItem(items[answer.id], answer.right, now);
      }
      return {
        scores: {
          ...prev.scores,
          [mod]: { right: score.right + right, total: score.total + answers.length, best: Math.max(score.best, percent) },
        },
        items,
        reviews,
      };
    });
  }, []);

  const summary = summarise(progress.items, Date.now(), ALL_IDS, ALL_ID_SET);
  const active = TABS.find((t) => t.id === tab);
  const Section = active ? active.Section : null;

  return (
    <div className="app" data-theme={theme}>
      <div className="wrap">
        <header className="masthead">
          <div className="topline">
            <div>
              <p className="eyebrow">Español mexicano</p>
              <h1>You already know a few thousand <span>palabras</span></h1>
            </div>
            <button
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
          </div>
          <p className="deck">
            Mexican Spanish is regular enough to learn as a set of rules rather than a pile of
            memorization. Read a rule, then drill it. Every item is scheduled on its own — answer it
            right and it comes back later, miss it and it comes back today.
          </p>
        </header>
      </div>

      <div className="navwrap">
        <div className="wrap">
          <nav>
            {TABS.map((t) => (
              <button key={t.id} className="tab" data-on={tab === t.id} onClick={() => setTab(t.id)}>
                {t.label}
                {t.id === "mixed" && loaded && summary.due > 0 && <span className="pip">{summary.due}</span>}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="wrap">
        {Section && (
          tab === "mixed"
            ? <Section progress={progress} record={record} speak={speak} persist={persist} sum={summary} />
            : <Section progress={progress} record={record} speak={speak} />
        )}
        <p className="foot">
          Progress is stored in this browser on this device — export it from Review before you switch
          devices. Typed answers forgive accents (nacion counts for nación), but dictation requires the
          ñ, since spelling is the whole point there. Audio asks your browser for a Mexican voice first.
        </p>
      </div>
    </div>
  );
}
