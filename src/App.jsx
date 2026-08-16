import React, { useState, useEffect, useRef, useCallback, useMemo } from "./react.js";
import { useSpeech } from "./lib/speech.js";
import { record as recordItem, summarise, tallyReview } from "./lib/srs.js";
import { ALL_IDS, ALL_ID_SET } from "./lib/decks.js";
import { normalise } from "./lib/progress.js";
import { PROGRESS_KEYS, THEME_KEYS, readFirst } from "./lib/storage.js";
import {
  regionById, stagesFor, recordMission, rollDay, awardBadges, masteryPoints,
  levelFor, titleFor, streakStatus, unlockedRegions, REGIONS,
  dayKey, questsFor, questProgress,
} from "./lib/game.js";
import { configure as configureJuice } from "./lib/juice.js";

import { Hud } from "./components/Hud.jsx";
import { Dock } from "./components/Dock.jsx";
import { Mission } from "./components/Mission.jsx";
import { GlossaryProvider } from "./components/Glossary.jsx";
import { IntroScreen } from "./screens/Intro.jsx";
import { MapScreen } from "./screens/Map.jsx";
import { RegionScreen } from "./screens/Region.jsx";
import { CodexScreen } from "./screens/Codex.jsx";
import { TodayScreen } from "./screens/Today.jsx";
import { LabScreen } from "./screens/Lab.jsx";

const EMPTY = { scores: {}, items: {}, reviews: {}, game: null };

/* The shell.
 *
 * One fixed-height frame: a heads-up strip, a stage that takes whatever is
 * left, and a dock. The frame itself never scrolls and never moves — the page
 * has no scrollbar at any size.
 *
 * Inside it, two kinds of screen. A card you are answering fits, always: no
 * scrolling and no paging, because hunting for the rest of a question is not
 * something to ask of someone mid-retrieval. A reference screen scrolls, like
 * the document it is. components/Scroll.jsx is the second kind. */
