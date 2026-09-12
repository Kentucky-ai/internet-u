import { useState } from "react";
import { Link } from "react-router-dom";
import { useProfile } from "../state/profile";
import { PrioritySliders } from "../components/PrioritySliders";
import { money } from "../lib/profile";

function TagInput({ label, hint, values, onChange, placeholder }: { label: string; hint: string; values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const add = () => { const v = draft.trim(); if (v && !values.map(x => x.toLowerCase()).includes(v.toLowerCase())) onChange([...values, v]); setDraft(""); };
  return (
    <div className="field">
      <label>{label}</label>
      <span className="hint">{hint}</span>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="input" value={draft} placeholder={placeholder} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }} aria-label={label} />
        <button type="button" className="btn" onClick={add}>Add</button>
      </div>
      {values.length > 0 && <div className="tags">{values.map(v => <span className="tag" key={v}>{v}<button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter(x => x !== v))}>×</button></span>)}</div>}
    </div>
  );
}

export function Rules() {
  const { profile, setProfile, resetProfile, addDecision } = useProfile();
  const [saved, setSaved] = useState(false);
  const prefs = profile.preferences;
  const setPref = <K extends keyof typeof prefs>(k: K, v: (typeof prefs)[K]) => setProfile(p => ({ ...p, preferences: { ...p.preferences, [k]: v } }));
  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 1500); };

  return (
    <>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div><h1 style={{ fontSize: 30 }}>My Rules</h1><p className="muted">The profile below is the only thing the advocate optimizes for. It saves as you edit and never changes on its own.</p></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{saved && <span className="pill ok">Saved</span>}<button className="btn ghost sm" onClick={() => { resetProfile(); addDecision("profile", "Reset rules to defaults."); flashSaved(); }}>Reset to defaults</button><Link to="/" className="btn primary sm">Done → Home</Link></div>
      </div>

      <div className="bento">
        <section className="card span-7">
          <div className="kicker">Hard constraints</div>
          <h2>Rules I must never break</h2>
          <p className="small muted" style={{ marginBottom: 18 }}>An option that violates any of these is set aside and labeled, even if it scores best on everything else.</p>
          <div className="grid2">
            <div className="field">
              <label htmlFor="budget">Maximum budget</label>
              <span className="hint">Currently {money(profile.budget, profile.currency)}</span>
              <input id="budget" className="input" type="number" min={0} step={5} value={profile.budget} onChange={e => { setProfile(p => ({ ...p, budget: Math.max(0, Number(e.target.value) || 0) })); flashSaved(); }} />
            </div>
            <div className="field">
              <label htmlFor="currency">Currency</label>
              <span className="hint">Prices are compared in this currency</span>
              <select id="currency" className="input" value={profile.currency} onChange={e => { setProfile(p => ({ ...p, currency: e.target.value })); flashSaved(); }}>
                {["USD", "EUR", "GBP", "CAD", "AUD"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="size">Shoe size (optional)</label>
              <span className="hint">US sizing. Leave blank and I will say fit is unknown.</span>
              <input id="size" className="input" type="number" min={1} max={20} step={0.5} value={prefs.shoeSize ?? ""} placeholder="e.g. 10.5" onChange={e => { setPref("shoeSize", e.target.value === "" ? null : Number(e.target.value)); flashSaved(); }} />
            </div>
            <div className="field">
              <label htmlFor="location">Home location</label>
              <span className="hint">Used by place-based modules (restaurants, travel). Never shared without a connector you approved.</span>
              <input id="location" className="input" type="text" value={prefs.location} placeholder="City, State" onChange={e => { setPref("location", e.target.value); flashSaved(); }} />
            </div>
            <TagInput label="Brands to avoid" hint="Never recommended, whatever the score." values={prefs.avoid} onChange={v => { setPref("avoid", v); flashSaved(); }} placeholder="e.g. Northline" />
            <TagInput label="Styles to avoid" hint="running, court, casual, trail, lifestyle" values={prefs.avoidStyles} onChange={v => { setPref("avoidStyles", v); flashSaved(); }} placeholder="e.g. trail" />
          </div>
          <div className="field" style={{ marginTop: 16 }}>
            <label htmlFor="notes">Other non-negotiables</label>
            <span className="hint">Free text. Shown to the advocate with every request; it cannot be silently overridden.</span>
            <textarea id="notes" className="input" value={prefs.notes} placeholder="e.g. No subscriptions. Ask before anything is added to a cart." onChange={e => { setPref("notes", e.target.value); flashSaved(); }} />
          </div>
        </section>

        <section className="card span-5">
          <div className="kicker">Adjustable priorities</div>
          <h2>How to rank what passes</h2>
          <p className="small muted" style={{ marginBottom: 18 }}>These only order options that already satisfy every hard constraint. Change them and the recommendations change with them.</p>
          <PrioritySliders value={profile.priorities} onChange={pr => { setProfile(p => ({ ...p, priorities: pr })); flashSaved(); }} />
          <div className="gate" style={{ marginTop: 18 }}><span className="lock">ℹ️</span><span>Raw values are normalized to 100%. Setting all three to zero falls back to equal weights.</span></div>
        </section>

        <section className="card span-5">
          <div className="kicker">Preferences</div>
          <h2>Nice to have</h2>
          <p className="small muted" style={{ marginBottom: 14 }}>Soft signals. They add a matched rule in the explanation but never reject anything.</p>
          <div style={{ display: "grid", gap: 14 }}>
            <TagInput label="Styles I like" hint="e.g. lifestyle, running" values={prefs.styles} onChange={v => { setPref("styles", v); flashSaved(); }} placeholder="e.g. lifestyle" />
            <TagInput label="Brands I like" hint="Preferred, not required" values={prefs.brands} onChange={v => { setPref("brands", v); flashSaved(); }} placeholder="e.g. Kestrel" />
          </div>
        </section>

        <section className="card soft span-7">
          <div className="kicker">Your profile as data</div>
          <h2>What the advocate actually reads</h2>
          <p className="small muted" style={{ marginBottom: 10 }}>Stored in this browser only. Swappable for authenticated per-user storage later; nothing leaves the device unless a live search or LLM reply is configured.</p>
          <pre className="mono small" style={{ margin: 0, whiteSpace: "pre-wrap", background: "var(--surface)", padding: 14, borderRadius: 12, border: "1px solid var(--border)" }}>{JSON.stringify(profile, null, 2)}</pre>
        </section>
      </div>
    </>
  );
}
