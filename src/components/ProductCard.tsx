import { useState } from "react";
import type { Ranked } from "../lib/types";
import { money } from "../lib/profile";

function Img({ src, alt, className }: { src?: string; alt: string; className: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return <div className={className === "img" ? "imgfallback" : "thumb"}>{className === "img" ? "No image" : ""}</div>;
  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setBroken(true)} referrerPolicy="no-referrer" />;
}

const pct = (n: number) => Math.round(n * 100);

export function PerspectiveCard({ label, r, flash, onWhy, onAct }: { label: string; r: Ranked | null; flash: boolean; onWhy: (r: Ranked) => void; onAct: (r: Ranked) => void }) {
  if (!r) return <div className="card product"><div className="label">{label}</div><div className="empty small">No option meets your rules</div></div>;
  const p = r.product;
  return (
    <div className={`card product${flash ? " flash" : ""}`}>
      <div className="label">{label}</div>
      <Img src={p.imageUrl} alt={p.name} className="img" />
      <div>
        <div className="name">{p.name}</div>
        <div className="small muted">{p.brand}{p.style ? ` · ${p.style}` : ""}</div>
      </div>
      <div className="row"><span className="price">{money(p.price, p.currency)}</span><span className="pill accent">{pct(r.score)}% match</span></div>
      <div style={{ display: "grid", gap: 5 }}>
        <Score name="Budget" v={r.parts.budget} color="var(--accent)" />
        <Score name="Comfort" v={r.parts.comfort} color="var(--ok)" />
        <Score name="Style" v={r.parts.style} color="var(--warn)" />
      </div>
      {r.tradeoffs[0] && <p className="small muted">Tradeoff: {r.tradeoffs[0].toLowerCase()}</p>}
      <div className="actions">
        <button className="btn sm" onClick={() => onWhy(r)}>Why this?</button>
        <button className="btn sm primary" onClick={() => onAct(r)}>Add to cart</button>
      </div>
    </div>
  );
}

function Score({ name, v, color }: { name: string; v: number; color: string }) {
  return <div className="scorebar"><span>{name}</span><div className="bar"><i style={{ width: `${pct(v)}%`, background: color }} /></div><b>{pct(v)}</b></div>;
}

export function ProductRow({ r, index, onWhy, onAct, rejected }: { r: Ranked; index?: number; onWhy: (r: Ranked) => void; onAct?: (r: Ranked) => void; rejected?: boolean }) {
  const p = r.product;
  return (
    <div className="card rowcard">
      <Img src={p.imageUrl} alt={p.name} className="thumb" />
      <div style={{ minWidth: 0 }}>
        <div className="name" style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
          {index != null && <span className="rank muted">#{index + 1}</span>}
          <span style={{ fontWeight: 650 }}>{p.name}</span>
          <span className="muted small">{p.brand}</span>
          <span style={{ fontWeight: 700 }}>{money(p.price, p.currency)}</span>
          {!rejected && <span className="pill accent" style={{ padding: "2px 8px", fontSize: 12 }}>{pct(r.score)}%</span>}
        </div>
        <div className="why">{rejected ? r.violatedRules.join(" · ") : r.explanation}</div>
      </div>
      <div className="actions" style={{ display: "flex", gap: 6 }}>
        <button className="btn sm" onClick={() => onWhy(r)}>Why{rejected ? " not" : ""}?</button>
        {!rejected && onAct && <button className="btn sm primary" onClick={() => onAct(r)}>Add to cart</button>}
      </div>
    </div>
  );
}
