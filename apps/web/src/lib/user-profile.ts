export interface SovereignKnowledgeRule {
  id: string;
  category: "General" | "Finance" | "Travel" | "Shopping" | "Housing" | "Privacy" | "Custom";
  rule: string;
  type: "hard_constraint" | "preference" | "strict_exclusion";
  enabled: boolean;
}

export interface UserPriorities {
  budget: number;
  comfort: number;
  style: number;
}

export interface UserPreferences {
  shoeSize: string | null;
  brands: string[];
  avoidBrands: string[];
  styles: string[];
  nonNegotiables: string[];
}

export interface UserProfile {
  id: string;
  budget: number;
  currency: string;
  priorities: UserPriorities;
  preferences: UserPreferences;
  learnedRules: string[];
  knowledgeRules: SovereignKnowledgeRule[];
}

export const DEFAULT_KNOWLEDGE_RULES: SovereignKnowledgeRule[] = [
  {
    id: "kb-1",
    category: "Finance",
    rule: "Always enforce all-in pricing with zero undisclosed fees or surprise checkout markups.",
    type: "hard_constraint",
    enabled: true,
  },
  {
    id: "kb-2",
    category: "Privacy",
    rule: "Strip third-party tracking pixels, referral cookies, and dynamic surge pricing.",
    type: "strict_exclusion",
    enabled: true,
  },
  {
    id: "kb-3",
    category: "General",
    rule: "Hard action gate: Never execute purchases or enter credit cards without explicit human sign-off.",
    type: "hard_constraint",
    enabled: true,
  },
  {
    id: "kb-4",
    category: "Travel",
    rule: "Require full overhead carry-on baggage; reject unbundled basic economy tickets.",
    type: "preference",
    enabled: true,
  },
  {
    id: "kb-5",
    category: "Shopping",
    rule: "Filter artificial resale markups, hype scalpers, and sponsored affiliate ranking listicles.",
    type: "strict_exclusion",
    enabled: true,
  },
  {
    id: "kb-6",
    category: "Housing",
    rule: "Eliminate broker fee traps; verify in-unit laundry and true out-the-door lease cost.",
    type: "hard_constraint",
    enabled: true,
  },
];

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: "demo-user",
  budget: 150,
  currency: "USD",
  priorities: {
    budget: 60,
    comfort: 25,
    style: 15,
  },
  preferences: {
    shoeSize: "10.5",
    brands: ["Nike", "New Balance", "Adidas", "Brooks"],
    avoidBrands: ["Balenciaga", "Yeezy"],
    styles: ["Casual", "Running", "Minimalist"],
    nonNegotiables: [
      "Must not exceed budget under any circumstances",
      "Reject high-friction subscription or app-required items",
      "Require genuine quality and durability for everyday use",
    ],
  },
  learnedRules: [
    "User prefers arch support and breathable mesh over heavy leather.",
    "Do not recommend hype sneakers with inflated resale markups.",
  ],
  knowledgeRules: DEFAULT_KNOWLEDGE_RULES,
};

const STORAGE_KEY = "internet_u_profile_v2";

export function loadUserProfile(): UserProfile {
  if (typeof window === "undefined") {
    return DEFAULT_USER_PROFILE;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_USER_PROFILE,
        ...parsed,
        priorities: {
          ...DEFAULT_USER_PROFILE.priorities,
          ...(parsed.priorities || {}),
        },
        preferences: {
          ...DEFAULT_USER_PROFILE.preferences,
          ...(parsed.preferences || {}),
        },
        learnedRules: parsed.learnedRules || DEFAULT_USER_PROFILE.learnedRules,
        knowledgeRules: parsed.knowledgeRules || DEFAULT_KNOWLEDGE_RULES,
      };
    }
  } catch (err) {
    console.warn("Failed to load user profile from storage:", err);
  }
  return DEFAULT_USER_PROFILE;
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent("internet_u_profile_updated", { detail: profile }));
  } catch (err) {
    console.warn("Failed to save user profile to storage:", err);
  }
}

export function resetUserProfile(): UserProfile {
  saveUserProfile(DEFAULT_USER_PROFILE);
  return DEFAULT_USER_PROFILE;
}
