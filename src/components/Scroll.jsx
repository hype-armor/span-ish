import React, { useState, useRef, useEffect, useCallback } from "../react.js";

/* Content that is taller than the space it has.
 *
 * This used to page: the content was laid out inside a window with
 * `overflow: hidden` and moved a screen at a time, because "nothing scrolls"
 * read as a clean design rule. It was the wrong rule. Paging is a good fit for
 * a thing you step through and a bad one for a thing you read, and most of
 * what is in here — a table of fifteen suffixes, a page of diagnostics, an
 * explanation after a miss — is read. Turning a scroll into a tap, a page dot
 * and a wait made all of it worse to use in exchange for a property nobody
 * asked for.
 *
 * So the shell stays fixed — the strip, the dock and the mission's own footer
 * never move, and the page itself still cannot scroll — and the content inside
 * it scrolls like content. That is the part worth keeping: the app never
 * becomes a long document with its controls somewhere off the bottom.
 *
 * `fill` hands the leftover height to the content when it all fits, so a short
 * results screen sits in the middle rather than hugging the top.
 */
export function Scroll({ children, className = "", fill = false, label }) {
  const box = useRef(null);
  const [state, setState] = useState({ over: false, more: false });

  /* Two facts: whether it scrolls at all, and whether there is anything below
     the fold right now. The first decides whether this is a thing the keyboard
     can reach; the second is what the fade says. */
  const check = useCallback(() => {
    const el = box.current;
    if (!el) return;
    const room = el.scrollHeight - el.clientHeight;
    const next = { over: room > 2, more: room > 2 && el.scrollTop < room - 2 };
    setState((was) => (was.over === next.over && was.more === next.more ? was : next));
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    check();
    el.addEventListener("scroll", check, { passive: true });
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", check);
      return () => {
        el.removeEventListener("scroll", check);
        window.removeEventListener("resize", check);
      };
    }
    /* Watches the content as well as the frame: a card answering itself grows
       the page without the window changing size at all. */
    const observer = new ResizeObserver(check);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", check);
      observer.disconnect();
    };
  }, [check]);

  useEffect(check, [check, children]);

  return (
    <div className={"scroll" + (fill ? " fill" : "") + (className ? " " + className : "")} data-more={state.more}>
      {/* Focusable only when there is something to scroll: not every browser
          makes an overflowing box keyboard-reachable on its own, and a tab
          stop on a screen that fits is a tab stop that does nothing. */}
      <div
        className="scroll-box"
        ref={box}
        tabIndex={state.over ? 0 : -1}
        role={state.over ? "region" : undefined}
        aria-label={state.over ? label : undefined}
      >
        <div className="scroll-inner">{children}</div>
      </div>
    </div>
  );
}
