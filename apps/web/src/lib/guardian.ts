/**
 * The Guardian — deterministic screening of anything the advocate is about to
 * show the user, against the user's own bio.
 *
 * It runs before an item reaches the screen and it never needs an API key. An
 * LLM can add nuance later; the floor is enforced here, in code, so a prompt
 * injection or a vendor's copy cannot talk its way past it.
 */
import type { UserBio } from "./user-bio";

export interface GuardianSubject {
  title: string;
  description?: string;
  tags?: string[];
  /** Where the item came from, for the explanation only. */
  source?: string;
}

export interface GuardianVerdict {
  allowed: boolean;
  /** Reasons the item was blocked outright. */
  blocked: string[];
  /** Things to double-check; shown, not hidden. */
  cautions: string[];
  /** Bio lines the item was checked against and passed. */
  honored: string[];
}

/**
 * Synonym table. A protection like "Gambling" has to catch "sportsbook"; the
 * user should not have to enumerate the industry's vocabulary.
 */
const TOPIC_TERMS: Record<string, string[]> = {
  gambling: ["gambl", "betting", " bet ", "bets", "casino", "sportsbook", "lottery", "poker", "slots", "wager", "parlay", "odds boost"],
  alcohol: ["alcohol", "beer", "wine", "liquor", "spirits", "vodka", "whiskey", "whisky", "bourbon", "tequila", "brewery", "cocktail", "happy hour", "seltzer"],
  tobacco: ["tobacco", "cigarette", "cigar", "vape", "vaping", "nicotine", "e-cig", "hookah"],
  adult: ["adult content", "explicit", "xxx", "nsfw", "onlyfans", "escort"],
  lending: ["payday", "cash advance", "title loan", "buy now pay later", "bnpl", "rent-to-own", "0% apr for", "financing available", "installment"],
  resale: ["resale", "resell", "stockx", "goat app", "hype drop", "limited drop", "raffle", "markup", "aftermarket"],
  crypto: ["crypto", "bitcoin", "ethereum", "token", "nft", "memecoin", "airdrop", "staking"],
  mlm: ["mlm", "multi-level", "network marketing", "downline", "become a distributor", "join my team"],
  weapons: ["firearm", "handgun", "rifle", "ammo", "ammunition"],
  drugs: ["cannabis", "thc", "marijuana", "kratom", "delta-8"],
};

const TOPIC_ALIASES: Record<string, string> = {
  gambling: "gambling", betting: "gambling", casino: "gambling", "sports betting": "gambling",
  alcohol: "alcohol", drinking: "alcohol", booze: "alcohol", liquor: "alcohol",
  tobacco: "tobacco", smoking: "tobacco", vaping: "tobacco", nicotine: "tobacco",
  adult: "adult", porn: "adult", pornography: "adult",
  lending: "lending", "payday loans": "lending", loans: "lending", "predatory lending": "lending", financing: "lending", debt: "lending",
  resale: "resale", hype: "resale", "hype resale": "resale", "hype resale markups": "resale",
  crypto: "crypto", cryptocurrency: "crypto", nft: "crypto",
  mlm: "mlm", "multi-level marketing": "mlm", "network marketing": "mlm",
  weapons: "weapons", guns: "weapons", firearms: "weapons",
  drugs: "drugs", cannabis: "drugs", weed: "drugs",
};

/** Age gates that apply regardless of the protections list. */
const AGE_GATES: Array<{ topic: string; minAge: number; label: string }> = [
  { topic: "alcohol", minAge: 21, label: "Alcohol (21+)" },
  { topic: "gambling", minAge: 21, label: "Gambling (21+)" },
  { topic: "tobacco", minAge: 21, label: "Tobacco & vaping (21+)" },
  { topic: "adult", minAge: 18, label: "Adult content (18+)" },
  { topic: "weapons", minAge: 18, label: "Weapons (18+)" },
];

function normalize(s: string): string {
  return ` ${s.toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, " ")} `;
}

/** Map a user-written protection to a known topic, or null for a free phrase. */
export function resolveTopic(protection: string): string | null {
  const key = protection.trim().toLowerCase().replace(/[&/,]+/g, " ").replace(/\s+/g, " ");
  if (TOPIC_ALIASES[key]) return TOPIC_ALIASES[key];
  for (const [alias, topic] of Object.entries(TOPIC_ALIASES)) {
    if (key.includes(alias)) return topic;
  }
  return null;
}

function termsFor(protection: string): string[] {
  const topic = resolveTopic(protection);
  const own = protection.trim().toLowerCase();
  const terms = topic ? [...TOPIC_TERMS[topic]] : [];
  if (own.length >= 3 && !topic) terms.push(own);
  return terms;
}

function matches(text: string, terms: string[]): string | null {
  for (const t of terms) {
    if (text.includes(t.startsWith(" ") ? t : t)) return t.trim();
  }
  return null;
}

