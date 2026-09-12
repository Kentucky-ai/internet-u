import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProfile } from "../state/profile";
import { money } from "../lib/profile";
import { modules } from "../lib/modules";
import { applyOps, defaultTiles, loadTiles, saveTiles, type Tile, type TileOp } from "../lib/tiles";
import { hubAgent } from "../lib/agent/hub";
import { PrioritySliders } from "../components/PrioritySliders";

type Msg = { id: number; role: "user" | "agent"; text: string; source?: "llm" | "local"; via?: string };
type Health = { mode: string; brain?: { chatVia: string; chatModel: string; search: string; imageGeneration: string | null } };
let msgId = 1;

export function Home() {
  const { profile, setProfile, decisions, addDecision, clearDecisions, user } = useProfile();
  const navigate = useNavigate();
  const [tiles, setTiles] = useState<Tile[]>(loadTiles);
  const [messages, setMessages] = useState<Msg[]>([{ id: 0, role: "agent", text: "This is your hub. Ask for anything: I can open a module, add or remove tiles, or request a scoped connection to one of your accounts. I never act on your behalf without approval." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<Health | null>(null);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => { saveTiles(tiles); }, [tiles]);
  useEffect(() => { fetch("/api/health").then(r => (r.ok ? r.json() : null)).then(h => setHealth(h && h.ok ? h : { mode: "demo" })).catch(() => setHealth({ mode: "demo" })); }, []);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  const push = (m: Omit<Msg, "id">) => { const id = msgId++; setMessages(ms => [...ms, { ...m, id }]); };

  const run = useCallback(async (text: string) => {
    const q = text.trim(); if (!q || busy) return;
    setInput(""); push({ role: "user", text: q }); setBusy(true);
    const r = await hubAgent(q, profile, tiles);
    const activeRoutes = new Set(modules.filter(m => m.status === "active" && m.route).map(m => m.route!));
    const opens = r.ops.filter((o): o is Extract<TileOp, { op: "open" }> => o.op === "open");
    const open = opens.find(o => activeRoutes.has(o.route));
    const edits = r.ops.filter((o): o is Exclude<TileOp, { op: "open" }> => o.op !== "open");
    // An "open" for a module that is not active becomes a permission request instead of a dead route.
    for (const o of opens) if (!activeRoutes.has(o.route)) {
      const m = modules.find(x => o.route.includes(x.id));
      if (m) edits.push({ op: "add", tile: { kind: "permission", title: `Connect: ${m.name}`, span: 4, data: { connector: m.name, scopes: m.permissions, why: `You asked for ${m.name.toLowerCase()}; it is not connected yet.`, state: "requested" } } });
    }
    if (edits.length) {
      setTiles(t => applyOps(t, edits));
      const added = edits.filter(o => o.op === "add").map(o => (o as Extract<TileOp, { op: "add" }>).tile.title);
      if (added.length) { setLastAdded(added[0]); setTimeout(() => setLastAdded(null), 1600); }
      addDecision("recommendation", `Hub: ${edits.map(o => (o.op === "add" ? `added "${(o as Extract<TileOp, { op: "add" }>).tile.title}"` : `removed a tile`)).join(", ")} (${r.source}).`);
    }
    push({ role: "agent", text: r.reply, source: r.source, via: r.via });
    setBusy(false);
    if (open && open.op === "open") navigate(`${open.route}?q=${encodeURIComponent(open.q ?? q)}`);
  }, [busy, profile, tiles, addDecision, navigate]);

  const removeTile = (id: string) => setTiles(t => t.filter(x => x.id !== id));
  const setPermission = (id: string, state: "approved" | "declined") => {
    setTiles(t => t.map(x => (x.id === id ? { ...x, data: { ...x.data, state } } : x)));
    const tile = tiles.find(x => x.id === id);
    addDecision(state === "approved" ? "approval" : "cancel", `${state === "approved" ? "Approved" : "Declined"} connection: ${tile?.data?.connector ?? "connector"} (${(tile?.data?.scopes ?? []).length} scopes). Demo: no account was actually linked.`);
  };

  const constraints = useMemo(() => [
    `Max ${money(profile.budget, profile.currency)}`,
    ...(profile.preferences.avoid.length ? [`Avoid ${profile.preferences.avoid.join(", ")}`] : []),
    ...(profile.preferences.avoidStyles.length ? [`No ${profile.preferences.avoidStyles.join(", ")}`] : []),
    ...(profile.preferences.shoeSize != null ? [`Size ${profile.preferences.shoeSize}`] : []),
    ...(profile.preferences.location ? [`📍 ${profile.preferences.location}`] : []),
    "Approval before any action",
  ], [profile]);

  const render = (t: Tile) => {
    const cls = `card span-${t.span}${lastAdded === t.title ? " flash" : ""}`;
    switch (t.kind) {
      case "hero": return (
        <section key={t.id} className={`card hero span-${t.span}`}>
          <div>
            <div className="pillrow" style={{ marginBottom: 14 }}><span className="pill accent">Your internet advocate</span><span className="pill">One hub for your whole life online</span><span className="pill ok">🔒 Nothing happens without your approval</span></div>
            <h1>Your internet, working for you.</h1>
            <p className="lede" style={{ marginTop: 10 }}>Shopping, food, travel, social, email, work: one agent that acts by <b>your</b> rules across all of it, in your browser, and changes this hub on request.</p>
          </div>
          <div className="pillrow">{constraints.map(c => <span key={c} className="pill">{c}</span>)}<Link to="/rules" className="btn sm">Edit My Rules →</Link></div>
        </section>);
      case "rules": return (
        <section key={t.id} className={cls}>
          <div className="kicker">Hard constraints</div><h2>Budget</h2>
          <div className="big">{money(profile.budget, profile.currency)}</div>
          <div className="budgetbar"><i style={{ width: `${Math.min(100, Math.round((profile.budget / 300) * 100))}%` }} /></div>
          <p className="small muted">Every module drops anything above this line, plus your avoid lists and non-negotiables{profile.preferences.notes ? `: "${profile.preferences.notes}"` : ""}.</p>
          <div style={{ marginTop: 12 }}><Link to="/rules" className="btn sm">Open My Rules</Link></div>
        </section>);
      case "priorities": return (
        <section key={t.id} className={cls}>
          <div className="kicker">Adjustable priorities</div><h2>How everything gets ranked</h2>
          <p className="small muted" style={{ marginBottom: 14 }}>Shared by every module. Change it here or in My Rules.</p>
          <PrioritySliders value={profile.priorities} onChange={pr => setProfile(p => ({ ...p, priorities: pr }))} compact />
        </section>);
      case "ask": return (
        <section key={t.id} className={`card span-${t.span} chat`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}><div><div className="kicker">Agent</div><h2>Ask your advocate</h2></div><span className="small muted">{user.authenticated ? user.name : "Demo user"}</span></div>
          <div className="chatlog" ref={logRef} aria-live="polite">
            {messages.map(m => <div key={m.id} className={`msg ${m.role}`}>{m.text}{m.role === "agent" && m.source && <span className="src">{m.source === "llm" ? `Agent reply via ${m.via ?? "LLM"}` : "Deterministic hub agent (no LLM key)"}</span>}</div>)}
            {busy && <div className="msg agent"><span className="typing"><i /><i /><i /></span> <span className="small muted">Working on the hub…</span></div>}
          </div>
          <form className="chatform" onSubmit={e => { e.preventDefault(); run(input); }}>
            <input className="input" value={input} onChange={e => setInput(e.target.value)} placeholder="Help me find sneakers… or: add a restaurants tile for tonight" aria-label="Your request" disabled={busy} />
            <button className="btn primary" type="submit" disabled={busy || !input.trim()}>Send</button>
          </form>
          <div className="suggest">
            <button className="btn sm ghost" onClick={() => run("Help me find sneakers.")} disabled={busy}>Help me find sneakers.</button>
            <button className="btn sm ghost" onClick={() => run("Add a tile with restaurants for dinner tonight near me that fit my budget")} disabled={busy}>Restaurants tonight</button>
            <button className="btn sm ghost" onClick={() => run("Show my social profile in the hub")} disabled={busy}>My social profile</button>
          </div>
          <div className="gate"><span className="lock">🔒</span><span>The agent can change tiles and search. Buying, booking, sending, posting and connecting accounts always stop for your approval.</span></div>
        </section>);
      case "modules": return (
        <section key={t.id} className={cls}>
          <div className="section-head" style={{ margin: "0 0 12px" }}><div><div className="kicker">Modules</div><h2>Your life online, by your rules</h2></div><span className="small muted">1 active · {modules.length - 1} connectors planned, each with explicit scopes</span></div>
          <div className="modules">
            {modules.map(m => m.status === "active" && m.route ? (
              <Link key={m.id} to={m.route} className="card module active">
                <span className="pill ok status">Active</span><div className="icon">{m.icon}</div><h3>{m.name}</h3><p className="small muted">{m.tagline}</p>
                <div className="perm">{m.permissions.map(p => <span key={p}>{p}</span>)}</div>
                <span className="btn sm primary" style={{ alignSelf: "flex-start" }}>Open →</span>
              </Link>
            ) : (
              <div key={m.id} className="card module planned">
                <span className="pill status">Planned</span><div className="icon">{m.icon}</div><h3>{m.name}</h3><p className="small muted">{m.tagline}</p>
                <div className="perm">{m.permissions.map(p => <span key={p}>{p}</span>)}</div>
              </div>
            ))}
          </div>
        </section>);
      case "brain": return (
        <section key={t.id} className={cls}>
          <div className="kicker">Brain</div><h2>Swappable model</h2>
          <div className="brain" style={{ marginTop: 10 }}>
            <div className="row"><span>Mode</span><b>{health ? (health.mode === "live-capable" ? "Live" : "Demo") : "…"}</b></div>
            <div className="row"><span>Agent + chat</span><b>{health?.brain ? `${health.brain.chatModel} · ${health.brain.chatVia}` : health ? "rules engine" : "…"}</b></div>
            <div className="row"><span>Search</span><b>{health?.brain?.search ?? (health ? "demo catalog" : "…")}</b></div>
            <div className="row"><span>Image renders</span><b>{health?.brain?.imageGeneration ?? "off (set OPENROUTER_API_KEY)"}</b></div>
            <div className="row"><span>Ranking</span><b>deterministic, local</b></div>
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>OpenRouter or the Netlify AI Gateway plug in server-side; the ranking never depends on the model.</p>
        </section>);
      case "decisions": return (
        <section key={t.id} className={cls}>
          <div className="section-head" style={{ margin: "0 0 8px" }}><div><div className="kicker">Memory</div><h2>Recent decisions</h2></div>{decisions.length > 0 && <button className="btn sm ghost" onClick={clearDecisions}>Clear</button>}</div>
          {decisions.length === 0 ? <div className="empty">No decisions yet. Recommendations, approvals, connections and rule changes land here.</div> : (
            <ul className="decisions">{decisions.slice(0, 7).map(d => <li key={d.id}><time dateTime={d.at}>{new Date(d.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time><span><span className={`badge ${d.kind}`}>{d.kind}</span>{d.text}</span></li>)}</ul>
          )}
        </section>);
      case "list": return (
        <section key={t.id} className={cls}>
          <div className="section-head" style={{ margin: "0 0 6px" }}><div><div className="kicker">Agent tile · {t.data?.provider ?? "search"}</div><h2>{t.title}</h2></div><button className="btn sm ghost" onClick={() => removeTile(t.id)} aria-label={`Remove ${t.title}`}>Remove</button></div>
          {t.data?.intro && <p className="small muted" style={{ marginBottom: 10 }}>{t.data.intro}</p>}
          {!t.data?.items?.length ? <div className="empty small">Nothing found yet.</div> : (
            <ul className="rules">{t.data.items.map((it, i) => (
              <li key={i} className={it.fits === false ? "bad" : "ok"}><span className="ic">{it.fits === false ? "✕" : "✓"}</span>
                <span style={{ flex: 1 }}><b>{it.url ? <a href={it.url} target="_blank" rel="noreferrer noopener">{it.name}</a> : it.name}</b>{it.price ? <span className="muted"> · {it.price}</span> : null}{it.subtitle && <><br /><span className="small muted">{it.subtitle}</span></>}{it.note && <><br /><span className="small" style={{ color: "var(--warn)" }}>{it.note}</span></>}</span>
              </li>))}</ul>
          )}
        </section>);
      case "note": return (
        <section key={t.id} className={cls}>
          <div className="section-head" style={{ margin: "0 0 6px" }}><div><div className="kicker">Agent tile</div><h2>{t.title}</h2></div><button className="btn sm ghost" onClick={() => removeTile(t.id)}>Remove</button></div>
          <p>{t.data?.text}</p>
        </section>);
      case "permission": return (
        <section key={t.id} className={cls} style={{ borderColor: "var(--warn)" }}>
          <div className="kicker">🔒 Permission request</div><h2>{t.title}</h2>
          <p className="small muted" style={{ margin: "6px 0 10px" }}>{t.data?.why}</p>
          <ul className="rules">{(t.data?.scopes ?? []).map(s => <li key={s} className="na"><span className="ic">•</span><span>{s}</span></li>)}</ul>
          {t.data?.state === "approved" ? <div className="notice" style={{ marginTop: 12 }}>Approved for demo purposes. No account was linked; this is where the {t.data.connector} connector would start with exactly these scopes.</div>
            : t.data?.state === "declined" ? <div className="notice warn" style={{ marginTop: 12 }}>Declined. Nothing was connected and I will not ask again unless you do.</div>
            : <div className="pillrow" style={{ marginTop: 12 }}><button className="btn sm" onClick={() => setPermission(t.id, "declined")}>Decline</button><button className="btn sm primary" onClick={() => setPermission(t.id, "approved")}>Approve these scopes</button></div>}
          <div style={{ marginTop: 10 }}><button className="btn sm ghost" onClick={() => removeTile(t.id)}>Remove tile</button></div>
        </section>);
      default: return null;
    }
  };

  return (
    <>
      <div className="bento">{tiles.map(render)}</div>
      <p className="small muted" style={{ marginTop: 18, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span>{tiles.filter(t => t.createdBy === "agent").length} agent-added tile{tiles.filter(t => t.createdBy === "agent").length === 1 ? "" : "s"}. Layout is saved in this browser.</span>
        <button className="btn sm ghost" onClick={() => setTiles(defaultTiles)}>Reset layout</button>
      </p>
    </>
  );
}
