// GET /api/health  -> which integrations are configured (names only, never values).
export default async () => {
  const has = (k: string) => typeof process.env[k] === "string" && process.env[k]!.trim().length > 0;
  const body = {
    ok: true,
    openaiKey: has("OPENAI_API_KEY"),
    openaiBaseUrl: has("OPENAI_BASE_URL"),
    openrouterKey: has("OPENROUTER_API_KEY"),
    anthropicKey: has("ANTHROPIC_API_KEY"),
    mode: has("OPENAI_API_KEY") || has("OPENROUTER_API_KEY") ? "live-capable" : "demo",
  };
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
};
export const config = { path: "/api/health" };
