import type { Product } from "../types";

const note = "Comfort, style and durability scores are demo values, not lab measurements";
const img = (seed: string, hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="320" height="200" rx="16" fill="hsl(${hue} 60% 92%)"/><path d="M40 140 C60 110 100 110 130 100 C160 90 170 60 200 60 C230 60 250 90 280 120 L280 140 Z" fill="hsl(${hue} 55% 45%)"/><rect x="40" y="140" width="240" height="14" rx="7" fill="hsl(${hue} 30% 25%)"/><text x="160" y="185" text-anchor="middle" font-family="system-ui" font-size="13" fill="hsl(${hue} 30% 25%)">${seed}</text></svg>`)}`;

/** Fictional products on purpose: a realistic spread of prices, brands, styles and tradeoffs. */
export const mockProducts: Product[] = [
  { id: "m1", name: "Kestrel Daily Runner", brand: "Kestrel", price: 89, currency: "USD", style: "running", comfortScore: 82, styleScore: 58, durabilityScore: 70, description: "Cushioned everyday trainer, plain colorways.", imageUrl: img("Kestrel Daily Runner", 205), source: "mock", scoresNote: note },
  { id: "m2", name: "Northline Court Low", brand: "Northline", price: 120, currency: "USD", style: "court", comfortScore: 66, styleScore: 88, durabilityScore: 78, description: "Clean leather low-top, the streetwear look.", imageUrl: img("Northline Court Low", 25), source: "mock", scoresNote: note },
  { id: "m3", name: "Aero Cloudstep", brand: "Aero", price: 145, currency: "USD", style: "running", comfortScore: 93, styleScore: 62, durabilityScore: 60, description: "Max-cushion foam, the most comfortable in the set.", imageUrl: img("Aero Cloudstep", 150), source: "mock", scoresNote: note },
  { id: "m4", name: "Brickyard Canvas", brand: "Brickyard", price: 55, currency: "USD", style: "casual", comfortScore: 48, styleScore: 70, durabilityScore: 55, description: "Cheap, thin, classic canvas silhouette.", imageUrl: img("Brickyard Canvas", 10), source: "mock", scoresNote: note },
  { id: "m5", name: "Northline Court High Premium", brand: "Northline", price: 210, currency: "USD", style: "court", comfortScore: 74, styleScore: 96, durabilityScore: 85, description: "Premium leather high-top. Best looking, over most budgets.", imageUrl: img("Northline Court High", 340), source: "mock", scoresNote: note },
  { id: "m6", name: "Aero Trail Grip", brand: "Aero", price: 135, currency: "USD", style: "trail", comfortScore: 78, styleScore: 45, durabilityScore: 92, description: "Lugged outsole, built to last, not a fashion shoe.", imageUrl: img("Aero Trail Grip", 95), source: "mock", scoresNote: note },
  { id: "m7", name: "Vantage Knit One", brand: "Vantage", price: 99, currency: "USD", style: "lifestyle", comfortScore: 76, styleScore: 80, durabilityScore: 58, description: "Sock-fit knit upper, balanced comfort and looks.", imageUrl: img("Vantage Knit One", 280), source: "mock", scoresNote: note },
  { id: "m8", name: "Kestrel Race Elite", brand: "Kestrel", price: 240, currency: "USD", style: "running", comfortScore: 70, styleScore: 72, durabilityScore: 35, description: "Carbon-plated race day shoe. Fast, fragile, expensive.", imageUrl: img("Kestrel Race Elite", 0), source: "mock", scoresNote: note },
  { id: "m9", name: "Brickyard Slip-On", brand: "Brickyard", price: 42, currency: "USD", style: "casual", comfortScore: 55, styleScore: 40, durabilityScore: 50, description: "The cheapest thing that is still a sneaker.", imageUrl: img("Brickyard Slip-On", 60), source: "mock", scoresNote: note },
];
