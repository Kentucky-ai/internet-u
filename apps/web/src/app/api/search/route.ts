/**
 * Server-side Exa search, screened by the Guardian before it leaves the server.
 *
 * The voice agent's tools execute in the browser, so they cannot read
 * EXA_API_KEY. This route keeps the key server-side and exposes the same
 * `searchWeb` capability the Slack and web surfaces use — and every hit is
 * run through the user's Guardian (bio read from the vault by id) so a
 * blocked result never reaches a client, however it asked.
 */
import { searchWeb } from "agent-core";
import { bioForUid } from "@/lib/server/guardian-gate";
import { isValidUid } from "@/lib/server/profile-store";
import { screenMany } from "@/lib/guardian";

export async function POST(request: Request) {
  const body = (await request.json()) as { query?: unknown; results?: unknown };
  const query = typeof body.query === "string" ? body.query : "";
  if (!query) {
    return Response.json({ error: "A query string is required." }, { status: 400 });
  }
  const results = typeof body.results === "number" ? body.results : 5;
  const uidHeader = request.headers.get("x-internet-u-uid");
  const { bio, source } = await bioForUid(isValidUid(uidHeader) ? uidHeader : null);

  const hits = await searchWeb({ query, results });
  if (typeof hits === "string") {
    return Response.json({ results: hits, held: [], guardian: { summary: "Search not configured.", bioSource: source } });
  }
  const screened = screenMany(hits, (h) => ({ title: h.title, description: h.highlight ?? "", tags: [h.url], source: "exa" }), bio);
  return Response.json({
    results: screened.passed.map((p) => ({ ...p.item, cautions: p.verdict.cautions })),
    held: screened.blocked.map((b) => ({ title: b.item.title, url: b.item.url, reasons: b.verdict.blocked })),
    guardian: { summary: screened.summary, bioSource: source, enforcedBy: "server" },
  });
}
