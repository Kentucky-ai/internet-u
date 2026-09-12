import type { Product } from "../types";

export type ImageOutcome = { products: Product[]; generation: boolean; note: string };

/** Second pass after search: real photos per product from /api/images. Any failure keeps the current images. */
export async function enrichImages(products: Product[], signal?: AbortSignal): Promise<ImageOutcome> {
  try {
    const res = await fetch("/api/images", {
      method: "POST", headers: { "content-type": "application/json" }, signal,
      body: JSON.stringify({ products: products.map(p => ({ id: p.id, name: p.name, brand: p.brand, productUrl: p.productUrl, imageUrl: p.imageUrl })) }),
    });
    if (!res.ok) return { products, generation: false, note: `Photo lookup unavailable (${res.status})` };
    const data = await res.json();
    const byId = new Map<string, { imageUrl: string; imageNote: string; imageKind: Product["imageKind"] }>();
    for (const im of data.images ?? []) if (im?.id && typeof im.imageUrl === "string") byId.set(im.id, im);
    const merged = products.map(p => { const im = byId.get(p.id); return im ? { ...p, imageUrl: im.imageUrl, imageNote: im.imageNote, imageKind: im.imageKind } : p; });
    const kinds = merged.reduce((a, p) => { a[p.imageKind ?? "art"] = (a[p.imageKind ?? "art"] ?? 0) + 1; return a; }, {} as Record<string, number>);
    return { products: merged, generation: !!data.generation, note: Object.entries(kinds).map(([k, n]) => `${n} ${k}`).join(", ") };
  } catch {
    return { products, generation: false, note: "Photo lookup unreachable" };
  }
}
