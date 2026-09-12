"use client";

/**
 * /me — About Me & Guardian.
 *
 * The user's full bio, written by the user, persisted to the vault. The
 * Guardian preview on the right runs the same deterministic screen the server
 * runs, and the "Try to approve" button calls the real server gate so the
 * refusal you see in the demo is the refusal a modified client would get.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  UserBio,
  DEFAULT_USER_BIO,
  loadUserBio,
  saveUserBio,
  resetUserBio,
  summarizeBio,
} from "@/lib/user-bio";
import { screenWithGuardian, derivedProtections } from "@/lib/guardian";
import { hydrateFromVault } from "@/lib/persistence";
import { loadDecisions, DECISIONS_EVENT, recordDecision, type Decision } from "@/lib/decisions";
import { getUid, UID_HEADER, clearVault, pushVault } from "@/lib/vault-client";
import { LocationControl } from "@/components/guardian-card";

type ListKey = "faithPractices" | "lifestyle" | "abilities" | "values" | "protections" | "goals";

const SUGGESTED_PROTECTIONS = [
  "Gambling & betting",
  "Alcohol",
  "Tobacco & vaping",
  "Adult content",
  "Predatory lending",
  "Hype resale markups",
  "Crypto speculation",
  "Multi-level marketing",
];

const SECTIONS: Array<{ key: ListKey; title: string; hint: string; placeholder: string }> = [
  { key: "faithPractices", title: "Faith practices to honor", hint: "What the advocate must respect, in your words.", placeholder: "e.g. No shopping pushes on Sunday" },
  { key: "lifestyle", title: "Lifestyle", hint: "Lines like “Alcohol-free” or “No leather” become protections automatically.", placeholder: "e.g. Alcohol-free" },
  { key: "abilities", title: "Abilities & accessibility", hint: "Physical needs the advocate should plan around, not apologize for.", placeholder: "e.g. Bad knees — avoid long stairs" },
  { key: "values", title: "Values", hint: "How you want to spend, not just how much.", placeholder: "e.g. Buy local when the price is close" },
  { key: "protections", title: "Protect me from", hint: "Hard no. The Guardian blocks these on the server, whatever a page says.", placeholder: "e.g. Payday loans" },
  { key: "goals", title: "Goals", hint: "What you want the internet to do for you.", placeholder: "e.g. Stop getting pushed things I did not ask for" },
];

const card: React.CSSProperties = { background: "#ffffff", borderRadius: "16px", border: "1px solid #dbdbe5", padding: "24px" };
const label: React.CSSProperties = { fontSize: "12px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px", display: "block" };
const input: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #dbdbe5", fontSize: "13px", boxSizing: "border-box" };
const chip: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", backgroundColor: "#f3f4f6", fontSize: "12px", fontWeight: 600, color: "#111827" };
const primaryBtn: React.CSSProperties = { padding: "9px 18px", borderRadius: "8px", backgroundColor: "#010507", color: "#ffffff", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" };
const ghostBtn: React.CSSProperties = { padding: "9px 18px", borderRadius: "8px", backgroundColor: "transparent", color: "#57575b", border: "1px solid #dbdbe5", fontSize: "13px", fontWeight: 500, cursor: "pointer" };

function ChipList({ items, onRemove }: { items: string[]; onRemove: (i: number) => void }) {
  if (!items.length) return <div style={{ fontSize: "12px", color: "#9ca3af" }}>Nothing yet.</div>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {items.map((it, i) => (
        <span key={`${it}-${i}`} style={chip}>
          {it}
          <button type="button" aria-label={`Remove ${it}`} onClick={() => onRemove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "14px", lineHeight: 1, padding: 0 }}>
            &times;
          </button>
        </span>
      ))}
    </div>
  );
}

export default function AboutMePage() {
  const [bio, setBio] = useState<UserBio>(DEFAULT_USER_BIO);
  const [drafts, setDrafts] = useState<Record<ListKey, string>>({ faithPractices: "", lifestyle: "", abilities: "", values: "", protections: "", goals: "" });
  const [backend, setBackend] = useState<"netlify-blobs" | "local-file" | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);

  // Guardian preview
  const [testTitle, setTestTitle] = useState("DraftKings Sportsbook — $200 in bonus bets");
  const [testDesc, setTestDesc] = useState("Limited time: ends today. Deposit $5, get $200.");
  const [serverResult, setServerResult] = useState<{ status: number; blocked: string[]; source: string } | null>(null);
  const [serverBusy, setServerBusy] = useState(false);

  useEffect(() => {
    setBio(loadUserBio());
    setDecisions(loadDecisions());
    hydrateFromVault().then((r) => {
      setBio(r.bio);
      setBackend(r.backend);
      setDecisions(r.decisions);
    });
    const onDecisions = (e: Event) => setDecisions((e as CustomEvent<Decision[]>).detail);
    window.addEventListener(DECISIONS_EVENT, onDecisions);
    return () => window.removeEventListener(DECISIONS_EVENT, onDecisions);
  }, []);

  const preview = useMemo(() => screenWithGuardian({ title: testTitle, description: testDesc }, bio), [testTitle, testDesc, bio]);
  const derived = useMemo(() => derivedProtections(bio), [bio]);

  const notify = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const persist = (next: UserBio) => {
    const saved = saveUserBio(next);
    setBio(saved);
    return saved;
  };

  const handleSave = () => {
    persist(bio);
    notify(backend === "netlify-blobs" ? "Saved to your vault (Netlify Blobs)." : "Saved. Vault on this machine.");
  };

  const handleReset = async () => {
    const def = resetUserBio();
    setBio(def);
    await clearVault();
    notify("Bio reset to the demo persona and vault cleared.");
  };

  const addTo = (key: ListKey, value?: string) => {
    const v = (value ?? drafts[key]).trim();
    if (!v) return;
    if (bio[key].some((x) => x.toLowerCase() === v.toLowerCase())) return;
    setBio({ ...bio, [key]: [...bio[key], v] });
    setDrafts({ ...drafts, [key]: "" });
  };

  const removeFrom = (key: ListKey, i: number) => setBio({ ...bio, [key]: bio[key].filter((_, idx) => idx !== i) });

  const tryServerApprove = async () => {
    setServerBusy(true);
    setServerResult(null);
    try {
      // Persist first — and wait for it — so the server gate reads the bio on
      // screen, not a stale or missing one.
      const saved = saveUserBio(bio, { remote: false });
      setBio(saved);
      await pushVault({ bio: saved });
      const uid = getUid();
      const res = await fetch("/api/guardian", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(uid ? { [UID_HEADER]: uid } : {}) },
        body: JSON.stringify({ action: "approve", subject: { title: testTitle, description: testDesc } }),
      });
      const data = (await res.json()) as { verdict?: { blocked: string[] }; bioSource?: string };
      const blocked = data.verdict?.blocked ?? [];
      setServerResult({ status: res.status, blocked, source: data.bioSource ?? "?" });
      recordDecision({
        kind: res.status === 403 ? "guardian-block" : "approval",
        subject: testTitle,
        detail: res.status === 403 ? `Server gate refused: ${blocked.join(" ")}` : "Server gate allowed the test item.",
      });
    } catch {
      setServerResult({ status: 0, blocked: ["Could not reach /api/guardian."], source: "?" });
    } finally {
      setServerBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ededf5", paddingBottom: "60px" }}>
      <header style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #dbdbe5", padding: "16px 32px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/" style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#010507", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "18px", textDecoration: "none" }}>
              U
            </Link>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.03em", color: "#010507" }}>About Me</span>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", backgroundColor: "#ede9fe", color: "#5b21b6" }}>Guardian</span>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#57575b" }}>Who you are, in your words. This is what the Guardian defends.</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#6b7280" }}>
              {backend === "netlify-blobs" ? "● Vault: Netlify Blobs" : backend === "local-file" ? "● Vault: this machine" : "○ Vault: connecting…"}
            </span>
            <Link href="/rules" style={ghostBtn}>Rules &amp; Budget</Link>
            <Link href="/" style={{ ...ghostBtn, textDecoration: "none" }}>&larr; Portal</Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "1280px", margin: "28px auto 0", padding: "0 24px" }}>
        {savedNotice && (
          <div style={{ padding: "12px 18px", borderRadius: "10px", backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #86efac", marginBottom: "20px", fontSize: "13px", fontWeight: 500 }}>
            ✓ {savedNotice}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "24px", alignItems: "start" }}>
          {/* Left: the bio */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={card}>
              <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 700, color: "#010507" }}>Identity</h2>
              <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#57575b" }}>Nothing here is inferred. If you leave it blank, the Guardian treats it as unknown, never as a guess.</p>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={label}>Name</label>
                  <input style={input} value={bio.name} onChange={(e) => setBio({ ...bio, name: e.target.value })} placeholder="What should the advocate call you?" />
                </div>
                <div>
                  <label style={label}>Age</label>
                  <input
                    style={input}
                    type="number"
                    min={0}
                    max={120}
                    value={bio.age ?? ""}
                    onChange={(e) => setBio({ ...bio, age: e.target.value === "" ? null : Math.max(0, Math.min(120, Number(e.target.value))) })}
                    placeholder="Sets the age gate"
                  />
                </div>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={label}>Faith</label>
                <input style={input} value={bio.faith} onChange={(e) => setBio({ ...bio, faith: e.target.value })} placeholder="Tradition, or “none” — your call" />
              </div>
              <div>
                <label style={label}>Guardian mode</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["strict", "balanced"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBio({ ...bio, guardianMode: m })}
                      style={{ ...ghostBtn, ...(bio.guardianMode === m ? { backgroundColor: "#010507", color: "#fff", borderColor: "#010507" } : {}) }}
                    >
                      {m === "strict" ? "Strict — block on any mention" : "Balanced — block on the item, caution on the details"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {SECTIONS.map((s) => (
              <div key={s.key} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#010507" }}>{s.title}</h3>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>{bio[s.key].length} lines</span>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#57575b" }}>{s.hint}</p>
                <div style={{ marginBottom: "10px" }}>
                  <ChipList items={bio[s.key]} onRemove={(i) => removeFrom(s.key, i)} />
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addTo(s.key);
                  }}
                  style={{ display: "flex", gap: "8px" }}
                >
                  <input style={{ ...input, flex: 1 }} value={drafts[s.key]} onChange={(e) => setDrafts({ ...drafts, [s.key]: e.target.value })} placeholder={s.placeholder} />
                  <button type="submit" style={primaryBtn}>Add</button>
                </form>
                {s.key === "protections" && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                    {SUGGESTED_PROTECTIONS.filter((p) => !bio.protections.some((x) => x.toLowerCase() === p.toLowerCase())).map((p) => (
                      <button key={p} type="button" onClick={() => addTo("protections", p)} style={{ ...chip, cursor: "pointer", border: "1px dashed #d1d5db", backgroundColor: "#fff" }}>
                        + {p}
                      </button>
                    ))}
                  </div>
                )}
                {s.key === "lifestyle" && derived.length > 0 && (
                  <div style={{ marginTop: "10px", fontSize: "12px", color: "#9a3412" }}>
                    Derived protections from your lines: {derived.map((d) => d.term).join(", ")}.
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button type="button" onClick={handleReset} style={ghostBtn}>Reset to demo persona</button>
              <button type="button" onClick={handleSave} style={{ ...primaryBtn, padding: "11px 26px" }}>Save to vault</button>
            </div>
          </div>

          {/* Right: what the Guardian does with it */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "sticky", top: "92px" }}>
            <div style={card}>
              <span style={{ ...label, color: "#5b21b6" }}>Location · on your terms</span>
              <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#57575b" }}>
                Used only to ground the Exa searches you run. Coarse, revocable, and shown on every search that uses it.
              </p>
              <LocationControl bio={bio} onBioUpdated={setBio} />
            </div>

            <div style={card}>
              <span style={{ ...label, color: "#5b21b6" }}>Guardian preview</span>
              <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#57575b" }}>
                Paste anything a platform might push at you. Left is the browser check; the button runs the real server gate against your saved bio.
              </p>
              <input style={{ ...input, marginBottom: "8px" }} value={testTitle} onChange={(e) => setTestTitle(e.target.value)} placeholder="Offer or product title" />
              <textarea style={{ ...input, minHeight: "64px", resize: "vertical", marginBottom: "12px" }} value={testDesc} onChange={(e) => setTestDesc(e.target.value)} placeholder="Description / pitch" />

              <div style={{ padding: "12px 14px", borderRadius: "10px", backgroundColor: preview.allowed ? "#f0fdf4" : "#fef2f2", border: `1px solid ${preview.allowed ? "#bbf7d0" : "#fecaca"}`, fontSize: "12px", color: preview.allowed ? "#166534" : "#991b1b", marginBottom: "10px" }}>
                <strong>{preview.allowed ? "Would pass" : "Would be blocked"}</strong>
                {preview.blocked.map((b, i) => (
                  <div key={`b${i}`}>⛔ {b}</div>
                ))}
                {preview.cautions.map((c, i) => (
                  <div key={`c${i}`} style={{ color: "#92400e" }}>⚠ {c}</div>
                ))}
                {preview.allowed && preview.honored.length > 0 && (
                  <div style={{ color: "#166534", marginTop: "4px" }}>Checked {preview.honored.length} bio lines.</div>
                )}
              </div>

              <button type="button" onClick={tryServerApprove} disabled={serverBusy} style={{ ...primaryBtn, width: "100%", cursor: serverBusy ? "wait" : "pointer" }}>
                {serverBusy ? "Asking the server…" : "Try to approve this through the server gate"}
              </button>
              {serverResult && (
                <div style={{ marginTop: "10px", padding: "10px 12px", borderRadius: "8px", backgroundColor: "#111827", color: "#e5e7eb", fontFamily: "'Spline Sans Mono', monospace", fontSize: "11px", lineHeight: 1.5 }}>
                  POST /api/guardian → <strong style={{ color: serverResult.status === 403 ? "#fca5a5" : "#86efac" }}>{serverResult.status || "ERR"}</strong> · bio from {serverResult.source}
                  {serverResult.blocked.map((b, i) => (
                    <div key={i}>refused: {b}</div>
                  ))}
                  {serverResult.status === 200 && <div>allowed — nothing on your bio objects.</div>}
                </div>
              )}
            </div>

            <div style={card}>
              <span style={{ ...label, color: "#5b21b6" }}>What the agent reads</span>
              <p style={{ margin: 0, fontSize: "12px", color: "#374151", lineHeight: 1.5 }}>{summarizeBio(bio)}</p>
            </div>

            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ ...label, color: "#5b21b6" }}>Decision ledger</span>
                <span style={{ fontSize: "11px", color: "#6b7280" }}>{decisions.length} entries</span>
              </div>
              {decisions.length === 0 ? (
                <div style={{ fontSize: "12px", color: "#9ca3af" }}>Every block, approval, and consent lands here — and in your vault.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "260px", overflowY: "auto" }}>
                  {decisions.slice(0, 20).map((d) => (
                    <div key={d.id} style={{ fontSize: "12px", borderLeft: `3px solid ${d.kind.startsWith("guardian") ? "#dc2626" : d.kind.startsWith("location") ? "#7c3aed" : "#16a34a"}`, paddingLeft: "8px" }}>
                      <div style={{ fontWeight: 600, color: "#111827" }}>{d.kind.replace("-", " ")} · {d.subject}</div>
                      <div style={{ color: "#6b7280" }}>{d.detail}</div>
                      <div style={{ color: "#9ca3af", fontSize: "11px" }}>{new Date(d.at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
