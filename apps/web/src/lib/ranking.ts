import { Product } from "./sneakers-data";
import { UserProfile } from "./user-profile";
import type { UserBio } from "./user-bio";
import { screenWithGuardian, type GuardianVerdict } from "./guardian";

export interface EvaluationResult {
  product: Product;
  score: number; // 0 - 100
  isRejected: boolean;
  rejectionReasons: string[];
  matchedRules: string[];
  violatedRules: string[];
  tradeoffs: string[];
  unknowns: string[];
  /** Present when the user's bio was available to screen against. */
  guardian?: GuardianVerdict;
  explanation: string;
  componentScores: {
    budgetScore: number;
    comfortScore: number;
    styleScore: number;
  };
}

export interface RankedPerspectiveResults {
  overall: EvaluationResult[];
  bestBudget: EvaluationResult[];
  bestComfort: EvaluationResult[];
  bestStyle: EvaluationResult[];
  rejected: EvaluationResult[];
  summary: string;
}

export function calculateBudgetScore(price: number, budget: number): number {
  if (price > budget) return 0;
  if (budget <= 0) return 50;
  // A shoe at 50% budget gets 75, at 100% budget gets 50, at 20% budget gets 90
  const ratio = price / budget;
  const score = Math.round(100 - ratio * 50);
  return Math.max(10, Math.min(100, score));
}

export function evaluateProduct(product: Product, profile: UserProfile, bio?: UserBio): EvaluationResult {
  const violatedRules: string[] = [];
  const matchedRules: string[] = [];
  const tradeoffs: string[] = [];
  const unknowns: string[] = [];

  // 1. Hard Constraints: Budget Check
  if (product.price > profile.budget) {
    const diff = (product.price - profile.budget).toFixed(2);
    violatedRules.push(
      `Exceeds maximum budget limit of $${profile.budget.toFixed(2)} by $${diff} (Price: $${product.price.toFixed(2)})`
    );
  } else {
    const savings = (profile.budget - product.price).toFixed(2);
    matchedRules.push(`Within budget limit: $${product.price.toFixed(2)} (Saves $${savings} under $${profile.budget})`);
  }

  // 2. Hard Constraints: Excluded Brands
  const avoidList = profile.preferences.avoidBrands.map((b) => b.trim().toLowerCase());
  if (avoidList.includes(product.brand.toLowerCase())) {
    violatedRules.push(`Brand "${product.brand}" is in your restricted/avoided brands list`);
  } else {
    matchedRules.push(`Brand "${product.brand}" is trusted and approved`);
  }

  // 3. Non-negotiables
  if (product.requiresAppOrSub) {
    violatedRules.push("Requires companion mobile app or proprietary subscription");
  }

  // 3b. The Guardian: the user's bio (faith, lifestyle, age, abilities, protections).
  let guardian: GuardianVerdict | undefined;
  if (bio) {
    guardian = screenWithGuardian(
      { title: `${product.brand} ${product.name}`, description: product.description, tags: [product.category, ...product.features], source: "catalog" },
      bio
    );
    for (const reason of guardian.blocked) violatedRules.push(`Guardian: ${reason}`);
    for (const caution of guardian.cautions) tradeoffs.push(`Guardian caution: ${caution}`);
  }

  const isRejected = violatedRules.length > 0;

  // 4. Scoring component calculations
  const budgetScore = calculateBudgetScore(product.price, profile.budget);
  const comfortScore = product.comfortScore;
  const styleScore = product.styleScore;

  // Normalize priority weights
  const rawBudgetWeight = Math.max(0, profile.priorities.budget);
  const rawComfortWeight = Math.max(0, profile.priorities.comfort);
  const rawStyleWeight = Math.max(0, profile.priorities.style);
  const totalWeight = rawBudgetWeight + rawComfortWeight + rawStyleWeight || 1;

  const wB = rawBudgetWeight / totalWeight;
  const wC = rawComfortWeight / totalWeight;
  const wS = rawStyleWeight / totalWeight;

  const rawOverall = isRejected
    ? 0
    : Math.round(wB * budgetScore + wC * comfortScore + wS * styleScore);

  // 5. Tradeoffs & Unknowns
  if (comfortScore >= 90 && styleScore < 80) {
    tradeoffs.push(
      `Exceptional ergonomic support (${comfortScore}/100), but functional running aesthetics may feel less versatile for formal dress.`
    );
  }
  if (styleScore >= 90 && comfortScore < 80) {
    tradeoffs.push(
      `Iconic clean silhouette (${styleScore}/100), but flatter sole profile offers less shock absorption during 10k+ steps.`
    );
  }
  if (product.price > profile.budget * 0.9 && !isRejected) {
    tradeoffs.push(
      `Consumes almost entire budget allocation ($${product.price.toFixed(2)} of $${profile.budget.toFixed(2)}).`
    );
  }
  if (product.resaleHypeMarkup) {
    tradeoffs.push("Subject to secondary marketplace hype and artificial price premiums.");
  }

  if (!product.durabilityVerified) {
    unknowns.push("Long-term durability, outsole treadwear, and wet-weather grip have not been independently stress-tested.");
  }

  // 6. Advocate Explanation
  let explanation = "";
  if (isRejected) {
    explanation = `Internet U rejected this item because it violates your non-negotiables: ${violatedRules.join("; ")}. Even though standard platform algorithms promote it for style or margin, it does not serve your stated rules.`;
  } else {
    const topFactor =
      wB >= wC && wB >= wS
        ? `its price of $${product.price.toFixed(2)} which respects your budget focus`
        : wC >= wB && wC >= wS
        ? `its superior comfort rating (${comfortScore}/100)`
        : `its high style rating (${styleScore}/100)`;

    explanation = `Recommended by your advocate primarily for ${topFactor}. Matches all hard rules with zero unwanted app requirements.`;
  }

  return {
    product,
    score: rawOverall,
    isRejected,
    rejectionReasons: violatedRules,
    matchedRules,
    violatedRules,
    tradeoffs,
    unknowns,
    guardian,
    explanation,
    componentScores: {
      budgetScore,
      comfortScore,
      styleScore,
    },
  };
}

export function rankSneakers(products: Product[], profile: UserProfile, bio?: UserBio): RankedPerspectiveResults {
  const evaluated = products.map((p) => evaluateProduct(p, profile, bio));

  const valid = evaluated.filter((r) => !r.isRejected);
  const rejected = evaluated.filter((r) => r.isRejected);

  // Perspective 1: Overall weighted ranking
  const overall = [...valid].sort((a, b) => b.score - a.score);

  // Perspective 2: Best Budget Match (lowest price / highest budgetScore)
  const bestBudget = [...valid].sort((a, b) => {
    if (b.componentScores.budgetScore !== a.componentScores.budgetScore) {
      return b.componentScores.budgetScore - a.componentScores.budgetScore;
    }
    return a.product.price - b.product.price;
  });

  // Perspective 3: Best Comfort Match
  const bestComfort = [...valid].sort((a, b) => b.product.comfortScore - a.product.comfortScore);

  // Perspective 4: Best Style Match
  const bestStyle = [...valid].sort((a, b) => b.product.styleScore - a.product.styleScore);

  const topOverall = overall[0];
  const summary = topOverall
    ? `Evaluated ${products.length} options against your $${profile.budget} budget. ${valid.length} matched all rules; ${rejected.length} were rejected to protect your priorities.`
    : `No products satisfied all your hard constraints. Consider adjusting your budget or brand exclusions.`;

  return {
    overall,
    bestBudget,
    bestComfort,
    bestStyle,
    rejected,
    summary,
  };
}
