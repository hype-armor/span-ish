import React from "../react.js";
import { Drill } from "../components/Drill.jsx";
import { ProgressPanel } from "../components/ProgressPanel.jsx";

export function ReviewTab({ progress, record, speak, persist, sum }) {
  return (
    <section>
      <h2>Everything at once, scheduled by decay</h2>
      <p className="lede">
        Single-topic drills tell you which rule applies before you start — real Spanish doesn't. This
        interleaves all ten modules and picks by how overdue each item is. Every item also carries
        its own difficulty: things you keep missing come back sooner forever, things you never miss
        stretch out faster than a fixed ladder would.
      </p>

      <div className="grid g3">
        <div className="card lift">
          <div className="stat-n" style={{ color: "var(--accent)" }}>{sum.due}</div>
          <div className="card-v">due now — overdue or lapsed</div>
        </div>
        <div className="card lift">
          <div className="stat-n" style={{ color: "var(--good)" }}>{sum.mature}</div>
          <div className="card-v">mature — three weeks or more between reviews</div>
        </div>
        <div className="card lift">
          <div className="stat-n">
            {sum.seen}
            <span style={{ fontSize: 17, color: "var(--faint)", fontWeight: 600 }}> / {sum.total}</span>
          </div>
          <div className="card-v">
            items met so far
            {sum.nextDays ? ` · next wakes in ~${sum.nextDays}${sum.nextDays === 1 ? " day" : " days"}` : ""}
          </div>
        </div>
      </div>

      <Drill mod="mixed" label="Mixed review" progress={progress} record={record} speak={speak} count={14} />
      <ProgressPanel progress={progress} persist={persist} />
    </section>
  );
}
