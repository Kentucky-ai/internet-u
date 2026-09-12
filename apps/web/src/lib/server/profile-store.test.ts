import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { readVault, writeVault, deleteVault, isValidUid } from "./profile-store";

const uid = "test-vault-user-0001";

describe("profile-store (local-file fallback)", () => {
  before(async () => deleteVault(uid));
  after(async () => {
    await deleteVault(uid);
    await rm(path.join(process.cwd(), ".data", "vault"), { recursive: true, force: true }).catch(() => undefined);
  });

  it("validates ids", () => {
    assert.equal(isValidUid("abc"), false);
    assert.equal(isValidUid("../etc/passwd"), false);
    assert.equal(isValidUid(uid), true);
  });

  it("returns null for an unknown id", async () => {
    const r = await readVault(uid);
    assert.equal(r.doc, null);
    assert.equal(r.backend, "local-file");
  });

  it("merges partial writes", async () => {
    await writeVault(uid, { bio: { name: "A" } });
    const r = await writeVault(uid, { profile: { budget: 150 } });
    assert.deepEqual(r.doc.bio, { name: "A" });
    assert.deepEqual(r.doc.profile, { budget: 150 });
    assert.ok(r.doc.updatedAt);
    const back = await readVault(uid);
    assert.deepEqual(back.doc?.profile, { budget: 150 });
  });
});
