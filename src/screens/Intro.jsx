import React from "../react.js";
import { Pages } from "../components/Pages.jsx";
import { Lede } from "../components/bits.jsx";
import { DAILY_GOAL } from "../lib/game.js";

/* The app explaining itself, once.
 *
 * The old layout said what this was in its masthead, on every screen, forever.
 * A map of glyphs says nothing at all — so the argument the whole app rests on
 * gets one screen at the start rather than a permanent header nobody reads
 * after the first day. It never comes back unless progress is reset. */
export function IntroScreen({ onStart, onLook }) {
  return (
    <div className="screen intro-screen">
      <div className="screen-body">
        <Pages label="what this is" className="fill">
          <div className="intro">
            <p className="eyebrow" data-break="">Español mexicano</p>
            <h1 data-break="">You already know a few thousand <span>palabras</span></h1>

            <Lede>
              Mexican Spanish is regular enough to learn as a set of rules rather than a pile of
              memorization. Read a rule, then drill it. Every item is scheduled on its own — answer
              it right and it comes back later, miss it and it comes back today.
            </Lede>

            <div className="intro-points">
              <div className="intro-point" data-break="">
                <b>Eleven regions, one road.</b>
                <span>
                  Each is a topic with its own codex to read and four missions to play. The next one
                  opens once you have cleared two missions in the one before it.
                </span>
              </div>
              <div className="intro-point" data-break="">
                <b>Nothing scrolls.</b>
                <span>
                  Every screen is a finite thing you can finish. Anything longer than the screen is
                  paged — swipe, or use the arrows.
                </span>
              </div>
              <div className="intro-point" data-break="">
                <b>The score is your memory, not your attendance.</b>
                <span>
                  XP is paid for items the schedule actually asked for, and the streak counts days
                  you cleared {DAILY_GOAL} of them. Replaying things you already know earns almost
                  nothing, and the app will say so.
                </span>
              </div>
            </div>
          </div>
        </Pages>
      </div>

      <footer className="screen-foot intro-foot">
        {/* Two words on purpose: the region's name is three more, and on a
            small phone the button wrapped to three lines to hold them. */}
        <button className="btn wide" onClick={onStart}>Start here</button>
        <button className="btn ghost" onClick={onLook}>Look around first</button>
      </footer>
    </div>
  );
}
