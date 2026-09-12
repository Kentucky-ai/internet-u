import type { Profile, Priorities } from "./types";

export const STORAGE_KEY = "internet-u.profile";

export const defaultProfile: Profile = {
  id: "demo-user",
  budget: 150,
  currency: "USD",
  priorities: { budget: 60, comfort: 25, style: 15 },
  preferences: { shoeSize: null, styles: [], brands: [], avoid: [], avoidStyles: [], notes: "" },
};

/** Weights as fractions that sum to 1. All-zero input falls back to equal thirds. */
export function normalizeWeights(p: Priorities): Priorities {
  const b = Math.max(0, p.budget), c = Math.max(0, p.comfort), s = Math.max(0, p.style);
  const sum = b + c + s;
  if (sum <= 0) return { budget: 1 / 3, comfort: 1 / 3, style: 1 / 3 };
  return { budget: b / sum, comfort: c / sum, style: s / sum };
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw);
    return {
      ...defaultProfile,
      ...parsed,
      priorities: { ...defaultProfile.priorities, ...(parsed.priorities ?? {}) },
      preferences: { ...defaultProfile.preferences, ...(parsed.preferences ?? {}) },
    };
  } catch {
    return defaultProfile;
  }
}

export function saveProfile(p: Profile) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* storage unavailable */ }
}

export function money(n: number, currency = "USD") {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n); }
  catch { return `${currency} ${n}`; }
}

export const PRIORITY_KEYS = ["budget", "comfort", "style"] as const;
export type PriorityKey = (typeof PRIORITY_KEYS)[number];
/** Key with the highest value; ties resolve in budget, comfort, style order. */
export function topKey(v: Record<PriorityKey, number>): PriorityKey {
  return PRIORITY_KEYS.reduce<PriorityKey>((best, k) => (v[k] > v[best] ? k : best), "budget");
}
