"use client";

/**
 * The advocate's hands.
 *
 * Every tool the chat agent can call on the web surface is registered here.
 * Each one runs in the browser against the same state the page renders, and
 * each one that matters goes through the Guardian — the search results are
 * screened on the server, a purchase only opens the approval modal (the
 * server gate decides after the user's click), a tile on a protected topic
 * is refused, and a rule change is a proposal the user approves or rejects.
 */
import { useFrontendTool, useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";
import type { UserProfile } from "@/lib/user-profile";
import { saveUserProfile } from "@/lib/user-profile";
import type { UserBio } from "@/lib/user-bio";
import { saveUserBio, summarizeBio } from "@/lib/user-bio";
import { SNEAKER_CATALOG } from "@/lib/sneakers-data";
import { rankSneakers, type EvaluationResult } from "@/lib/ranking";
import { screenWithGuardian } from "@/lib/guardian";
import { localizeQuery } from "@/lib/location";
import { getUid, UID_HEADER } from "@/lib/vault-client";
import { recordDecision } from "@/lib/decisions";

interface AdvocateToolsProps {
  profile: UserProfile;
  bio: UserBio;
  onProfileUpdated: (p: UserProfile) => void;
  onBioUpdated: (b: UserBio) => void;
  onOpenSneakers: () => void;
  onStagePurchase: (evaluation: EvaluationResult) => void;
  onCreateTile: (request: string) => { title: string } | null;
}

const card: React.CSSProperties = { background: "#ffffff", border: "1px solid #dbdbe5", borderRadius: "12px", padding: "12px 14px", fontSize: "12px", color: "#111827", margin: "6px 0" };
const pill = (bg: string, fg: string): React.CSSProperties => ({ display: "inline-block", padding: "2px 8px", borderRadius: "999px", backgroundColor: bg, color: fg, fontSize: "11px", fontWeight: 700, marginRight: "6px" });

function brief(r: EvaluationResult) {
  return {
    productId: r.product.id,
    name: `${r.product.brand} ${r.product.name}`,
    price: r.product.price,
    score: r.score,
    comfort: r.product.comfortScore,
    style: r.product.styleScore,
    why: r.explanation,
    tradeoffs: r.tradeoffs,
    guardian: r.guardian ? { blocked: r.guardian.blocked, cautions: r.guardian.cautions } : undefined,
  };
}

export function AdvocateTools({ profile, bio, onProfileUpdated, onBioUpdated, onOpenSneakers, onStagePurchase, onCreateTile }: AdvocateToolsProps) {
  useFrontendTool({
    name: "read_my_rules_and_bio",
    description: "Read the user's current rules (budget, priorities, brand exclusions, learned lessons) and bio (faith, lifestyle, age, abilities, protections). Call this before recommending anything.",
    parameters: z.object({}),
    handler: async () => ({
      budget: profile.budget,
      currency: profile.currency,
      priorities: profile.priorities,
      avoidBrands: profile.preferences.avoidBrands,
      nonNegotiables: profile.preferences.nonNegotiables,
      learnedRules: profile.learnedRules,
      bio: summarizeBio(bio),
      locationShared: Boolean(bio.location),
    }),
  });

  useFrontendTool({
    name: "search_web",
    description: "Search the live web with Exa. Results are screened by the user's Guardian on the server; anything held back is returned with the reason so you can tell the user. If the user has shared a location, the query is grounded to it.",
    parameters: z.object({
      query: z.string().describe("A natural-language search."),
      results: z.number().int().min(1).max(8).default(5),
    }),
    handler: async ({ query, results }) => {
      const sent = localizeQuery(query, bio.location);
      const uid = getUid();
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(uid ? { [UID_HEADER]: uid } : {}) },
        body: JSON.stringify({ query: sent, results }),
      });
      const data = await res.json();
      return {
        sentQuery: sent,
        groundedTo: bio.location?.label ?? null,
        results: data.results,
        held: data.held ?? [],
        guardian: data.guardian?.summary ?? null,
      };
    },
    render: ({ args, result, status }) => {
      const r = result as { sentQuery?: string; results?: Array<{ title: string; url: string; highlight?: string }> | string; held?: Array<{ title: string; reasons: string[] }>; groundedTo?: string | null } | undefined;
      return (
        <div style={card}>
          <span style={pill("#fef3c7", "#b45309")}>Exa</span>
          {r?.groundedTo && <span style={pill("#ede9fe", "#5b21b6")}>📍 {r.groundedTo}</span>}
          <strong>{r?.sentQuery ?? args.query ?? "Searching…"}</strong>
          {status !== "complete" && <div style={{ color: "#6b7280" }}>Searching the live web…</div>}
          {typeof r?.results === "string" && <div style={{ color: "#991b1b", marginTop: "6px" }}>{r.results}</div>}
          {Array.isArray(r?.results) &&
            r.results.slice(0, 5).map((h) => (
              <div key={h.url} style={{ marginTop: "6px" }}>
                <a href={h.url} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>{h.title}</a>
                {h.highlight && <div style={{ color: "#374151", fontStyle: "italic" }}>“{h.highlight.slice(0, 160)}”</div>}
              </div>
            ))}
          {r?.held && r.held.length > 0 && (
            <div style={{ marginTop: "8px", color: "#991b1b" }}>
              🛡 Guardian held back {r.held.length}: {r.held.map((h) => h.title).join("; ")}
            </div>
          )}
        </div>
      );
    },
  });

  useFrontendTool({
    name: "rank_sneakers",
    description: "Rank the sneaker catalog against the user's budget, priorities, brand exclusions and Guardian. Returns the top picks per perspective and everything that was rejected with reasons. Opens the sneaker experience on screen.",
    parameters: z.object({
      focus: z.enum(["overall", "budget", "comfort", "style"]).default("overall"),
      query: z.string().optional().describe("Optional filter, e.g. 'running' or a brand."),
    }),
    handler: async ({ focus, query }) => {
      const q = (query ?? "").toLowerCase().trim();
      const catalog = q
        ? SNEAKER_CATALOG.filter((p) => [p.name, p.brand, p.category, p.description].some((s) => s.toLowerCase().includes(q)))
        : SNEAKER_CATALOG;
      const r = rankSneakers(catalog, profile, bio);
      onOpenSneakers();
      const list = focus === "budget" ? r.bestBudget : focus === "comfort" ? r.bestComfort : focus === "style" ? r.bestStyle : r.overall;
      return {
        focus,
        budget: profile.budget,
        top: list.slice(0, 3).map(brief),
        rejected: r.rejected.map((x) => ({ productId: x.product.id, name: `${x.product.brand} ${x.product.name}`, price: x.product.price, reasons: x.violatedRules })),
        summary: r.summary,
      };
    },
    render: ({ result }) => {
      const r = result as { top?: ReturnType<typeof brief>[]; rejected?: Array<{ name: string; reasons: string[] }>; focus?: string } | undefined;
      if (!r?.top) return <div style={card}>Ranking against your rules…</div>;
      return (
        <div style={card}>
          <span style={pill("#dcfce7", "#166534")}>Ranked · {r.focus}</span>
          {r.top.map((t, i) => (
            <div key={t.productId} style={{ marginTop: "6px" }}>
              <strong>#{i + 1} {t.name}</strong> — ${t.price.toFixed(2)} · score {t.score}
              <div style={{ color: "#374151" }}>{t.why}</div>
            </div>
          ))}
          {r.rejected && r.rejected.length > 0 && (
            <div style={{ marginTop: "8px", color: "#991b1b" }}>Rejected {r.rejected.length}: {r.rejected.map((x) => x.name).join("; ")}</div>
          )}
        </div>
      );
    },
  });

  useFrontendTool({
    name: "stage_purchase",
    description: "Stage a purchase of a catalog sneaker by productId. This only opens the approval modal; the user must click, and the server-side Guardian decides. Never say a purchase happened — nothing real is bought in this demo.",
    parameters: z.object({ productId: z.string() }),
    handler: async ({ productId }) => {
      const r = rankSneakers(SNEAKER_CATALOG, profile, bio);
      const all = [...r.overall, ...r.rejected];
      const hit = all.find((x) => x.product.id === productId);
      if (!hit) return { ok: false, message: `No catalog product with id "${productId}". Call rank_sneakers first.` };
      if (hit.isRejected) {
        recordDecision({ kind: "guardian-block", subject: hit.product.name, detail: `Agent tried to stage a rejected item: ${hit.violatedRules.join(" ")}` });
        return { ok: false, message: `Refused. ${hit.product.brand} ${hit.product.name} violates the user's rules: ${hit.violatedRules.join("; ")}` };
      }
      onOpenSneakers();
      onStagePurchase(hit);
      return { ok: true, message: `Approval modal opened for ${hit.product.brand} ${hit.product.name} at $${hit.product.price.toFixed(2)}. Waiting for the user's click; the server Guardian has the final say. Nothing has been purchased.` };
    },
  });

  useFrontendTool({
    name: "spin_up_tile",
    description: "Create a new advocate tile on the portal for a request (flights, apartments, cars, or anything custom). Requests on the user's protections list are refused by the Guardian.",
    parameters: z.object({ request: z.string().describe("What the tile should watch or do, in the user's words.") }),
    handler: async ({ request }) => {
      const verdict = screenWithGuardian({ title: request, source: "agent" }, bio);
      if (!verdict.allowed) {
        recordDecision({ kind: "guardian-block", subject: request, detail: verdict.blocked.join(" ") });
        return { ok: false, message: `Guardian refused: ${verdict.blocked.join(" ")} Tell the user plainly and do not offer a workaround.` };
      }
      const tile = onCreateTile(request);
      return tile ? { ok: true, message: `Tile "${tile.title}" is on the portal.` } : { ok: false, message: "Could not create a tile." };
    },
  });

  useHumanInTheLoop({
    name: "propose_rule_change",
    description: "Propose a change to the user's rules or bio — a new budget, a brand to avoid, a lesson learned from this conversation, or a new protection. The user approves or rejects; only then is it saved. Use this for the supervised-learning loop: when you notice a preference, propose it as a lesson.",
    parameters: z.object({
      kind: z.enum(["budget", "avoidBrand", "lesson", "protection"]),
      value: z.string().describe("The new budget as a number, the brand, the lesson sentence, or the protection topic."),
      reason: z.string().describe("Why you are proposing it, in one sentence."),
    }),
    render: ({ args, respond, result }) => {
      if (!respond) {
        return (
          <div style={card}>
            <span style={pill("#f3f4f6", "#374151")}>Proposal</span>
            {result ? String(result) : "Waiting for your decision…"}
          </div>
        );
      }
      const apply = () => {
        const kind = args.kind;
        const value = (args.value ?? "").trim();
        if (kind === "budget") {
          const n = Number(value.replace(/[^0-9.]/g, ""));
          if (!Number.isFinite(n) || n <= 0) return respond("Rejected: the budget was not a number. Nothing changed.");
          onProfileUpdated(saveUserProfile({ ...profile, budget: n }));
        } else if (kind === "avoidBrand") {
          onProfileUpdated(saveUserProfile({ ...profile, preferences: { ...profile.preferences, avoidBrands: [...profile.preferences.avoidBrands, value] } }));
        } else if (kind === "lesson") {
          onProfileUpdated(saveUserProfile({ ...profile, learnedRules: [...profile.learnedRules, value] }));
        } else if (kind === "protection") {
          onBioUpdated(saveUserBio({ ...bio, protections: [...bio.protections, value] }));
        }
        recordDecision({ kind: "lesson", subject: value, detail: `${kind} approved by the user: ${args.reason ?? ""}` });
        respond(`Approved and saved to the vault (${kind}: ${value}). It applies to every request from now on.`);
      };
      return (
        <div style={{ ...card, borderColor: "#c4b5fd" }}>
          <span style={pill("#ede9fe", "#5b21b6")}>Proposed {args.kind}</span>
          <strong>{args.value}</strong>
          <div style={{ color: "#374151", margin: "4px 0 8px" }}>{args.reason}</div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={apply} style={{ padding: "6px 12px", borderRadius: "8px", backgroundColor: "#010507", color: "#fff", border: "none", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>
              Approve
            </button>
            <button type="button" onClick={() => { recordDecision({ kind: "lesson", subject: args.value ?? "", detail: `${args.kind} rejected by the user.` }); respond("The user rejected this. Nothing was changed; do not re-propose it."); }} style={{ padding: "6px 12px", borderRadius: "8px", backgroundColor: "transparent", color: "#57575b", border: "1px solid #dbdbe5", fontWeight: 500, fontSize: "12px", cursor: "pointer" }}>
              Reject
            </button>
          </div>
        </div>
      );
    },
  });

  return null;
}
