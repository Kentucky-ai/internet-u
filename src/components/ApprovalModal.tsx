import { useEffect, useState } from "react";
import type { Ranked, Profile } from "../lib/types";
import { money } from "../lib/profile";
import { oof } from "../lib/oof/adapter";

type Props = { r: Ranked; profile: Profile; onCancel: () => void; onApprove: (r: Ranked) => void };

export function ApprovalModal({ r, profile, onCancel, onApprove }: Props) {
  const [authz, setAuthz] = useState<boolean | null>(null);
  useEffect(() => { let on = true; oof.isAuthorized("execute:add_to_cart").then(a => { if (on) setAuthz(a); }); return () => { on = false; }; }, []);
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === "Escape" && onCancel(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onCancel]);
  const p = r.product;
  return (
    <div className="overlay" onClick={onCancel} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="appr-title" onClick={e => e.stopPropagation()}>
        <div className="pill warn" style={{ marginBottom: 10 }}>🔒 Approval required</div>
        <h2 id="appr-title">I can prepare this action, but I need your explicit approval before continuing.</h2>
        <dl className="kv">
          <dt>Action</dt><dd>Add to cart</dd>
          <dt>Selected item</dt><dd><b>{p.name}</b> · {p.brand}</dd>
          <dt>Price</dt><dd>{money(p.price, p.currency)} against your {money(profile.budget, profile.currency)} budget</dd>
          <dt>Rules considered</dt><dd>{[...r.matchedRules, ...r.notApplicable].join("; ")}</dd>
          {r.unknowns.length > 0 && <><dt>Still unknown</dt><dd>{r.unknowns.join("; ")}</dd></>}
          <dt>Authorization</dt><dd>{authz == null ? "checking…" : authz ? "allowed for this user" : "not allowed for this user"}</dd>
        </dl>
        <p className="small muted" style={{ marginTop: 14 }}>Demo mode: approving records the decision here. No store, cart, or payment is connected, so no real purchase can occur.</p>
        <div className="foot">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn primary" disabled={authz === false} onClick={() => onApprove(r)}>Approve</button>
        </div>
      </div>
    </div>
  );
}
