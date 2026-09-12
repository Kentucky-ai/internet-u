export type Priorities = { budget: number; comfort: number; style: number };

export type Profile = {
  id: string;
  budget: number;
  currency: string;
  priorities: Priorities;
  preferences: {
    shoeSize: number | null;
    styles: string[];
    brands: string[];
    avoid: string[];        // brands to avoid
    avoidStyles: string[];
    notes: string;          // other non-negotiables, free text
  };
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  imageUrl?: string;
  productUrl?: string;
  comfortScore?: number;     // 0-100
  styleScore?: number;       // 0-100
  durabilityScore?: number;  // 0-100
  description?: string;
  style?: string;
  source?: string;           // "mock" | "live (web search)"
  scoresNote?: string;       // how the scores were derived
};

export type Ranked = {
  product: Product;
  score: number;             // 0-1 overall under current weights
  parts: { budget: number; comfort: number; style: number }; // 0-1 each
  matchedRules: string[];
  violatedRules: string[];
  notApplicable: string[];
  tradeoffs: string[];
  unknowns: string[];
  explanation: string;
};

export type Perspective = "overall" | "budget" | "comfort" | "style";

export type RankResult = {
  accepted: Ranked[];               // sorted by overall score desc
  rejected: Ranked[];               // violated a hard constraint
  best: Record<Perspective, Ranked | null>;
  weights: Priorities;              // normalized, sum = 1
};

export type Decision = {
  id: string;
  at: string;
  kind: "recommendation" | "approval" | "cancel" | "profile";
  text: string;
};
