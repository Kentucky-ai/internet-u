/**
 * The vault, server side.
 *
 * On Netlify the document lives in Netlify Blobs (durable, per deploy context).
 * Anywhere else — `next dev`, a laptop, CI — it falls back to a JSON file under
 * `.data/`, which is gitignored. The API is the same either way and the route
 * reports which backend answered, so the UI can say "saved to your vault" or
 * "saved on this machine" truthfully.
 */
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

export type VaultBackend = "netlify-blobs" | "local-file";

export interface VaultDoc {
  profile?: unknown;
  bio?: unknown;
  decisions?: unknown[];
  updatedAt: string;
}

const STORE_NAME = "internet-u-vault";
const LOCAL_DIR = path.join(process.cwd(), ".data", "vault");
const UID_RE = /^[A-Za-z0-9_-]{8,64}$/;

export function isValidUid(uid: unknown): uid is string {
  return typeof uid === "string" && UID_RE.test(uid);
}

type BlobStore = {
  get: (key: string, opts: { type: "json" }) => Promise<unknown>;
  setJSON: (key: string, value: unknown) => Promise<void>;
  delete: (key: string) => Promise<void>;
};

async function blobStore(): Promise<BlobStore | null> {
  try {
    const mod = await import("@netlify/blobs");
    // Throws MissingBlobsEnvironmentError outside a Netlify runtime.
    return mod.getStore({ name: STORE_NAME, consistency: "strong" }) as unknown as BlobStore;
  } catch {
    return null;
  }
}

function localFile(uid: string): string {
  return path.join(LOCAL_DIR, `${uid}.json`);
}

export async function vaultBackend(): Promise<VaultBackend> {
  return (await blobStore()) ? "netlify-blobs" : "local-file";
}

export async function readVault(uid: string): Promise<{ doc: VaultDoc | null; backend: VaultBackend }> {
  const store = await blobStore();
  if (store) {
    try {
      const doc = (await store.get(uid, { type: "json" })) as VaultDoc | null;
      return { doc: doc ?? null, backend: "netlify-blobs" };
    } catch {
      /* fall through to the file */
    }
  }
  try {
    const raw = await readFile(localFile(uid), "utf8");
    return { doc: JSON.parse(raw) as VaultDoc, backend: "local-file" };
  } catch {
    return { doc: null, backend: store ? "netlify-blobs" : "local-file" };
  }
}

export async function writeVault(uid: string, partial: Partial<VaultDoc>): Promise<{ doc: VaultDoc; backend: VaultBackend }> {
  const { doc: existing } = await readVault(uid);
  const doc: VaultDoc = {
    ...(existing ?? {}),
    ...(partial.profile !== undefined ? { profile: partial.profile } : {}),
    ...(partial.bio !== undefined ? { bio: partial.bio } : {}),
    ...(partial.decisions !== undefined ? { decisions: partial.decisions } : {}),
    updatedAt: new Date().toISOString(),
  };
  const store = await blobStore();
  if (store) {
    try {
      await store.setJSON(uid, doc);
      return { doc, backend: "netlify-blobs" };
    } catch {
      /* fall through to the file */
    }
  }
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(localFile(uid), JSON.stringify(doc, null, 2), "utf8");
  return { doc, backend: "local-file" };
}

export async function deleteVault(uid: string): Promise<void> {
  const store = await blobStore();
  if (store) {
    try {
      await store.delete(uid);
    } catch {
      /* ignore */
    }
  }
  try {
    await unlink(localFile(uid));
  } catch {
    /* already gone */
  }
}
