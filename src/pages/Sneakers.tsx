import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useProfile } from "../state/profile";
import { rankProducts, perspectiveLabel } from "../lib/ranking";
import { searchProducts, type SearchOutcome } from "../lib/products/search";
import { enrichImages } from "../lib/products/images";
import { agentReply } from "../lib/llm/adapter";
import { money, topKey } from "../lib/profile";
import type { Ranked, Perspective } from "../lib/types";
import { PrioritySliders } from "../components/PrioritySliders";
import { PerspectiveCard, ProductRow } from "../components/ProductCard";
import { WhyDrawer } from "../components/WhyDrawer";
import { ApprovalModal } from "../components/ApprovalModal";

type Msg = { id: number; role: "user" | "agent"; text: string; source?: "llm" | "local"; question?: string };
const PERSPECTIVES: Perspective[] = ["overall", "budget", "comfort", "style"];
const SNEAKER_RE = /sneaker|shoe|trainer|kicks|runner/i;
let msgId = 1;

export function Sneakers() {
  const { profile, setProfile, decisions, addDecision } = useProfile();
  const [messages, setMessages] = useState<Msg[]>([{ id: 0, role: "agent", text: `Sneaker module ready. Budget ${money(profile.budget, profile.currency)}, weights ${profile.priorities.budget}/${profile.priorities.comfort}/${profile.priorities.style}. I search real listings, drop anything that breaks a rule, and rank the rest your way.` }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<"idle" | "search" | "reply">("idle");
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null);
  const [why, setWhy] = useState<Ranked | null>(null);
  const [approve, setApprove] = useState<Ranked | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [proposal, setProposal] = useState<{ text: string; apply: () => void } | null>(null);
  const [flash, setFlash] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [photosLoading, setPhotosLoading] = useState(false);
  const autoRan = useRef(false);

  const ranking = useMemo(() => (outcome ? rankProducts(outcome.products, profile) : null), [outcome, profile]);

  // Re-rank feedback: flash the cards whenever the profile changes after results exist.
  const firstProfile = useRef(true);
  useEffect(() => {
    if (firstProfile.current) { firstProfile.current = false; return; }
    if (!outcome) return;
    setFlash(true); const t = setTimeout(() => setFlash(false), 900); return () => clearTimeout(t);
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);
  useEffect(() => { if (why) setWhy(w => w ? (ranking?.accepted.concat(ranking.rejected).find(x => x.product.id === w.product.id) ?? null) : null); }, [ranking]); // eslint-disable-line react-hooks/exhaustive-deps

  const push = (m: Omit<Msg, "id">) => { const id = msgId++; setMessages(ms => [...ms, { ...m, id }]); };

  const run = useCallback(async (text: string) => {
    const q = text.trim(); if (!q || busy !== "idle") return;
    setInput(""); push({ role: "user", text: q });
    if (!SNEAKER_RE.test(q)) {
      push({ role: "agent", text: "This proof of concept covers one job: finding sneakers by your rules. Try \"Help me find sneakers.\" Other domains (email, calendar, travel) plug in later through permissioned connectors.", source: "local" });
      return;
    }
    abortRef.current?.abort(); const ac = new AbortController(); abortRef.current = ac;
    setBusy("search"); setConfirmation(null); setProposal(null); setPhotoNote(null);
    const out = await searchProducts(q, profile, ac.signal);
    if (ac.signal.aborted) return;
    setOutcome(out);
    const rk = rankProducts(out.products, profile);
    setBusy("reply");
    // Real photos resolve in the background while the reply is written; cards fill in as they land.
    if (out.source === "live") {
      setPhotosLoading(true);
      enrichImages(out.products, ac.signal).then(im => {
        if (ac.signal.aborted) return;
        setOutcome(o => (o && o.products === out.products ? { ...o, products: im.products } : o));
        setPhotoNote(im.note); setPhotosLoading(false);
      });
    }
    const reply = await agentReply(q, profile, rk, out.note, ac.signal);
    if (ac.signal.aborted) return;
    push({ role: "agent", text: reply.text, source: reply.source, question: reply.clarifyingQuestion });
    addDecision("recommendation", `Ranked ${out.products.length} sneakers (${out.source}): ${rk.accepted.length} fit your rules, ${rk.rejected.length} set aside. Top: ${rk.best.overall?.product.name ?? "none"}.`);
    setBusy("idle");
  }, [busy, profile, addDecision]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !autoRan.current) { autoRan.current = true; setSearchParams({}, { replace: true }); void run(q); }
  }, [searchParams, setSearchParams, run]);

  const onApprove = (r: Ranked) => {
    setApprove(null);
    const msg = `Approved for demo purposes. ${r.product.name} (${money(r.product.price, r.product.currency)}) was recorded as your choice. No real purchase was made and no store was contacted.`;
    setConfirmation(msg);
    addDecision("approval", `Approved: add ${r.product.name} to cart (demo, no purchase).`);
    push({ role: "agent", text: msg, source: "local" });
    // Propose (never apply) a profile update based on what the user actually chose.
    const w = ranking?.weights; if (!w) return;
    const strongest = topKey(r.parts);
    const top = topKey(w);
    if (strongest !== top && r.parts[strongest] >= 0.7) {
      setProposal({
        text: `You chose an option whose strongest attribute is ${strongest}, though you currently weight ${top} highest. Want me to raise ${strongest} by 15 points? I will not change your rules unless you say yes.`,
        apply: () => { setProfile(p => ({ ...p, priorities: { ...p.priorities, [strongest]: Math.min(100, p.priorities[strongest] + 15) } })); addDecision("profile", `Raised ${strongest} priority by 15 (you approved the proposal).`); setProposal(null); },
      });
    }
  };
  const onCancel = () => { if (approve) addDecision("cancel", `Cancelled: add ${approve.product.name} to cart.`); setApprove(null); };

  const w = ranking?.weights;
  const budgetPct = Math.min(100, Math.round((profile.budget / 300) * 100));
  const constraints = [
    `Max ${money(profile.budget, profile.currency)}`,
    ...(profile.preferences.avoid.length ? [`Avoid ${profile.preferences.avoid.join(", ")}`] : []),
    ...(profile.preferences.avoidStyles.length ? [`No ${profile.preferences.avoidStyles.join(", ")}`] : []),
    ...(profile.preferences.shoeSize != null ? [`Size ${profile.preferences.shoeSize}`] : []),
    "Approval before any action",
  ];

  return (
    <>
      <div className="crumb"><Link to="/">Internet U</Link> / Modules / Shopping: sneakers</div>
      <div className="bento">
        <section className="card span-7 chat">
          <div className="row" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <div><div className="kicker">Module · Shopping</div><h2>👟 Sneakers, by your rules</h2></div>
            <div className="steps"><span className={busy === "search" ? "on" : ""}>Search</span><span className={busy !== "idle" || ranking ? "on" : ""}>Apply rules</span><span className={ranking ? "on" : ""}>Rank</span><span className={busy === "reply" ? "on" : ""}>Explain</span><span>Approve</span></div>
          </div>
          <div className="chatlog" ref={logRef} aria-live="polite">
            {messages.map(m => (
              <div key={m.id} className={`msg ${m.role}`}>
                {m.text}{m.question && <><br /><i>{m.question}</i></>}
                {m.role === "agent" && m.source && <span className="src">{m.source === "llm" ? "LLM reply over deterministic ranking" : "Deterministic reply (no LLM key needed)"}</span>}
              </div>
            ))}
            {busy !== "idle" && <div className="msg agent"><span className="typing"><i /><i /><i /></span> <span className="small muted">{busy === "search" ? "Searching live listings, then applying your rules…" : "Writing the explanation…"}</span></div>}
          </div>
          <form className="chatform" onSubmit={e => { e.preventDefault(); run(input); }}>
            <input className="input" value={input} onChange={e => setInput(e.target.value)} placeholder="Help me find sneakers." aria-label="Your request" disabled={busy !== "idle"} />
            <button className="btn primary" type="submit" disabled={busy !== "idle" || !input.trim()}>Send</button>
          </form>
          <div className="suggest"><button className="btn sm ghost" onClick={() => run("Help me find sneakers.")} disabled={busy !== "idle"}>Help me find sneakers.</button><button className="btn sm ghost" onClick={() => run("Find me comfortable running shoes")} disabled={busy !== "idle"}>Comfortable running shoes</button></div>
          <div className="gate"><span className="lock">🔒</span><span>This module may search listings. It may not add to a cart or buy without your explicit approval.</span></div>
        </section>

        <section className="card span-5">
          <div className="kicker">Rules in force</div>
          <h2>{money(profile.budget, profile.currency)} max</h2>
          <div className="budgetbar"><i style={{ width: `${budgetPct}%` }} /></div>
          <div className="pillrow" style={{ margin: "8px 0 16px" }}>{constraints.map(c => <span key={c} className="pill">{c}</span>)}<Link to="/rules" className="btn sm">Edit →</Link></div>
          <div className="kicker">Adjustable priorities</div>
          <p className="small muted" style={{ marginBottom: 12 }}>Move a slider and the results re-rank instantly.</p>
          <PrioritySliders value={profile.priorities} onChange={pr => setProfile(p => ({ ...p, priorities: pr }))} compact />
        </section>
      </div>

      {confirmation && <div className="notice" style={{ marginTop: 16 }}>{confirmation}</div>}
      {proposal && (
        <div className="notice info" style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ flex: 1 }}><b>Proposed rule update:</b> {proposal.text}</span>
          <button className="btn sm" onClick={() => { addDecision("profile", "Declined a proposed priority change."); setProposal(null); }}>No, keep my rules</button>
          <button className="btn sm primary" onClick={proposal.apply}>Yes, update</button>
        </div>
      )}

      {ranking && w && (
        <>
          <div className="section-head">
            <div><h2>Recommendations by your rules</h2><p className="small muted">{outcome?.note}. Weights now: budget {Math.round(w.budget * 100)}%, comfort {Math.round(w.comfort * 100)}%, style {Math.round(w.style * 100)}%.</p></div>
            <div className="pillrow"><span className={`pill ${outcome?.source === "live" ? "ok" : "warn"}`}>{outcome?.source === "live" ? "Live listings" : "Demo catalog"}</span>{photosLoading && <span className="pill">Fetching real photos…</span>}{photoNote && <span className="pill">Photos: {photoNote}</span>}</div>
          </div>
          {ranking.accepted.length === 0 ? (
            <div className="empty">No option meets your rules. Raise the budget or clear an avoid list in <Link to="/rules">My Rules</Link>.</div>
          ) : (
            <div className="perspectives">{PERSPECTIVES.map(k => <PerspectiveCard key={k} label={perspectiveLabel[k]} r={ranking.best[k]} flash={flash} onWhy={setWhy} onAct={setApprove} />)}</div>
          )}

          {ranking.accepted.length > 0 && (
            <>
              <div className="section-head"><h2>Everything that meets your rules</h2><span className="small muted">{ranking.accepted.length} options, ranked</span></div>
              <div className="list">{ranking.accepted.map((r, i) => <ProductRow key={r.product.id} r={r} index={i} onWhy={setWhy} onAct={setApprove} />)}</div>
            </>
          )}

          <div className="section-head"><h2 style={{ color: "var(--bad)" }}>Rejected by your rules</h2><span className="small muted">{ranking.rejected.length} set aside · shown, never hidden</span></div>
          {ranking.rejected.length === 0 ? <div className="empty">Nothing was rejected.</div> : <div className="list rejected">{ranking.rejected.map(r => <ProductRow key={r.product.id} r={r} rejected onWhy={setWhy} />)}</div>}
        </>
      )}

      {decisions.length > 0 && <p className="small muted" style={{ marginTop: 24 }}>{decisions.length} decision{decisions.length > 1 ? "s" : ""} recorded. <Link to="/">See them on your home</Link>.</p>}

      {why && ranking && <WhyDrawer r={why} profile={profile} weights={ranking.weights} onClose={() => setWhy(null)} />}
      {approve && <ApprovalModal r={approve} profile={profile} onCancel={onCancel} onApprove={onApprove} />}
    </>
  );
}
