import React, { useState, useRef, useEffect, useCallback } from "../react.js";

/* Content that is taller than the space it has, without a scrollbar.
 *
 * The app never scrolls. That is a design rule rather than a styling
 * preference: a screen you can scroll is a screen with no edges, and the point
 * of the rebuild is that every screen is a finite thing you can finish. So
 * anything that might not fit — a reference table, a long explanation, a list
 * of badges — comes through here instead.
 *
 * The content is laid out in full inside a window with `overflow: hidden` and
 * moved a page at a time. Nothing is truncated and nothing is unreachable; you
 * arrive at it by paging rather than by dragging.
 *
 * Where a page would fall is worked out from the content itself: anything
 * marked `data-break` (table rows, cards, paragraphs) is a place a page is
 * allowed to end, so a row is never cut in half across the fold. With nothing
 * marked, it falls back to stepping by the window height.
 */
export function Pages({ children, className = "", label = "content", grow = false }) {
  const frame = useRef(null);
  const inner = useRef(null);
  const [page, setPage] = useState(0);
  const [offsets, setOffsets] = useState([0]);

  const measure = useCallback(() => {
    const box = frame.current;
    const body = inner.current;
    if (!box || !body) return;

    const height = box.clientHeight;
    const content = body.scrollHeight;
    if (!height) return;

    /* A hair over one page is still one page; without the slack a rounding
       error grows a phantom second page onto everything. */
    if (content <= height + 2) {
      setOffsets((was) => (was.length === 1 && was[0] === 0 ? was : [0]));
      setPage(0);
      return;
    }

    const top = body.getBoundingClientRect().top;
    const marks = [...body.querySelectorAll("[data-break]")]
      .map((el) => el.getBoundingClientRect().top - top)
      .filter((y) => y > 0)
      .sort((a, b) => a - b);

    /* The bottom of the content is a boundary like any other, so it goes in
       with the rest. Without it the last block gets whatever is left rather
       than a page of its own, and a card that starts near the fold is cut
       through the middle. */
    const stops = [...marks, content];

    const pages = [0];
    let start = 0;
    for (let i = 0; i < stops.length; i++) {
      if (stops[i] - start <= height) continue;
      /* This block would hang over the fold, so the page ends before it —
         unless there is no earlier boundary on this page, in which case the
         block is taller than the window on its own and has to be cut. */
      const previous = i > 0 ? stops[i - 1] : 0;
      start = previous > start ? previous : start + height;
      pages.push(start);
      /* And a block taller than the window keeps being cut until it fits. */
      while (stops[i] - start > height) {
        start += height;
        pages.push(start);
      }
    }

    setOffsets((was) => (same(was, pages) ? was : pages));
    setPage((p) => Math.min(p, pages.length - 1));
  }, []);

  /* The observer is set up once. Rebuilding it whenever `children` changed
     identity — which is every render — meant a card with anything animating on
     it tore down and recreated an observer continuously. */
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    if (frame.current) observer.observe(frame.current);
    if (inner.current) observer.observe(inner.current);
    return () => observer.disconnect();
  }, [measure]);

  /* Content can change without changing size — a table row swapped for another
     of the same height — and the observer would not fire for that. */
  useEffect(measure, [measure, children]);

  const count = offsets.length;
  const go = useCallback(
    (delta) => setPage((p) => Math.max(0, Math.min(count - 1, p + delta))),
    [count],
  );

  /* Swipe, because on a phone this is where the scroll gesture used to live
     and the hand goes there anyway. */
  const drag = useRef(null);
  const onPointerDown = (e) => {
    if (count < 2 || e.pointerType === "mouse") return;
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e) => {
    const from = drag.current;
    drag.current = null;
    if (!from) return;
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy)) return;
    go(dx < 0 ? 1 : -1);
  };

  const onKeyDown = (e) => {
    if (count < 2) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1); }
  };

  const paged = count > 1;

  return (
    <div
      className={"pages" + (grow ? " pages-grow" : "") + (className ? " " + className : "")}
      data-fits={count === 1}
      data-more={paged && page < count - 1}
    >
      <div
        className="pages-frame"
        ref={frame}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
        tabIndex={paged ? 0 : -1}
        role={paged ? "group" : undefined}
        aria-label={paged ? `${label}, page ${page + 1} of ${count}` : undefined}
      >
        <div
          className="pages-inner"
          ref={inner}
          style={{ transform: `translateY(${-offsets[page]}px)` }}
        >
          {children}
        </div>
      </div>

      {paged && (
        <div className="pages-bar">
          <button
            className="pages-arrow"
            onClick={() => go(-1)}
            disabled={page === 0}
            aria-label={"Previous page of " + label}
          >‹</button>
          <div className="pages-dots">
            {offsets.map((_, i) => (
              <button
                key={i}
                className="pages-dot"
                data-on={i === page}
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1} of ${count}`}
                aria-current={i === page}
              />
            ))}
          </div>
          <button
            className="pages-arrow"
            onClick={() => go(1)}
            disabled={page === count - 1}
            aria-label={"Next page of " + label}
          >›</button>
        </div>
      )}
    </div>
  );
}

const same = (a, b) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1);
