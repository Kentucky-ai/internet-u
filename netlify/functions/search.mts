// POST /api/search  { query, budget, currency }
// Live product retrieval through OpenAI web search, returned as normalized JSON.
// No key -> 503 and the client falls back to its demo catalog.
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return json({ error: "OPENAI_API_KEY not configured", fallback: true }, 503);
  // Netlify AI Gateway (and other proxies) inject OPENAI_BASE_URL alongside the key.
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const { query = "sneakers", budget = 150, currency = "USD" } = await req.json().catch(() => ({}));

  const prompt = `Search the web for currently available ${query} for sale online. Return 8 real products as a JSON object {"products":[...]}.
Include a spread of prices: at least 5 at or under ${budget} ${currency} and at least 2 above it, several different brands and styles.
Each product: {"id": string, "name": string, "brand": string, "price": number (${currency}), "currency": "${currency}", "productUrl": string, "imageUrl": string or null,
"style": one of running|court|casual|trail|lifestyle|other, "comfortScore": 0-100, "styleScore": 0-100, "durabilityScore": 0-100 or null, "description": one sentence}.
comfortScore/styleScore are your estimates from reviews; say so in a top-level "scoresNote" string. Output JSON only.`;

  try {
    const model = process.env.OPENAI_SEARCH_MODEL || "gpt-4.1-mini";
    const call = (tools: unknown[]) => fetch(`${base}/responses`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ model, ...(tools.length ? { tools } : {}), input: prompt }),
      signal: AbortSignal.timeout(45_000),
    });
    let r = await call([{ type: "web_search_preview" }]);
    let provider = "OpenAI web search";
    if (!r.ok && r.status < 500) {
      // Proxy without the web search tool: retry on model knowledge and say so.
      r = await call([]);
      provider = "OpenAI model knowledge (no live web search; prices unverified)";
    }
    if (!r.ok) return json({ error: `upstream ${r.status}`, detail: (await r.text()).slice(0, 300) }, 502);
    const data = await r.json();
    const text: string = data.output_text ?? data.output?.flatMap((o: any) => o.content ?? []).map((c: any) => c.text ?? "").join("") ?? "";
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return json({ error: "no JSON in model output" }, 502);
    const parsed = JSON.parse(m[0]);
    const note = typeof parsed.scoresNote === "string" ? parsed.scoresNote : "Comfort and style scores are model estimates from reviews, not measurements";
    const products = (parsed.products ?? []).map((p: any, i: number) => ({
      id: String(p.id ?? `live-${i}`), name: String(p.name ?? "Unknown"), brand: String(p.brand ?? "Unknown"),
      price: Number(p.price), currency: String(p.currency ?? currency), productUrl: p.productUrl || undefined, imageUrl: p.imageUrl || undefined,
      style: p.style || "other", comfortScore: num(p.comfortScore), styleScore: num(p.styleScore), durabilityScore: num(p.durabilityScore),
      description: p.description || undefined, source: provider.includes("web search") ? "live (web search)" : "live (model knowledge, unverified)", scoresNote: note,
    })).filter((p: any) => Number.isFinite(p.price) && p.price > 0);
    // The demo has to show a hard constraint firing. If nothing came back above budget, fetch a few that are.
    let all = products;
    if (!products.some((p: any) => p.price > budget)) {
      try {
        const r2 = await fetch(`${base}/responses`, {
          method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
          body: JSON.stringify({ model, input: prompt.replace(/Return 8 real products/, "Return 3 real products").replace(/Include a spread of prices:[^\n]*/, `Every product must be priced ABOVE ${budget} ${currency} (between ${Math.round(budget * 1.2)} and ${Math.round(budget * 2)} ${currency}).`) }),
          signal: AbortSignal.timeout(20_000),
        });
        if (r2.ok) {
          const d2 = await r2.json();
          const t2: string = d2.output_text ?? d2.output?.flatMap((o: any) => o.content ?? []).map((c: any) => c.text ?? "").join("") ?? "";
          const m2 = t2.match(/\{[\s\S]*\}/);
          const extra = m2 ? (JSON.parse(m2[0]).products ?? []) : [];
          all = products.concat(extra.map((p: any, i: number) => ({
            id: `live-over-${i}`, name: String(p.name ?? "Unknown"), brand: String(p.brand ?? "Unknown"), price: Number(p.price), currency: String(p.currency ?? currency),
            productUrl: p.productUrl || undefined, imageUrl: p.imageUrl || undefined, style: p.style || "other", comfortScore: num(p.comfortScore), styleScore: num(p.styleScore), durabilityScore: num(p.durabilityScore),
            description: p.description || undefined, source: products[0]?.source ?? "live", scoresNote: note,
          })).filter((p: any) => Number.isFinite(p.price) && p.price > budget));
        }
      } catch { /* keep the first batch */ }
    }
    return json({ products: all, provider });
  } catch (e: any) {
    return json({ error: e?.name === "TimeoutError" ? "upstream timeout" : String(e?.message ?? e) }, 502);
  }
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
export const config = { path: "/api/search" };
