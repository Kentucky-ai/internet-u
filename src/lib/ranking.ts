import type { Profile, Product, Ranked, RankResult, Perspective } from "./types";
import { normalizeWeights, money, topKey } from "./profile";

const norm = (s: string) => s.trim().toLowerCase();
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Deterministic ranking. Hard constraints reject first; weights only order what survives.
 * budgetScore: 1 at free, 0 at the budget line (cheaper is better, linear).
 * comfort/style: product 0-100 scores over 100; missing score => 0.5 and an "unknown".
 */
export function rankProducts(products: Product[], profile: Profile): RankResult {
  const w = normalizeWeights(profile.priorities);
  const avoidBrands = profile.preferences.avoid.map(norm).filter(Boolean);
  const avoidStyles = profile.preferences.avoidStyles.map(norm).filter(Boolean);
  const likedStyles = profile.preferences.styles.map(norm).filter(Boolean);
  const likedBrands = profile.preferences.brands.map(norm).filter(Boolean);

  const accepted: Ranked[] = [];
  const rejected: Ranked[] = [];

  for (const p of products) {
    const matched: string[] = [], violated: string[] = [], na: string[] = [], tradeoffs: string[] = [], unknowns: string[] = [];

    if (p.price > profile.budget) violated.push(`Over budget (${money(p.price, p.currency)} > ${money(profile.budget, profile.currency)})`);
    else matched.push(`Under your ${money(profile.budget, profile.currency)} budget`);

    if (avoidBrands.length) {
      if (avoidBrands.includes(norm(p.brand))) violated.push(`Brand "${p.brand}" is on your avoid list`);
      else matched.push("No excluded brand");
    } else na.push("No brands excluded");

    if (avoidStyles.length) {
      const st = norm(p.style ?? "");
      if (st && avoidStyles.includes(st)) violated.push(`Style "${p.style}" is on your avoid list`);
      else matched.push("No excluded style");
    } else na.push("No styles excluded");

    if (likedStyles.length && p.style && likedStyles.includes(norm(p.style))) matched.push(`Matches a style you like (${p.style})`);
    if (likedBrands.length && likedBrands.includes(norm(p.brand))) matched.push(`Matches a brand you like (${p.brand})`);

    if (profile.preferences.shoeSize == null) unknowns.push("Shoe size not set, so fit was not checked");
    else na.push(`Size ${profile.preferences.shoeSize} noted; availability by size was not verified`);
    if (p.durabilityScore == null) unknowns.push("Long-term durability was not independently verified");
    if (p.comfortScore == null) unknowns.push("No comfort data for this product");
    if (p.styleScore == null) unknowns.push("No style data for this product");
    if (p.scoresNote) unknowns.push(p.scoresNote);

    const budgetPart = profile.budget > 0 ? clamp01(1 - p.price / profile.budget) : 0;
    const comfortPart = p.comfortScore == null ? 0.5 : clamp01(p.comfortScore / 100);
    const stylePart = p.styleScore == null ? 0.5 : clamp01(p.styleScore / 100);
    const score = w.budget * budgetPart + w.comfort * comfortPart + w.style * stylePart;

    if (comfortPart >= 0.75 && stylePart < 0.6) tradeoffs.push("Strong on comfort, weaker on style");
    if (stylePart >= 0.75 && comfortPart < 0.6) tradeoffs.push("Strong on style, weaker on comfort");
    if (budgetPart >= 0.5 && (comfortPart < 0.6 || stylePart < 0.6)) tradeoffs.push("Well under budget; comfort or style scores are middling");
    if (budgetPart < 0.15 && violated.length === 0) tradeoffs.push("Close to your budget line; little room left");

    const r: Ranked = { product: p, score, parts: { budget: budgetPart, comfort: comfortPart, style: stylePart }, matchedRules: matched, violatedRules: violated, notApplicable: na, tradeoffs, unknowns, explanation: "" };
    r.explanation = explain(r, profile, w);
    (violated.length ? rejected : accepted).push(r);
  }

  accepted.sort((a, b) => b.score - a.score || a.product.price - b.product.price);
  rejected.sort((a, b) => a.product.price - b.product.price);

  const pick = (key: (r: Ranked) => number) => accepted.length ? accepted.reduce((best, r) => (key(r) > key(best) ? r : best)) : null;
  const best: Record<Perspective, Ranked | null> = {
    overall: accepted[0] ?? null,
    budget: pick(r => r.parts.budget),
    comfort: pick(r => r.parts.comfort),
    style: pick(r => r.parts.style),
  };
  return { accepted, rejected, best, weights: w };
}

function explain(r: Ranked, profile: Profile, w: { budget: number; comfort: number; style: number }): string {
  const top = topKey(w);
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  if (r.violatedRules.length) return `Set aside: ${r.violatedRules.join("; ")}. Weights never override a hard rule.`;
  const strongest = topKey(r.parts);
  const parts = [`Ranks at ${pct(r.score)} under your current priorities (${top} weighted highest).`];
  parts.push(`It is ${money(r.product.price, r.product.currency)} against a ${money(profile.budget, profile.currency)} budget`);
  parts.push(`and its strongest attribute for you is ${strongest} (${pct(r.parts[strongest])}).`);
  if (r.tradeoffs.length) parts.push(`Tradeoff: ${r.tradeoffs[0].toLowerCase()}.`);
  return parts.join(" ");
}

export const perspectiveLabel: Record<Perspective, string> = {
  overall: "Best match for your current priorities",
  budget: "Best budget fit",
  comfort: "Best comfort tradeoff",
  style: "Best style match",
};
