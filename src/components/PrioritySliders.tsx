import type { Priorities } from "../lib/types";
import { normalizeWeights } from "../lib/profile";

const KEYS = ["budget", "comfort", "style"] as const;
const LABEL: Record<keyof Priorities, string> = { budget: "Budget", comfort: "Comfort", style: "Style" };
const CLS: Record<keyof Priorities, string> = { budget: "b", comfort: "c", style: "s" };

export function PrioritySliders({ value, onChange, compact }: { value: Priorities; onChange: (p: Priorities) => void; compact?: boolean }) {
  const w = normalizeWeights(value);
  return (
    <div className="prio">
      {KEYS.map(k => (
        <div className="prio-row" key={k}>
          <label htmlFor={`prio-${k}`}>{LABEL[k]}</label>
          <input id={`prio-${k}`} type="range" min={0} max={100} step={5} value={value[k]} aria-label={`${LABEL[k]} priority`}
            onChange={e => onChange({ ...value, [k]: Number(e.target.value) })} />
          <span className="pct">{Math.round(w[k] * 100)}%</span>
        </div>
      ))}
      <div>
        <div className="stack" aria-hidden="true">{KEYS.map(k => <i key={k} className={CLS[k]} style={{ width: `${w[k] * 100}%` }} />)}</div>
        {!compact && <div className="legend">{KEYS.map(k => <span key={k}><i className={CLS[k]} style={{ background: `var(--${k === "budget" ? "accent" : k === "comfort" ? "ok" : "warn"})` }} />{LABEL[k]} {Math.round(w[k] * 100)}%</span>)}</div>}
      </div>
    </div>
  );
}
