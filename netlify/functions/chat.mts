// POST /api/chat  { message, profile, weights, accepted, rejected, best, missing, dataNote }
// Conversational layer over the deterministic ranking. Uses OpenRouter if set, else OpenAI.
// No key -> 503 and the client uses its local deterministic reply.
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const SYSTEM = `You are Internet U, the user's own advocate. Rules you must follow:
- The user profile is the source of truth. Never change preferences; propose changes only, and ask.
- The ranking you receive is already computed under the user's own priority weights. Do not re-rank it.
- Never call one product "the best sneaker". Use "best match for your current priorities", "best budget fit", "best comfort tradeoff", "best style match".
- Explain tradeoffs. Clearly flag products that broke a hard rule; they are set aside, not recommended.
- Be transparent about unknowns and about whether data is live or demo.
- Never perform or claim a consequential action (cart, purchase). Say approval is required.
- Keep it to 4-6 sentences. If a critical field is missing (listed in "missing"), ask one concise question in "clarifyingQuestion".
Respond as JSON: {"text": string, "clarifyingQuestion": string | null}`;

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const orKey = process.env.OPENROUTER_API_KEY, oaKey = process.env.OPENAI_API_KEY;
  if (!orKey && !oaKey) return json({ error: "no LLM key configured", fallback: true }, 503);
  const body = await req.json().catch(() => ({}));

  const url = orKey ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
  const model = orKey ? (process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini") : (process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini");
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${orKey || oaKey}`, "content-type": "application/json", ...(orKey ? { "HTTP-Referer": "https://internet-u.netlify.app", "X-Title": "Internet U" } : {}) },
      body: JSON.stringify({ model, temperature: 0.3, response_format: { type: "json_object" }, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: JSON.stringify(body) }] }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) return json({ error: `upstream ${r.status}`, detail: (await r.text()).slice(0, 300) }, 502);
    const data = await r.json();
    const content: string = data.choices?.[0]?.message?.content ?? "";
    const m = content.match(/\{[\s\S]*\}/);
    const parsed = m ? JSON.parse(m[0]) : { text: content };
    return json({ text: String(parsed.text ?? ""), clarifyingQuestion: parsed.clarifyingQuestion || null, model });
  } catch (e: any) {
    return json({ error: e?.name === "TimeoutError" ? "upstream timeout" : String(e?.message ?? e) }, 502);
  }
};
export const config = { path: "/api/chat" };
