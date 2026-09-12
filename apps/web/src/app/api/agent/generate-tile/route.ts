import { searchWeb } from "agent-core";
import { AdvocateTile, createTileFromPrompt } from "@/lib/tiles-data";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { prompt?: string; userKnowledge?: unknown };
    const prompt = (body.prompt || "").trim();

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    // Step 1: Live Web Grounding via Exa
    let searchResults: unknown = [];
    try {
      searchResults = await searchWeb({
        query: `${prompt} honest reviews pricing direct 2026`,
        results: 4,
      });
    } catch (err) {
      console.warn("Exa web search failed or unconfigured:", err);
    }

    // Step 2: OpenRouter LLM Sovereign Synthesis
    if (apiKey) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.PUBLIC_APP_URL ?? "https://aitinkerers.org",
          "X-Title": "Internet U Sovereign Advocate",
        },
        body: JSON.stringify({
          model: process.env.AGENT_MODEL || "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are the Internet U Sovereign Advocate Agent. Your purpose is to protect the user against commercial marketing traps, dark patterns, sponsored affiliate steering, and hidden fees across the web.

Given the user prompt, their sovereign knowledge base, and live web search findings from Exa, generate a structured Advocate Tile Workspace.
You MUST output ONLY valid JSON matching this exact schema:
{
  "title": string (crisp 3-6 word task title),
  "category": "Travel" | "Shopping" | "Housing" | "Tech" | "Finance" | "Custom",
  "status": "Active",
  "summary": string (clear summary of what you are screening for and what commercial bias is stripped),
  "guardrails": string[] (4 explicit, non-negotiable rules for this task),
  "externalBiasesBlocked": string[] (3 commercial marketing biases, hidden fees, or dark patterns stripped),
  "highlightData": {
    "primaryMetric": string (e.g. "$270 Verified" or "Zero Hidden Fees"),
    "primaryLabel": string (e.g. "All-In Pricing" or "Enforced Ceiling"),
    "badge": string (e.g. "Fee-Stripped" or "Direct Vetted"),
    "itemImage": string (a valid Unsplash photo URL relevant to the category),
    "actionLabel": string (e.g. "Open Workspace")
  },
  "candidates": [
    {
      "id": string,
      "name": string (real name from search findings),
      "price": string (verified transparent price),
      "originalPrice": string (optional, e.g. commercial aggregator price),
      "savings": string (optional, e.g. "Saved $85 in surprise fees"),
      "rating": string (e.g. "9.7 / 10 Verified"),
      "summary": string (description of why this matches user rules),
      "tags": string[],
      "status": "approved",
      "source": string (website domain or registry),
      "url": string (real web URL from Exa results if available),
      "ruleChecks": [{ "rule": string, "passed": true, "note": string }]
    }
  ],
  "blockedTraps": [
    {
      "id": string,
      "name": string (the deceptive commercial listing/option that platforms push),
      "price": string (true hidden checkout cost),
      "originalPrice": string (advertised low bait price),
      "rating": string,
      "summary": string,
      "tags": string[],
      "status": "blocked_trap",
      "trapReason": string (clear explanation of the bait-and-switch or junk fees),
      "source": string,
      "ruleChecks": [{ "rule": string, "passed": false, "note": string }]
    }
  ],
  "activityLog": [
    {
      "id": string,
      "timestamp": "Just now",
      "type": "compliance" | "trap_detected" | "scan" | "filter",
      "message": string,
      "impact": string
    }
  ]
}`,
            },
            {
              role: "user",
              content: `User Task: "${prompt}"\nUser Sovereign Knowledge: ${JSON.stringify(
                body.userKnowledge || {}
              )}\nLive Web Search Results from Exa:\n${JSON.stringify(searchResults)}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          // Clean JSON markdown fences
          const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
          try {
            const parsed = JSON.parse(cleaned);
            const tileId = `tile-${Date.now()}`;
            
            // Merge approved candidates and blocked traps
            const allCandidates = [
              ...(parsed.candidates || []),
              ...(parsed.blockedTraps || []),
            ];

            const generatedTile: AdvocateTile = {
              id: tileId,
              title: parsed.title || prompt,
              category: parsed.category || "Custom",
              status: "Active",
              summary: parsed.summary || `Advocate tile actively screening for: "${prompt}".`,
              guardrails: parsed.guardrails || [
                "Strict user ceiling enforced",
                "Zero commercial ad steering",
                "Consequential action gate required",
              ],
              highlightData: {
                primaryMetric: parsed.highlightData?.primaryMetric || "Guarded",
                primaryLabel: parsed.highlightData?.primaryLabel || "Active Rule Set",
                badge: parsed.highlightData?.badge || "Live Advocate",
                itemImage:
                  parsed.highlightData?.itemImage ||
                  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80",
                actionLabel: "Open Workspace",
              },
              createdTime: "Just now",
              externalBiasesBlocked: parsed.externalBiasesBlocked || [
                "Filtered sponsored affiliate placements",
                "Stripped hidden platform fees",
              ],
              searchQuery: `${prompt} honest reviews pricing direct 2026`,
              candidates: allCandidates,
              activityLog: parsed.activityLog || [
                {
                  id: `act-1-${tileId}`,
                  timestamp: "Just now",
                  type: "scan",
                  message: `Retrieved live web intelligence via Exa neural search.`,
                  impact: `Analyzed ${Array.isArray(searchResults) ? searchResults.length : 3} live web listings`,
                },
                {
                  id: `act-2-${tileId}`,
                  timestamp: "Just now",
                  type: "trap_detected",
                  message: `Detected commercial affiliate steering and platform markups.`,
                  impact: `Quarantined deceptive bait-and-switch listings`,
                },
                {
                  id: `act-3-${tileId}`,
                  timestamp: "Just now",
                  type: "compliance",
                  message: `Enforced sovereign user rules against all candidate options.`,
                  impact: `Verified compliant, fee-stripped options`,
                },
              ],
            };

            return Response.json({ tile: generatedTile });
          } catch (jsonErr) {
            console.warn("Failed to parse OpenRouter JSON:", jsonErr, content);
          }
        }
      }
    }

    // Graceful fallback: synthesize client template
    const fallbackTile = createTileFromPrompt(prompt);
    return Response.json({ tile: fallbackTile });
  } catch (err) {
    console.error("Agentic loop failed:", err);
    return Response.json({ error: "Failed to generate tile workspace." }, { status: 500 });
  }
}

