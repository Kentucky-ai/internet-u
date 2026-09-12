import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_USER_PROFILE } from "./user-profile";
import { SNEAKER_CATALOG } from "./sneakers-data";
import { rankSneakers, evaluateProduct } from "./ranking";

test("hard constraint: over-budget shoes are rejected", () => {
  const profile = { ...DEFAULT_USER_PROFILE, budget: 150 };
  const results = rankSneakers(SNEAKER_CATALOG, profile);

  // Over budget shoes: Hoka Bondi 8 ($165), Jordan 4 ($215), Balenciaga ($1050)
  const rejectedIds = results.rejected.map((r) => r.product.id);
  assert.ok(rejectedIds.includes("hoka-bondi-8"), "Hoka Bondi 8 ($165) must be rejected on $150 budget");
  assert.ok(rejectedIds.includes("nike-air-jordan-4-retro"), "Jordan 4 ($215) must be rejected on $150 budget");
  assert.ok(rejectedIds.includes("balenciaga-triple-s"), "Balenciaga must be rejected");

  // Verified that none of the rejected items appear in valid perspectives
  const overallIds = results.overall.map((r) => r.product.id);
  assert.equal(overallIds.includes("hoka-bondi-8"), false);
  assert.equal(overallIds.includes("nike-air-jordan-4-retro"), false);
});

test("hard constraint: excluded brands are strictly rejected", () => {
  const profile = {
    ...DEFAULT_USER_PROFILE,
    budget: 200,
    preferences: {
      ...DEFAULT_USER_PROFILE.preferences,
      avoidBrands: ["Adidas"],
    },
  };
  const results = rankSneakers(SNEAKER_CATALOG, profile);
  const rejectedAdidas = results.rejected.find((r) => r.product.id === "adidas-stan-smith");
  assert.ok(rejectedAdidas, "Adidas Stan Smith must be rejected when Adidas is in avoidBrands");
  assert.match(rejectedAdidas.violatedRules[0], /Brand "Adidas" is in your restricted/);
});

test("dynamic ranking shifts when priority weights change", () => {
  // Scenario A: Heavy comfort priority
  const comfortProfile = {
    ...DEFAULT_USER_PROFILE,
    budget: 150,
    priorities: { budget: 5, comfort: 90, style: 5 },
  };
  const comfortResults = rankSneakers(SNEAKER_CATALOG, comfortProfile);
  // Gel-Nimbus has 97 comfort, Brooks Ghost has 95 comfort
  assert.equal(comfortResults.overall[0].product.id, "asics-gel-nimbus-26");

  // Scenario B: Heavy style priority
  const styleProfile = {
    ...DEFAULT_USER_PROFILE,
    budget: 150,
    priorities: { budget: 5, comfort: 5, style: 90 },
  };
  const styleResults = rankSneakers(SNEAKER_CATALOG, styleProfile);
  // On Cloud 5 has 93 style, Stan Smith has 92 style
  assert.equal(styleResults.overall[0].product.id, "on-cloud-5");

  // Scenario C: Heavy budget priority
  const budgetProfile = {
    ...DEFAULT_USER_PROFILE,
    budget: 150,
    priorities: { budget: 90, comfort: 5, style: 5 },
  };
  const budgetResults = rankSneakers(SNEAKER_CATALOG, budgetProfile);
  // Nike Air Max SC is $84.99 (cheapest in catalog)
  assert.equal(budgetResults.overall[0].product.id, "nike-air-max-sc");
});

test("evaluates tradeoffs and unverified attributes", () => {
  const profile = { ...DEFAULT_USER_PROFILE, budget: 150 };
  const onCloud = SNEAKER_CATALOG.find((p) => p.id === "on-cloud-5")!;
  const evaluation = evaluateProduct(onCloud, profile);

  assert.equal(evaluation.isRejected, false);
  assert.ok(evaluation.unknowns.length > 0, "Should flag unverified durability for On Cloud");
  assert.match(evaluation.unknowns[0], /durability/i);
});

