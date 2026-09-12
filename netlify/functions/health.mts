// GET /api/health  -> which integrations are configured (names only, never values).
export default async () => {
  const has = (k: string) => typeof process.env[k] === "string" && process.env[k]!.trim().length > 0;
  const openai = has("OPENAI_API_KEY"), gateway = openai && has("OPENAI_BASE_URL"), openrouter = has("OPENROUTER_API_KEY");
  const chatVia = gateway ? "OpenAI via Netlify AI Gateway" : openrouter ? "OpenRouter" : openai ? "OpenAI" : "local deterministic";
  const chatModel = gateway || (!openrouter && openai) ? (process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini") : openrouter ? (process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini") : "rules engine";
  const body = {
    ok: true,
    openaiKey: openai, openaiBaseUrl: has("OPENAI_BASE_URL"), openrouterKey: openrouter, anthropicKey: has("ANTHROPIC_API_KEY"),
    mode: openai || openrouter ? "live-capable" : "demo",
    brain: { chatVia, chatModel, search: openai ? "OpenAI web search" : "demo catalog", imageGeneration: openrouter ? (process.env.OPENROUTER_IMAGE_MODEL || "google/gemini-2.5-flash-image-preview") : null },
  };
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
};
export const config = { path: "/api/health" };
