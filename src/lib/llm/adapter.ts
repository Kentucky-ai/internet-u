import type { Profile, RankResult } from "../types";
import { money, topKey } from "../profile";
import { perspectiveLabel } from "../ranking";

export type AgentReply = { text: string; clarifyingQuestion?: string; source: "llm" | "local" };

/** Calls /api/chat; if the server has no key or fails, returns a deterministic local reply. */
export async function agentReply(message: string, profile: Profile, ranking: RankResult, dataNote: string, signal?: AbortSignal): Promise<AgentReply> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST", headers: { "content-type": "application/json" }, signal,
      body: JSON.stringify({
        message, profile, weights: ranking.weights, dataNote,
        accepted: ranking.accepted.slice(0, 6).map(brief), rejected: ranking.rejected.map(brief),
        best: Object.fromEntries(Object.entries(ranking.best).map(([k, v]) => [k, v?.product.name ?? null])),
        missing: profile.preferences.shoeSize == null ? ["shoeSize"] : [],
      }),
    });
    if (res.ok) {
      const d = await res.json();
      if (typeof d.text === "string" && d.text.trim()) return { text: d.text, clarifyingQuestion: d.clarifyingQuestion || undefined, source: "llm" };
    }
  } catch { /* fall through */ }
  return localReply(profile, ranking);
}

function brief(r: RankResult["accepted"][number]) {
  return { name: r.product.name, brand: r.product.brand, price: r.product.price, score: Math.round(r.score * 100), matched: r.matchedRules, violated: r.violatedRules, tradeoffs: r.tradeoffs, unknowns: r.unknowns };
}

export function localReply(profile: Profile, ranking: RankResult): AgentReply {
  const w = ranking.weights;
  const top = topKey(w);
  const lines: string[] = [];
  if (!ranking.accepted.length) {
    lines.push(`Nothing in the results fits your rules. All ${ranking.rejected.length} options broke a hard constraint (most often the ${money(profile.budget, profile.currency)} budget). Raise the budget in My Rules or widen the search.`);
  } else {
    const o = ranking.best.overall!;
    lines.push(`${perspectiveLabel.overall}: ${o.product.name} at ${money(o.product.price, o.product.currency)}. You weight ${top} highest right now, and this one ranks at ${Math.round(o.score * 100)}%.`);
    for (const k of ["budget", "comfort", "style"] as const) {
      const b = ranking.best[k];
      if (b && b.product.id !== o.product.id) lines.push(`${perspectiveLabel[k]}: ${b.product.name} (${money(b.product.price, b.product.currency)}).`);
    }
    if (ranking.rejected.length) lines.push(`${ranking.rejected.length} option${ranking.rejected.length > 1 ? "s were" : " was"} set aside for breaking your rules; they are listed separately, not hidden.`);
    lines.push("Move the priority sliders and the ranking updates. Nothing gets added to a cart without your approval.");
  }
  const q = profile.preferences.shoeSize == null ? "One thing I don't know: your shoe size. Add it in My Rules if you want fit considered." : undefined;
  return { text: lines.join(" "), clarifyingQuestion: q, source: "local" };
}