/**
 * Lifestyle / practice lines phrased as exclusions become protections:
 *   "Alcohol-free" → alcohol; "No leather" → leather; "Avoid caffeine" → caffeine.
 */
export function derivedProtections(bio: UserBio): Array<{ term: string; from: string }> {
  const out: Array<{ term: string; from: string }> = [];
  const explicitTopics = new Set(bio.protections.map(resolveTopic).filter((t): t is string => t !== null));
  const explicitRaw = new Set(bio.protections.map((p) => p.trim().toLowerCase()));
  const lines = [...bio.lifestyle, ...bio.faithPractices, ...bio.values, ...bio.abilities];
  for (const line of lines) {
    const m = line.match(/^(?:no|never|avoid|avoiding)\s+(.+?)(?:\s+[—-].*)?$/i) || line.match(/^(.+?)-free\b/i);
    if (!m) continue;
    const term = m[1].trim();
    const topic = resolveTopic(term);
    // Already covered by an explicit protection — do not report it twice.
    if ((topic && explicitTopics.has(topic)) || explicitRaw.has(term.toLowerCase())) continue;
    out.push({ term, from: line });
  }
  return out;
}

export function screenWithGuardian(subject: GuardianSubject, bio: UserBio): GuardianVerdict {
  const titleText = normalize(subject.title);
  const bodyText = normalize([subject.description ?? "", ...(subject.tags ?? [])].join(" "));
  const allText = titleText + bodyText;
  const blocked: string[] = [];
  const cautions: string[] = [];
  const honored: string[] = [];
  const balanced = bio.guardianMode === "balanced";

  // 1. Explicit protections ("never recommend").
  for (const p of bio.protections) {
    const terms = termsFor(p);
    if (!terms.length) continue;
    const inTitle = matches(titleText, terms);
    const inBody = inTitle ? null : matches(bodyText, terms);
    if (inTitle) blocked.push(`Protected topic "${p}" — matched "${inTitle}".`);
    else if (inBody) (balanced ? cautions : blocked).push(`Protected topic "${p}" — mentioned in the details ("${inBody}").`);
    else honored.push(`Clear of "${p}".`);
  }

  // 2. Exclusions written into lifestyle / faith / values / abilities.
  for (const { term, from } of derivedProtections(bio)) {
    const terms = termsFor(term);
    const hit = matches(allText, terms);
    if (hit) blocked.push(`Conflicts with your bio line "${from}" — matched "${hit}".`);
    else honored.push(`Respects "${from}".`);
  }

  // 3. Age gates, independent of the list above.
  if (bio.age !== null) {
    for (const gate of AGE_GATES) {
      const hit = matches(allText, TOPIC_TERMS[gate.topic]);
      if (hit && bio.age < gate.minAge) blocked.push(`${gate.label}: you are ${bio.age} — matched "${hit}".`);
    }
    honored.push(`Age gate checked for ${bio.age}.`);
  }

  // 4. Faith practices and abilities the item may strain — surfaced, never silent.
  for (const practice of bio.faithPractices) {
    const p = practice.toLowerCase();
    if ((p.includes("sunday") || p.includes("sabbath")) && /(flash sale|ends today|today only|limited time|act now|hurry)/.test(allText)) {
      cautions.push(`Urgency push on an item — your practice: "${practice}".`);
    }
  }
  for (const ability of bio.abilities) {
    const a = ability.toLowerCase();
    if (/(stairs|mobility|wheelchair|knee|knees|walk)/.test(a) && /(walk-up|stairs|no elevator|hike|climb|steep)/.test(allText)) {
      cautions.push(`May strain "${ability}".`);
    }
    if (/(vision|sight|see)/.test(a) && /(small print|fine print|tiny)/.test(allText)) {
      cautions.push(`Readability concern for "${ability}".`);
    }
    if (/(hearing|deaf)/.test(a) && /(audio-only|phone only|call to)/.test(allText)) {
      cautions.push(`Access concern for "${ability}".`);
    }
  }

  return { allowed: blocked.length === 0, blocked, cautions, honored };
}

/** Screen a list; returns the split plus a one-line summary for the UI. */
export function screenMany<T>(
  items: T[],
  toSubject: (item: T) => GuardianSubject,
  bio: UserBio
): { passed: Array<{ item: T; verdict: GuardianVerdict }>; blocked: Array<{ item: T; verdict: GuardianVerdict }>; summary: string } {
  const passed: Array<{ item: T; verdict: GuardianVerdict }> = [];
  const blocked: Array<{ item: T; verdict: GuardianVerdict }> = [];
  for (const item of items) {
    const verdict = screenWithGuardian(toSubject(item), bio);
    (verdict.allowed ? passed : blocked).push({ item, verdict });
  }
  const summary = blocked.length
    ? `Guardian held back ${blocked.length} of ${items.length} results.`
    : `Guardian cleared all ${items.length} results.`;
  return { passed, blocked, summary };
}
