/**
 * POST /api/guardian
 *   { subject: { title, description?, tags? }, action?: "check" | "approve" }
 *
 * "check"   → 200 with the verdict, always.
 * "approve" → 200 only if the Guardian allows it; 403 with the reasons if not.
 *             The approval modal calls this BEFORE it reports anything as
 *             approved, so the refusal is enforced here, not in the UI.
 */
import { gate } from "@/lib/server/guardian-gate";
import { isValidUid } from "@/lib/server/profile-store";

export async function POST(request: Request) {
  const uidHeader = request.headers.get("x-internet-u-uid");
  const uid = isValidUid(uidHeader) ? uidHeader : null;
  let body: { subject?: { title?: unknown; description?: unknown; tags?: unknown }; action?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const title = typeof body.subject?.title === "string" ? body.subject.title.trim() : "";
  if (!title) return Response.json({ error: "subject.title is required." }, { status: 400 });
  const subject = {
    title,
    description: typeof body.subject?.description === "string" ? body.subject.description : undefined,
    tags: Array.isArray(body.subject?.tags) ? body.subject.tags.filter((t): t is string => typeof t === "string") : undefined,
  };
  const action = body.action === "approve" ? "approve" : "check";
  const { verdict, source } = await gate(uid, subject);
  const payload = { verdict, action, bioSource: source, enforcedBy: "server" as const };
  if (action === "approve" && !verdict.allowed) {
    return Response.json({ ...payload, refused: true }, { status: 403 });
  }
  return Response.json({ ...payload, refused: false });
}