export function App() {
  const [progress, setProgress] = useState(EMPTY);
  const [theme, setTheme] = useState("light");
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState({ at: "map" });
  const speak = useSpeech();

  const canvasRef = useRef(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

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
      let next = normalise(savedProgress ? safeParse(savedProgress) : null);
      /* A day that ended while the app was closed takes its counters with it. */
      next = { ...next, game: rollDay(next.game, Date.now()) };
      setProgress(next);
      setLoaded(true);
    })();
  }, []);

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

  const game = progress.game;

  /* A system-level preference for less motion wins over the in-app setting;
     the setting can only ever turn more of it off. */
  const systemQuiet =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;
  const motion = !game || systemQuiet || game.settings.motion === "reduced" ? "reduced" : "full";

  useEffect(() => {
    if (game) configureJuice(game.settings);
  }, [game && game.settings]);

  const persist = useCallback((next) => setProgress(normalise(next)), []);

  const toggleTheme = async () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      await window.storage.set("mx:theme", next);
    } catch {
      /* the theme is not worth failing over */
    }
  };

  /* Shown once, then never again unless progress is reset. */
  const dismissIntro = useCallback(() => {
    setProgress((prev) => ({ ...prev, game: { ...prev.game, intro: false } }));
  }, []);

  const setSettings = useCallback((patch) => {
    setProgress((prev) => ({
      ...prev,
      game: { ...prev.game, settings: { ...prev.game.settings, ...patch } },
    }));
  }, []);

  /* One mission's worth of answers, recorded against the schedule and against
     the game in a single step so the two can never disagree about what
     happened. The report going back to the results screen is derived here
     rather than read out of state, which has not been written yet. */
  const finishMission = useCallback((payload) => {
    const now = Date.now();
    const before = progressRef.current;
    const { answers, mode, region, stage, score } = payload;

    const items = { ...before.items };
    let reviews = before.reviews || {};
    let right = 0;
    for (const answer of answers) {
      /* Tally against the item as it stands *before* the update, since the
         question is how the interval that just elapsed performed. */
      reviews = tallyReview(reviews, items[answer.id], answer.right);
      items[answer.id] = recordItem(items[answer.id], answer.right, now);
      if (answer.right) right++;
    }

    const mod = (regionById(region) || {}).mod || region;
    const was = before.scores[mod] || { right: 0, total: 0, best: 0 };
    const percent = answers.length ? Math.round((right / answers.length) * 100) : 0;
    const scores = {
      ...before.scores,
      [mod]: { right: was.right + right, total: was.total + answers.length, best: Math.max(was.best, percent) },
    };

    const pointsBefore = masteryPoints(before.items, ALL_IDS);
    const pointsAfter = masteryPoints(items, ALL_IDS);

    /* Quests are read on both sides of the mission so the results screen can
       say which ones this run finished. Measured against the day the mission
       was played, not the day the app was opened. */
    const rolled = rollDay(before.game, now);
    const today = questsFor(dayKey(now));
    const questsWere = today.map((q) => questProgress(rolled, q));

    const played = recordMission(before.game, { answers, mode, region, stage, score, now });
    const summaryAfter = summarise(items, now, ALL_IDS, ALL_ID_SET);
    const open = unlockedRegions(played.game);
    const awarded = awardBadges(played.game, {
      missions: played.game.today.missions,
      flawless: played.game.today.flawless,
      bosses: played.game.today.boss,
      streak: played.game.streak.count,
      level: levelFor(pointsAfter),
      mature: summaryAfter.mature,
      unlocked: open.size,
      met: summaryAfter.seen,
      due: summaryAfter.due,
    });

    const questsDone = today
      .map((q, i) => ({ quest: questProgress(awarded.game, q), was: questsWere[i] }))
      .filter(({ quest, was }) => quest.done && !was.done)
      .map(({ quest }) => quest);

    setProgress({ scores, items, reviews, game: awarded.game });

    return {
      quests: questsDone,
      xp: played.xp,
      combo: played.combo,
      flawless: played.flawless,
      cram: played.cram,
      badges: awarded.won,
      level: {
        before: levelFor(pointsBefore),
        after: levelFor(pointsAfter),
        title: titleFor(levelFor(pointsAfter)),
      },
    };
  }, []);

  const summary = useMemo(
    () => summarise(progress.items, Date.now(), ALL_IDS, ALL_ID_SET),
    [progress.items],
  );
  const points = useMemo(() => masteryPoints(progress.items, ALL_IDS), [progress.items]);

  if (!loaded || !game) {
    return <div className="app" data-theme={theme} data-motion="reduced" />;
  }

  /* The intro stands in for the map until it has been dismissed. It is not a
     screen you can navigate to, so it cannot get in the way later. */
  if (game.intro) {
    return (
      <div className="app" data-theme={theme} data-motion={motion}>
        <GlossaryProvider>
          <main className="stage">
            <IntroScreen
              onStart={() => { dismissIntro(); setView({ at: "region", region: REGIONS[0].id }); }}
              onLook={dismissIntro}
            />
          </main>
        </GlossaryProvider>
      </div>
    );
  }

  const region = view.region ? regionById(view.region) : null;
  const inMission = view.at === "mission" && region && view.stage;
  const streak = streakStatus(game, Date.now());
  const dockPip = summary.due > 0 && !game.today.goalMet ? summary.due : 0;

  /* Today names the region it is sending you to, so this only has to guard
     against a region that is not open — which should not happen. */
  const goRegion = (id) => {
    const open = unlockedRegions(game);
    setView({ at: "region", region: open.has(id) ? id : REGIONS[0].id });
  };

  return (
    <div className="app" data-theme={theme} data-motion={motion} data-mission={!!inMission}>
      <GlossaryProvider>
        {!inMission && <Hud game={game} points={points} summary={summary} />}

        <main className="stage">
          {view.at === "map" && (
            <MapScreen
              game={game}
              progress={progress}
              onRegion={(r) => setView({ at: "region", region: r.id })}
            />
          )}

          {view.at === "region" && region && (
            <RegionScreen
              region={region}
              game={game}
              progress={progress}
              onStage={(stage) => setView({ at: "mission", region: region.id, stage: stage.id })}
              onCodex={() => setView({ at: "codex", region: region.id })}
              onBack={() => setView({ at: "map" })}
            />
          )}

          {view.at === "codex" && region && (
            <CodexScreen
              region={region}
              speak={speak}
              onExit={() => setView({ at: "region", region: region.id })}
            />
          )}

          {inMission && (
            <Mission
              key={region.id + ":" + view.stage}
              region={region}
              stage={stagesFor(region).find((s) => s.id === view.stage)}
              progress={progress}
              speak={speak}
              motion={motion}
              canvasRef={canvasRef}
              onFinish={finishMission}
              onExit={() => setView({ at: "region", region: region.id })}
            />
          )}

          {view.at === "today" && (
            <TodayScreen game={game} progress={progress} summary={summary} onRegion={goRegion} />
          )}

          {view.at === "lab" && (
            <LabScreen
              progress={progress}
              persist={persist}
              theme={theme}
              onTheme={toggleTheme}
              settings={game.settings}
              onSettings={setSettings}
            />
          )}
        </main>

        {!inMission && (
          <Dock
            at={view.at === "region" || view.at === "codex" ? "map" : view.at}
            onGo={(where) => setView({ at: where })}
            pip={dockPip}
          />
        )}

        {/* Particles only. Never hit-tested, never in the way. */}
        <canvas className="fx" ref={canvasRef} aria-hidden="true" />

        {streak.atRisk && view.at === "map" && !game.today.goalMet && (
          <div className="nudge" role="status">
            Your {streak.count}-day streak is unclaimed today
          </div>
        )}
      </GlossaryProvider>
    </div>
  );
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    /* unreadable progress is left alone rather than thrown away */
    return null;
  }
}
