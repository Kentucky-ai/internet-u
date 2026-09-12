import { describe, it, expect } from "vitest";
import { rankProducts } from "./ranking";
import { defaultProfile, normalizeWeights } from "./profile";
import { mockProducts } from "./products/mock";
import type { Profile } from "./types";

const p = (over: Partial<Profile> = {}): Profile => ({ ...defaultProfile, ...over, preferences: { ...defaultProfile.preferences, ...(over.preferences ?? {}) } });

describe("hard constraints", () => {
  it("rejects every product over budget regardless of scores", () => {
    const r = rankProducts(mockProducts, p({ budget: 150, priorities: { budget: 0, comfort: 0, style: 100 } }));
    expect(r.rejected.length).toBeGreaterThan(0);
    for (const x of r.accepted) expect(x.product.price).toBeLessThanOrEqual(150);
    for (const x of r.rejected) expect(x.violatedRules.join()).toMatch(/Over budget/);
  });
  it("rejects avoided brands", () => {
    const brand = mockProducts[0].brand;
    const r = rankProducts(mockProducts, p({ preferences: { ...defaultProfile.preferences, avoid: [brand.toLowerCase()] } }));
    expect(r.accepted.some(x => x.product.brand === brand)).toBe(false);
    expect(r.rejected.some(x => x.product.brand === brand)).toBe(true);
  });
  it("never reports the best-of-perspective from the rejected set", () => {
    const r = rankProducts(mockProducts, p());
    for (const k of ["overall", "budget", "comfort", "style"] as const) if (r.best[k]) expect(r.best[k]!.violatedRules).toEqual([]);
  });
});

describe("priority weights re-rank", () => {
  it("normalizes weights to sum 1 and handles all-zero", () => {
    const w = normalizeWeights({ budget: 60, comfort: 25, style: 15 });
    expect(w.budget + w.comfort + w.style).toBeCloseTo(1);
    expect(normalizeWeights({ budget: 0, comfort: 0, style: 0 }).budget).toBeCloseTo(1 / 3);
  });
  it("raising style moves a stylish shoe up; raising budget moves the cheapest up", () => {
    const styleFirst = rankProducts(mockProducts, p({ priorities: { budget: 5, comfort: 5, style: 90 } }));
    const budgetFirst = rankProducts(mockProducts, p({ priorities: { budget: 90, comfort: 5, style: 5 } }));
    expect(styleFirst.accepted[0].product.id).toBe(styleFirst.best.style!.product.id);
    expect(budgetFirst.accepted[0].product.price).toBe(Math.min(...budgetFirst.accepted.map(x => x.product.price)));
    expect(styleFirst.accepted[0].product.id).not.toBe(budgetFirst.accepted[0].product.id);
  });
  it("is deterministic", () => {
    const a = rankProducts(mockProducts, p()), b = rankProducts(mockProducts, p());
    expect(a.accepted.map(x => [x.product.id, x.score])).toEqual(b.accepted.map(x => [x.product.id, x.score]));
  });
});
