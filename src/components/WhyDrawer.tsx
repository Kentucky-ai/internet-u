import { useEffect } from "react";
import type { Ranked, Profile, Priorities } from "../lib/types";
import { money } from "../lib/profile";

export function WhyDrawer({ r, profile, weights, onClose }: { r: Ranked; profile: Profile; weights: Priorities; onClose: () => void }) {
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  const p = r.product;
  const rejected = r.violatedRules.length > 0;
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div className="modal drawer" role="dialog" aria-modal="true" aria-labelledby="why-title" onClick={e => e.stopPropagation()}>
        <div className="kicker" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", fontWeight: 600 }}>{rejected ? "Why this was set aside" : "Why this was recommended"}</div>
        <h2 id="why-title">{p.name}</h2>
        <p className="muted">{p.brand} · {money(p.price, p.currency)}{p.source ? ` · ${p.source}` : ""}</p>
        <p style={{ marginTop: 12 }}>{r.explanation}</p>

        <dl className="kv">
          <dt>Your priorities</dt><dd>Budget {pct(weights.budget)} · Comfort {pct(weights.comfort)} · Style {pct(weights.style)}</dd>
          <dt>Your budget</dt><dd>{money(profile.budget, profile.currency)}</dd>
          {!rejected && <><dt>Score under them</dt><dd><b>{pct(r.score)}</b> (budget {pct(r.parts.budget)}, comfort {pct(r.parts.comfort)}, style {pct(r.parts.style)})</dd></>}
        </dl>

        <ul className="rules">
          {r.violatedRules.map(x => <li className="bad" key={x}><span className="ic">✕</span><span>{x}</span></li>)}
          {r.matchedRules.map(x => <li className="ok" key={x}><span className="ic">✓</span><span>{x}</span></li>)}
          {r.notApplicable.map(x => <li className="na" key={x}><span className="ic">–</span><span>{x}</span></li>)}
        </ul>

        {r.tradeoffs.length > 0 && <><h3 style={{ fontSize: 14, marginTop: 16 }}>Tradeoffs</h3><ul className="rules">{r.tradeoffs.map(x => <li className="unk" key={x}><span className="ic">⇄</span><span>{x}</span></li>)}</ul></>}
        {r.unknowns.length > 0 && <><h3 style={{ fontSize: 14, marginTop: 16 }}>Unknown or unverified</h3><ul className="rules">{r.unknowns.map(x => <li className="unk" key={x}><span className="ic">?</span><span>{x}</span></li>)}</ul></>}

        <p className="small muted" style={{ marginTop: 16 }}>Ranked by your rules and weights only. Popularity, ads and platform incentives are not inputs.</p>
        <div className="foot"><button className="btn" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}
