import React, { useState } from "../react.js";
import { blank } from "../lib/srs.js";

const DEFAULT_EASE = blank().ease;

/* Export, restore and reset. Review history is the part of this app that
   cannot be regenerated, so restoring is deliberately hard to do by accident
   and resetting takes two taps. */
export function ProgressPanel({ progress, persist }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState(null);
  const [armed, setArmed] = useState(false);

  const copy = async () => {
    const dump = JSON.stringify(progress);
    setText(dump);
    setOpen(true);
    try {
      await navigator.clipboard.writeText(dump);
      setStatus({ ok: true, msg: "Copied to clipboard." });
    } catch {
      setStatus({ ok: true, msg: "Clipboard blocked — select the text below and copy it manually." });
    }
  };

  const restore = () => {
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || !parsed.items) throw new Error("shape");

      const items = {};
      for (const [id, raw] of Object.entries(parsed.items)) {
        items[id] = {
          right: Number(raw.right) || 0,
          wrong: Number(raw.wrong) || 0,
          streak: Number(raw.streak) || 0,
          ease: typeof raw.ease === "number" ? raw.ease : DEFAULT_EASE,
          interval: Number(raw.interval) || 0,
          due: typeof raw.due === "number" ? raw.due : 0,
          last: Number(raw.last) || 0,
          lapses: Number(raw.lapses) || 0,
        };
      }
      persist({ scores: parsed.scores || {}, items });
      setStatus({ ok: true, msg: `Restored ${Object.keys(items).length} items.` });
    } catch {
      setStatus({ ok: false, msg: "That doesn't parse as saved progress. Paste the whole exported string." });
    }
  };

  const reset = () => {
    if (!armed) { setArmed(true); setStatus(null); return; }
    persist({ scores: {}, items: {} });
    setArmed(false);
    setText("");
    setStatus({ ok: true, msg: "Cleared. Every item counts as unseen again." });
  };

  return (
    <div className="panel">
      <div className="card-k">Back up or move your progress</div>
      <div className="card-v" style={{ maxWidth: "58ch" }}>
        Scheduling lives in this browser on this device. Export before you switch devices or clear
        site data — months of review history is worth more than the drills themselves.
      </div>

      <div className="actions">
        <button className="btn ghost" onClick={copy}>Copy progress</button>
        <button className="btn quiet" onClick={() => { setText(""); setOpen(true); setStatus(null); }}>
          Paste to restore
        </button>
        <button className="btn danger" onClick={reset}>
          {armed ? "Tap again to confirm" : "Reset all"}
        </button>
      </div>

      {open && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck="false"
            aria-label="Progress data"
            placeholder="Paste exported progress here, then press Restore."
          />
          <div className="actions">
            <button className="btn ghost" onClick={restore} disabled={!text.trim()}>
              Restore from this text
            </button>
            <button className="btn quiet" onClick={() => setOpen(false)}>Close</button>
          </div>
        </>
      )}

      {status && (
        <div className="status" style={{ color: status.ok ? "var(--good)" : "var(--bad)" }}>{status.msg}</div>
      )}
    </div>
  );
}
