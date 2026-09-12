/**
 * Hydration: on load, pull the vault and let it win over whatever this browser
 * had cached. Local storage stays as the offline copy.
 */
import { loadUserProfile, saveUserProfile, type UserProfile } from "./user-profile";
import { loadUserBio, saveUserBio, normalizeBio, type UserBio } from "./user-bio";
import { loadDecisions, writeDecisions, type Decision } from "./decisions";
import { pullVault, pushVault, type VaultDoc } from "./vault-client";

export interface HydrationResult {
  backend: "netlify-blobs" | "local-file" | null;
  fromVault: boolean;
  profile: UserProfile;
  bio: UserBio;
  decisions: Decision[];
}

let inflight: Promise<HydrationResult> | null = null;

export function hydrateFromVault(): Promise<HydrationResult> {
  if (inflight) return inflight;
  inflight = (async () => {
    const doc = await pullVault();
    const localProfile = loadUserProfile();
    const localBio = loadUserBio();
    const localDecisions = loadDecisions();
    if (!doc || (!doc.profile && !doc.bio && !doc.decisions)) {
      // First visit on this id: seed the vault so server-side gates read the
      // same bio the page shows from the very first request.
      const seeded = await pushVault({ profile: localProfile, bio: localBio, decisions: localDecisions });
      return { backend: seeded?.backend ?? doc?.backend ?? null, fromVault: false, profile: localProfile, bio: localBio, decisions: localDecisions };
    }
    const profile = doc.profile ? saveUserProfile({ ...localProfile, ...(doc.profile as UserProfile) }, { remote: false }) : localProfile;
    const bio = doc.bio ? saveUserBio(normalizeBio(doc.bio as Partial<UserBio>), { remote: false }) : localBio;
    const decisions = Array.isArray(doc.decisions) ? (doc.decisions as Decision[]) : localDecisions;
    if (Array.isArray(doc.decisions)) writeDecisions(decisions, { remote: false });
    return { backend: doc.backend ?? null, fromVault: true, profile, bio, decisions };
  })().finally(() => {
    // Allow a later explicit re-hydrate (e.g. after reset).
    setTimeout(() => { inflight = null; }, 0);
  });
  return inflight;
}
