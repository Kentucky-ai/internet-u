import type { Product, Profile } from "../types";
import { mockProducts } from "./mock";

export type SearchOutcome = { products: Product[]; source: "live" | "mock"; note: string };

/**
 * Live search goes through the Netlify function at /api/search (server holds the key).
 * Any failure, missing key, or empty result falls back to mock data and says so.
 */
export async function searchProducts(query: string, profile: Profile, signal?: AbortSignal): Promise<SearchOutcome> {
  try {
    const res = await fetch("/api/search", {
      method: "POST", headers: { "content-type": "application/json" }, signal,
      body: JSON.stringify({ query, budget: profile.budget, currency: profile.currency }),
    });
    if (res.ok) {
      const data = await res.json();
      const products: Product[] = Array.isArray(data.products) ? data.products.filter(validProduct) : [];
      if (products.length >= 3) return { products, source: "live", note: `Live results via ${data.provider ?? "web search"}; comfort/style scores are model estimates, not measurements` };
      return { products: mockProducts, source: "mock", note: "Live search returned too few usable products; showing demo catalog" };
    }
    const why = res.status === 503 ? "Live search is not configured (no API key on the server)" : `Live search failed (${res.status})`;
    return { products: mockProducts, source: "mock", note: `${why}; showing demo catalog` };
  } catch {
    return { products: mockProducts, source: "mock", note: "Live search unreachable; showing demo catalog" };
  }
}

function validProduct(p: unknown): p is Product {
  const x = p as Product;
  return !!x && typeof x.id === "string" && typeof x.name === "string" && typeof x.brand === "string" && typeof x.price === "number" && x.price > 0;
}
