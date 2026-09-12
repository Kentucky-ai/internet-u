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
}

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
      "Reject high-friction subscription or app-required shoes",
      "Require genuine support/cushioning for daily walking",
    ],
  },
  learnedRules: [
    "User prefers arch support and breathable mesh over heavy leather.",
    "Do not recommend hype sneakers with inflated resale markups.",
  ],
};

const STORAGE_KEY = "internet_u_profile_v1";

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

