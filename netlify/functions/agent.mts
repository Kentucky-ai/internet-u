// POST /api/agent { message, profile, tiles:[{id,kind,title}], modules:[{id,name,status,route}] }
// The hub agent: turns a request into a reply plus tile operations. It may run a live web search to fill a tile.
// No key -> 503 and the client uses its deterministic local hub agent.
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const SYSTEM = `You are Internet U, the user's personal advocate and the operator of their home hub. The hub is a grid of tiles you may change on request.
The user profile (budget, priorities, avoid lists, non-negotiables) is the source of truth. Never change it; propose changes only.
You can: add a tile, remove a tile, open a module, or just answer. Tiles you may add:
- {"kind":"list","title":string,"span":4|6|8,"data":{"intro":string,"search":string}} -> the server runs a live web search with data.search and fills the list. Use for restaurants, events, places, products, news, anything findable online. Put the user's rules into the search (budget, avoid lists).
- {"kind":"note","title":string,"span":4|6,"data":{"text":string}} -> plain advice/summary tile.
- {"kind":"permission","title":string,"span":4,"data":{"connector":string,"scopes":string[],"why":string}} -> when the request needs the user's own accounts (social profile, email, calendar, bank, work tools). You never have that data; ask for a scoped permission instead.
Ops: {"op":"add","tile":{...}} | {"op":"remove","id":string} | {"op":"open","route":string,"q":string} (open a module; ONLY routes of modules whose status is "active" exist; for sneakers/shoes use route "/modules/sneakers" with q = the request). For any module with status "planned" (social, email, calendar, finance, travel, work, subscriptions) never use "open": add a "permission" tile instead.
Use the profile's exact numbers: the budget is profile.budget in profile.currency; never invent a different budget. profile.preferences.location is the user's home location: put it in any place-based search (restaurants, events, travel). If a request needs a location and profile.preferences.location is empty, ask for it in "reply" and add no tile.
Rules: never claim you did something you did not. Never take a consequential action (buy, book, send, post) - say it needs approval. Keep "reply" to 1-3 sentences, addressed to the user.
Respond as JSON: {"reply": string, "ops": [...]}`;

async function llm(messages: unknown[]) {
  const oaKey = process.env.OPENAI_API_KEY?.trim(), orKey = process.env.OPENROUTER_API_KEY?.trim();
  const useOr = !!orKey && !(oaKey && process.env.OPENAI_BASE_URL);
  const url = useOr ? "https://openrouter.ai/api/v1/chat/completions" : `${(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`;
  const model = useOr ? (process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini") : (process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini");
  const r = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${useOr ? orKey : oaKey}`, "content-type": "application/json", ...(useOr ? { "HTTP-Referer": "https://internet-u.netlify.app", "X-Title": "Internet U" } : {}) },
    body: JSON.stringify({ model, temperature: 0.2, response_format: { type: "json_object" }, messages }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!r.ok) throw new Error(`upstream ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = await r.json();
  const content: string = d.choices?.[0]?.message?.content ?? "";
  const m = content.match(/\{[\s\S]*\}/);
  return { parsed: m ? JSON.parse(m[0]) : {}, model, via: useOr ? "OpenRouter" : process.env.OPENAI_BASE_URL ? "OpenAI via Netlify AI Gateway" : "OpenAI" };
}

async function webSearchList(search: string, profile: any): Promise<{ items: any[]; provider: string }> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return { items: [], provider: "none" };
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const prompt = `Search the web: ${search}. The user is in ${profile?.preferences?.location || "an unspecified location"}. The user's rules: budget ${profile?.budget ?? "unknown"} ${profile?.currency ?? ""}; avoid brands ${JSON.stringify(profile?.preferences?.avoid ?? [])}; non-negotiables: ${profile?.preferences?.notes || "none"}.
Return JSON {"items":[...]} with 5 to 8 real, current items. Each: {"name": string, "subtitle": string (one line: where/what/why it fits), "price": string or null (e.g. "$$" or "$24"), "url": the exact URL from your results or null (never invent), "fits": true|false (does it respect the user's rules), "note": string or null (a caveat or unknown)}. JSON only.`;
  const call = (tools: unknown[]) => fetch(`${base}/responses`, {
    method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_SEARCH_MODEL || "gpt-4.1-mini", ...(tools.length ? { tools } : {}), input: prompt }),
    signal: AbortSignal.timeout(40_000),
  });
  let r = await call([{ type: "web_search_preview" }]); let provider = "OpenAI web search";
  if (!r.ok && r.status < 500) { r = await call([]); provider = "OpenAI model knowledge (unverified)"; }
  if (!r.ok) return { items: [], provider: `search failed (${r.status})` };
  const data = await r.json();
  const text: string = data.output_text ?? data.output?.flatMap((o: any) => o.content ?? []).map((c: any) => c.text ?? "").join("") ?? "";
  const m = text.match(/\{[\s\S]*\}/);
  const items = m ? (JSON.parse(m[0]).items ?? []) : [];
  return { items: items.slice(0, 8), provider };
}

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!process.env.OPENAI_API_KEY?.trim() && !process.env.OPENROUTER_API_KEY?.trim()) return json({ error: "no LLM key configured", fallback: true }, 503);
  const body = await req.json().catch(() => ({}));
  try {
    const { parsed, model, via } = await llm([
      { role: "system", content: SYSTEM },
      { role: "user", content: JSON.stringify({ message: body.message, profile: body.profile, tiles: body.tiles, modules: body.modules }) },
    ]);
    const ops: any[] = Array.isArray(parsed.ops) ? parsed.ops : [];
    for (const op of ops) {
      if (op?.op === "add" && op.tile?.kind === "list" && op.tile.data?.search) {
        const { items, provider } = await webSearchList(String(op.tile.data.search), body.profile);
        op.tile.data = { ...op.tile.data, items, provider, fetchedAt: new Date().toISOString() };
      }
    }
    return json({ reply: String(parsed.reply ?? ""), ops, model, via });
  } catch (e: any) {
    return json({ error: String(e?.message ?? e) }, 502);
  }
};
export const config = { path: "/api/agent" };
