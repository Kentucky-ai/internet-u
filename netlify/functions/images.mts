// POST /api/images { products: [{id, name, brand, productUrl?, imageUrl?}] }
// Resolves a real photo per product: og:image from the product page, else the source's image URL if it really is an image,
// else an AI-generated photoreal render (OpenRouter, when a key is set), else a representative stock photo. Never invents.
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/128 Safari/537.36";
type In = { id: string; name: string; brand?: string; productUrl?: string; imageUrl?: string };
type Out = { id: string; imageUrl: string; imageNote: string; imageKind: "product" | "generated" | "representative" };

const proxied = (u: string) => `/api/image?u=${encodeURIComponent(u)}`;

async function isImage(u?: string): Promise<boolean> {
  if (!u || !/^https?:\/\//.test(u)) return false;
  try {
    const r = await fetch(u, { method: "GET", headers: { "user-agent": UA, accept: "image/*" }, redirect: "follow", signal: AbortSignal.timeout(5_000) });
    return r.ok && (r.headers.get("content-type") ?? "").startsWith("image/");
  } catch { return false; }
}

async function ogImage(pageUrl?: string): Promise<string | null> {
  if (!pageUrl || !/^https?:\/\//.test(pageUrl)) return null;
  try {
    const r = await fetch(pageUrl, { headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(6_000) });
    if (!r.ok) return null;
    const html = (await r.text()).slice(0, 400_000);
    const m = html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (!m) return null;
    const abs = new URL(m[1], pageUrl).toString();
    return (await isImage(abs)) ? abs : null;
  } catch { return null; }
}

async function generate(p: In): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) return null;
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json", "HTTP-Referer": "https://internet-u.netlify.app", "X-Title": "Internet U" },
      body: JSON.stringify({
        model: process.env.OPENROUTER_IMAGE_MODEL || "google/gemini-2.5-flash-image-preview",
        modalities: ["image", "text"],
        messages: [{ role: "user", content: `Photorealistic e-commerce product photo of the sneaker "${p.name}" by ${p.brand ?? "the brand"}, three-quarter view, studio lighting, plain light background, no text, no watermark.` }],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    const url: string | undefined = d.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    return url && url.startsWith("data:image/") ? url : null;
  } catch { return null; }
}

/** Keyless image search, Bing first: its results page carries the original image URL per result. */
async function bingImage(p: In): Promise<string | null> {
  const q = `${p.brand ?? ""} ${p.name} sneaker product photo`.trim();
  try {
    const r = await fetch(`https://www.bing.com/images/search?q=${encodeURIComponent(q)}&form=HDRSC2&first=1`, { headers: { "user-agent": UA, accept: "text/html", "accept-language": "en-US,en;q=0.9" }, signal: AbortSignal.timeout(7_000) });
    if (!r.ok) return null;
    const html = await r.text();
    const urls = [...html.matchAll(/murl&quot;:&quot;(.*?)&quot;/g)].map(m => m[1].replace(/&amp;/g, "&")).slice(0, 6);
    for (const u of urls) if (/^https?:\/\//.test(u) && (await isImage(u))) return u;
    return null;
  } catch { return null; }
}

/** Keyless image search (DuckDuckGo). The vqd token is bound to the query, so each lookup fetches its own. */
async function searchImage(p: In): Promise<string | null> {
  const q = `${p.brand ?? ""} ${p.name} sneaker product photo`.trim();
  try {
    const seed = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images`, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(6_000) });
    const vqd = (await seed.text()).match(/vqd=["']?([\d-]+)/)?.[1];
    if (!vqd) return null;
    const r = await fetch(`https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(q)}&vqd=${vqd}&f=,,,,,&p=1`, { headers: { "user-agent": UA, referer: "https://duckduckgo.com/" }, signal: AbortSignal.timeout(6_000) });
    if (!r.ok) return null;
    const d = await r.json();
    const results: any[] = Array.isArray(d.results) ? d.results.slice(0, 6) : [];
    for (const res of results) {
      const u: string | undefined = res.image;
      if (u && /^https?:\/\//.test(u) && (await isImage(u))) return u;
    }
    return null;
  } catch { return null; }
}

function representative(p: In): string {
  let h = 0; for (const ch of p.id + p.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `https://loremflickr.com/640/400/sneakers,shoe/all?lock=${h % 1000}`;
}

async function resolve(p: In): Promise<Out> {
  const og = await ogImage(p.productUrl);
  if (og) return { id: p.id, imageUrl: proxied(og), imageNote: "Product photo from the retailer page", imageKind: "product" };
  if (await isImage(p.imageUrl)) return { id: p.id, imageUrl: proxied(p.imageUrl!), imageNote: "Product photo from the source listing", imageKind: "product" };
  const found = (await bingImage(p)) ?? (await searchImage(p));
  if (found) return { id: p.id, imageUrl: proxied(found), imageNote: "Product photo via image search", imageKind: "product" };
  const gen = await generate(p);
  if (gen) return { id: p.id, imageUrl: gen, imageNote: "AI-generated render, not a retailer photo", imageKind: "generated" };
  return { id: p.id, imageUrl: representative(p), imageNote: "Representative stock photo, not this exact product", imageKind: "representative" };
}

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const body = await req.json().catch(() => ({}));
  const products: In[] = Array.isArray(body.products) ? body.products.slice(0, 16) : [];
  // Bounded concurrency: image hosts and the search endpoint throttle a burst of a dozen requests.
  const images: Out[] = new Array(products.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(4, products.length) }, async () => { while (next < products.length) { const i = next++; images[i] = await resolve(products[i]); } }));
  return json({ images, generation: !!process.env.OPENROUTER_API_KEY?.trim() });
};
export const config = { path: "/api/images" };
