/**
 * The user's full bio — who they are, not just what they are shopping for.
 *
 * Everything the Guardian screens against lives here: faith, lifestyle, age,
 * abilities, values, and an explicit "protect me from" list. The user writes
 * it, the user owns it, and no platform algorithm gets a say in it.
 */

export type GuardianMode = "strict" | "balanced";

export interface UserLocation {
  /** Human label, e.g. "Louisville, Kentucky". */
  label: string;
  /** Coarse coordinates (rounded to ~1 km). Never stored at full precision. */
  lat: number;
  lng: number;
  precision: "coarse";
  grantedAt: string;
}

export interface UserBio {
  name: string;
  age: number | null;
  /** Free text: tradition or "none". */
  faith: string;
  /** Practices the advocate must honor, e.g. "Keep Sunday free of shopping pushes". */
  faithPractices: string[];
  /** e.g. "Alcohol-free", "Father of a 9-year-old", "Early riser". */
  lifestyle: string[];
  /** Accessibility + physical needs, e.g. "Limited mobility — no stairs", "Low vision". */
  abilities: string[];
  /** What the user cares about, e.g. "Buy local", "Repairable over disposable". */
  values: string[];
  /** Hard "never recommend" topics. The Guardian blocks on these. */
  protections: string[];
  goals: string[];
  guardianMode: GuardianMode;
  /** Shared only after explicit consent. Null = never shared. */
  location: UserLocation | null;
  updatedAt: string;
}

/** Demo persona. Everything here is editable on /me and nothing is inferred. */
export const DEFAULT_USER_BIO: UserBio = {
  name: "Demo User",
  age: 38,
  faith: "Christian",
  faithPractices: ["Sunday is for family — no urgency pushes or flash sales that day"],
  lifestyle: ["Alcohol-free", "Parent of a 9-year-old", "On my feet all day at work"],
  abilities: ["Bad knees — need real cushioning, avoid long stairs"],
  values: ["Buy it once, buy it right", "Prefer local businesses when the price is close"],
  protections: ["Gambling & betting", "Alcohol", "Predatory lending", "Hype resale markups"],
  goals: ["Spend less time comparison shopping", "Stop getting pushed things I did not ask for"],
  guardianMode: "strict",
  location: null,
  updatedAt: "2026-09-12T00:00:00.000Z",
};

export const BIO_STORAGE_KEY = "internet_u_bio_v1";
export const BIO_UPDATED_EVENT = "internet_u_bio_updated";

export function normalizeBio(parsed: Partial<UserBio> | null | undefined): UserBio {
  const p = parsed || {};
  const list = (v: unknown, fallback: string[]) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : fallback;
  return {
    ...DEFAULT_USER_BIO,
    ...p,
    age: typeof p.age === "number" && Number.isFinite(p.age) ? p.age : p.age === null ? null : DEFAULT_USER_BIO.age,
    faithPractices: list(p.faithPractices, DEFAULT_USER_BIO.faithPractices),
    lifestyle: list(p.lifestyle, DEFAULT_USER_BIO.lifestyle),
    abilities: list(p.abilities, DEFAULT_USER_BIO.abilities),
    values: list(p.values, DEFAULT_USER_BIO.values),
    protections: list(p.protections, DEFAULT_USER_BIO.protections),
    goals: list(p.goals, DEFAULT_USER_BIO.goals),
    guardianMode: p.guardianMode === "balanced" ? "balanced" : "strict",
    location: p.location && typeof p.location === "object" && typeof (p.location as UserLocation).lat === "number"
      ? (p.location as UserLocation)
      : null,
  };
}

export function loadUserBio(): UserBio {
  if (typeof window === "undefined") return DEFAULT_USER_BIO;
  try {
    const raw = localStorage.getItem(BIO_STORAGE_KEY);
    if (raw) return normalizeBio(JSON.parse(raw));
  } catch (err) {
    console.warn("Failed to load bio from storage:", err);
  }
  return DEFAULT_USER_BIO;
}

export function saveUserBio(bio: UserBio, options: { remote?: boolean } = {}): UserBio {
  const next = { ...bio, updatedAt: new Date().toISOString() };
  if (typeof window === "undefined") return next;
  try {
    localStorage.setItem(BIO_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(BIO_UPDATED_EVENT, { detail: next }));
  } catch (err) {
    console.warn("Failed to save bio to storage:", err);
  }
  if (options.remote !== false) {
    // Lazy import keeps this module free of the vault client on the server.
    import("./vault-client").then((m) => m.pushVault({ bio: next })).catch(() => undefined);
  }
  return next;
}

export function resetUserBio(): UserBio {
  return saveUserBio(DEFAULT_USER_BIO);
}

/** One paragraph the agent can read. No coordinates, ever. */
export function summarizeBio(bio: UserBio): string {
  const parts: string[] = [];
  if (bio.name) parts.push(`Name: ${bio.name}.`);
  if (bio.age !== null) parts.push(`Age: ${bio.age}.`);
  if (bio.faith) parts.push(`Faith: ${bio.faith}.`);
  if (bio.faithPractices.length) parts.push(`Faith practices to honor: ${bio.faithPractices.join("; ")}.`);
  if (bio.lifestyle.length) parts.push(`Lifestyle: ${bio.lifestyle.join("; ")}.`);
  if (bio.abilities.length) parts.push(`Abilities and accessibility needs: ${bio.abilities.join("; ")}.`);
  if (bio.values.length) parts.push(`Values: ${bio.values.join("; ")}.`);
  if (bio.protections.length) parts.push(`Guardian protections (never recommend): ${bio.protections.join("; ")}.`);
  if (bio.goals.length) parts.push(`Goals: ${bio.goals.join("; ")}.`);
  parts.push(`Guardian mode: ${bio.guardianMode}.`);
  parts.push(bio.location ? `Location (coarse, user-approved): ${bio.location.label}.` : "Location: not shared.");
  return parts.join(" ");
}
