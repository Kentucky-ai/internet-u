import type { Product } from "../types";

const note = "Comfort, style and durability scores are demo values, not lab measurements";
import { placeholderImage } from "./placeholder";

/** Fictional products on purpose: a realistic spread of prices, brands, styles and tradeoffs. */
export const mockProducts: Product[] = [
  { id: "m1", name: "Kestrel Daily Runner", brand: "Kestrel", price: 89, currency: "USD", style: "running", comfortScore: 82, styleScore: 58, durabilityScore: 70, description: "Cushioned everyday trainer, plain colorways.", imageUrl: placeholderImage("Kestrel Daily Runner"), source: "mock", scoresNote: note },
  { id: "m2", name: "Northline Court Low", brand: "Northline", price: 120, currency: "USD", style: "court", comfortScore: 66, styleScore: 88, durabilityScore: 78, description: "Clean leather low-top, the streetwear look.", imageUrl: placeholderImage("Northline Court Low"), source: "mock", scoresNote: note },
  { id: "m3", name: "Aero Cloudstep", brand: "Aero", price: 145, currency: "USD", style: "running", comfortScore: 93, styleScore: 62, durabilityScore: 60, description: "Max-cushion foam, the most comfortable in the set.", imageUrl: placeholderImage("Aero Cloudstep"), source: "mock", scoresNote: note },
  { id: "m4", name: "Brickyard Canvas", brand: "Brickyard", price: 55, currency: "USD", style: "casual", comfortScore: 48, styleScore: 70, durabilityScore: 55, description: "Cheap, thin, classic canvas silhouette.", imageUrl: placeholderImage("Brickyard Canvas"), source: "mock", scoresNote: note },
  { id: "m5", name: "Northline Court High Premium", brand: "Northline", price: 210, currency: "USD", style: "court", comfortScore: 74, styleScore: 96, durabilityScore: 85, description: "Premium leather high-top. Best looking, over most budgets.", imageUrl: placeholderImage("Northline Court High"), source: "mock", scoresNote: note },
  { id: "m6", name: "Aero Trail Grip", brand: "Aero", price: 135, currency: "USD", style: "trail", comfortScore: 78, styleScore: 45, durabilityScore: 92, description: "Lugged outsole, built to last, not a fashion shoe.", imageUrl: placeholderImage("Aero Trail Grip"), source: "mock", scoresNote: note },
  { id: "m7", name: "Vantage Knit One", brand: "Vantage", price: 99, currency: "USD", style: "lifestyle", comfortScore: 76, styleScore: 80, durabilityScore: 58, description: "Sock-fit knit upper, balanced comfort and looks.", imageUrl: placeholderImage("Vantage Knit One"), source: "mock", scoresNote: note },
  { id: "m8", name: "Kestrel Race Elite", brand: "Kestrel", price: 240, currency: "USD", style: "running", comfortScore: 70, styleScore: 72, durabilityScore: 35, description: "Carbon-plated race day shoe. Fast, fragile, expensive.", imageUrl: placeholderImage("Kestrel Race Elite"), source: "mock", scoresNote: note },
  { id: "m9", name: "Brickyard Slip-On", brand: "Brickyard", price: 42, currency: "USD", style: "casual", comfortScore: 55, styleScore: 40, durabilityScore: 50, description: "The cheapest thing that is still a sneaker.", imageUrl: placeholderImage("Brickyard Slip-On"), source: "mock", scoresNote: note },
];
