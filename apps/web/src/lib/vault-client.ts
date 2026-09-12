/**
 * Browser side of the vault: one anonymous id per browser, one document per id.
 * No imports from the profile modules so it can be lazy-loaded from them.
 */
export const UID_KEY = "internet_u_uid";
export const UID_HEADER = "x-internet-u-uid";

export interface VaultDoc {
  profile?: unknown;
  bio?: unknown;
  decisions?: unknown[];
  updatedAt?: string;
  backend?: "netlify-blobs" | "local-file";
}

export function getUid(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let uid = localStorage.getItem(UID_KEY);
    if (!uid) {
      uid = (crypto.randomUUID ? crypto.randomUUID() : `u-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(UID_KEY, uid);
    }
    return uid;
  } catch {
    return null;
  }
}

export async function pullVault(): Promise<VaultDoc | null> {
  const uid = getUid();
  if (!uid) return null;
  try {
    const res = await fetch("/api/profile", { headers: { [UID_HEADER]: uid }, cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { doc: VaultDoc | null; backend: VaultDoc["backend"] };
    return data.doc ? { ...data.doc, backend: data.backend } : { backend: data.backend };
  } catch {
    return null;
  }
}

export async function pushVault(partial: Omit<VaultDoc, "updatedAt" | "backend">): Promise<VaultDoc | null> {
  const uid = getUid();
  if (!uid) return null;
  try {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", [UID_HEADER]: uid },
      body: JSON.stringify(partial),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { doc: VaultDoc; backend: VaultDoc["backend"] };
    window.dispatchEvent(new CustomEvent("internet_u_vault_synced", { detail: data }));
    return { ...data.doc, backend: data.backend };
  } catch {
    return null;
  }
}

export async function clearVault(): Promise<void> {
  const uid = getUid();
  if (!uid) return;
  try {
    await fetch("/api/profile", { method: "DELETE", headers: { [UID_HEADER]: uid } });
  } catch {
    /* offline is fine */
  }
}
