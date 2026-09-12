/**
 * The vault API. One document per anonymous browser id, sent as a header so
 * the id never lands in a URL, a log line, or a referrer.
 *
 *   GET    /api/profile  → { doc, backend }
 *   PUT    /api/profile  { profile?, bio?, decisions? } → merged { doc, backend }
 *   DELETE /api/profile  → 204
 */
import { readVault, writeVault, deleteVault, isValidUid } from "@/lib/server/profile-store";

const UID_HEADER = "x-internet-u-uid";
const MAX_BODY = 256 * 1024;

function uidFrom(request: Request): string | null {
  const uid = request.headers.get(UID_HEADER);
  return isValidUid(uid) ? uid : null;
}

export async function GET(request: Request) {
  const uid = uidFrom(request);
  if (!uid) return Response.json({ error: "Missing or invalid vault id." }, { status: 400 });
  const { doc, backend } = await readVault(uid);
  return Response.json({ doc, backend }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const uid = uidFrom(request);
  if (!uid) return Response.json({ error: "Missing or invalid vault id." }, { status: 400 });
  const text = await request.text();
  if (text.length > MAX_BODY) return Response.json({ error: "Vault document too large." }, { status: 413 });
  let body: { profile?: unknown; bio?: unknown; decisions?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  if (body.decisions !== undefined && !Array.isArray(body.decisions)) {
    return Response.json({ error: "decisions must be an array." }, { status: 400 });
  }
  // Coordinates are stored only at the coarse precision the client produced;
  // clamp here too so a bug upstream can never persist a precise fix.
  const bio = body.bio as { location?: { lat?: number; lng?: number } } | undefined;
  if (bio && bio.location && typeof bio.location.lat === "number" && typeof bio.location.lng === "number") {
    bio.location.lat = Math.round(bio.location.lat * 100) / 100;
    bio.location.lng = Math.round(bio.location.lng * 100) / 100;
  }
  const { doc, backend } = await writeVault(uid, {
    profile: body.profile,
    bio: body.bio,
    decisions: body.decisions as unknown[] | undefined,
  });
  return Response.json({ doc, backend });
}

export async function DELETE(request: Request) {
  const uid = uidFrom(request);
  if (!uid) return Response.json({ error: "Missing or invalid vault id." }, { status: 400 });
  await deleteVault(uid);
  return new Response(null, { status: 204 });
}
