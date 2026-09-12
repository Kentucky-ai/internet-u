import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { screenWithGuardian, derivedProtections, resolveTopic, screenMany } from "./guardian";
import { DEFAULT_USER_BIO, type UserBio } from "./user-bio";

const bio: UserBio = { ...DEFAULT_USER_BIO, location: null };

describe("guardian", () => {
  it("blocks an explicit protection by synonym", () => {
    const v = screenWithGuardian({ title: "DraftKings Sportsbook — $200 bonus bets" }, bio);
    assert.equal(v.allowed, false);
    assert.match(v.blocked[0], /Gambling & betting/);
  });

  it("derives protections from '-free' and 'No ...' bio lines", () => {
    const d = derivedProtections({ ...bio, protections: [], lifestyle: ["Alcohol-free", "No leather — vegan"], faithPractices: [], abilities: [], values: [] });
    assert.deepEqual(d.map((x) => x.term), ["Alcohol", "leather"]);
    // An explicit "Alcohol" protection absorbs the derived one instead of double-reporting.
    const deduped = derivedProtections({ ...bio, protections: ["Alcohol"], lifestyle: ["Alcohol-free"], faithPractices: [], abilities: [], values: [] });
    assert.deepEqual(deduped, []);
    const v = screenWithGuardian({ title: "Craft brewery tour", description: "six beers included" }, bio);
    assert.equal(v.allowed, false);
  });

  it("age-gates regardless of the protections list", () => {
    const teen: UserBio = { ...bio, age: 16, protections: [], lifestyle: [], faithPractices: [], abilities: [], values: [] };
    const v = screenWithGuardian({ title: "Vape starter kit" }, teen);
    assert.equal(v.allowed, false);
    assert.match(v.blocked[0], /21\+/);
  });

  it("balanced mode downgrades a details-only match to a caution", () => {
    const relaxed: UserBio = { ...bio, guardianMode: "balanced" };
    const v = screenWithGuardian({ title: "Running shoe", description: "as seen on StockX resale" }, relaxed);
    assert.equal(v.allowed, true);
    assert.equal(v.cautions.length, 1);
    const strict = screenWithGuardian({ title: "Running shoe", description: "as seen on StockX resale" }, bio);
    assert.equal(strict.allowed, false);
  });

  it("surfaces ability cautions instead of hiding the item", () => {
    const v = screenWithGuardian({ title: "Third-floor walk-up apartment", description: "no elevator" }, bio);
    assert.equal(v.allowed, true);
    assert.match(v.cautions[0], /Bad knees/);
  });

  it("passes a plain item and reports what it honored", () => {
    const v = screenWithGuardian({ title: "New Balance 574 Core", description: "ENCAP midsole cushioning" }, bio);
    assert.equal(v.allowed, true);
    assert.equal(v.blocked.length, 0);
    assert.ok(v.honored.length >= bio.protections.length);
  });

  it("resolves topic aliases", () => {
    assert.equal(resolveTopic("Predatory lending"), "lending");
    assert.equal(resolveTopic("Hype resale markups"), "resale");
    assert.equal(resolveTopic("Glitter"), null);
  });

  it("screenMany splits and summarizes", () => {
    const r = screenMany(["Casino night", "Brooks Ghost 15"], (t) => ({ title: t }), bio);
    assert.equal(r.passed.length, 1);
    assert.equal(r.blocked.length, 1);
    assert.match(r.summary, /held back 1 of 2/);
  });
});
