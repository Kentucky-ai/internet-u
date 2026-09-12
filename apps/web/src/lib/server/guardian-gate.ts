/**
 * Server-side Guardian. The browser screens for speed; this screens for real.
 *
 * Every route that returns recommendations or executes an approval reads the
 * bio from the vault by the caller's id and runs the same deterministic
 * guardian. A modified client, a prompt injection, or a vendor page cannot
 * get an item past it, because the check does not trust the request body's
 * idea of who the user is.
 */
import { readVault } from "./profile-store";
import { DEFAULT_USER_BIO, normalizeBio, type UserBio } from "../user-bio";
import { screenWithGuardian, type GuardianSubject, type GuardianVerdict } from "../guardian";

export type BioSource = "vault" | "default";

export async function bioForUid(uid: string | null): Promise<{ bio: UserBio; source: BioSource }> {
  if (!uid) return { bio: DEFAULT_USER_BIO, source: "default" };
  const { doc } = await readVault(uid);
  if (doc?.bio) return { bio: normalizeBio(doc.bio as Partial<UserBio>), source: "vault" };
  return { bio: DEFAULT_USER_BIO, source: "default" };
}

export async function gate(uid: string | null, subject: GuardianSubject): Promise<{ verdict: GuardianVerdict; source: BioSource; bio: UserBio }> {
  const { bio, source } = await bioForUid(uid);
  return { verdict: screenWithGuardian(subject, bio), source, bio };
}
