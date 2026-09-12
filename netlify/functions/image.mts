// GET /api/image?u=<https url>  Server-side image proxy so retailer photos render despite hotlink/referrer blocks.
const bad = (msg: string, status = 400) => new Response(msg, { status });
const PRIVATE = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1)/i;

export default async (req: Request) => {
  const u = new URL(req.url).searchParams.get("u") ?? "";
  let target: URL;
  try { target = new URL(u); } catch { return bad("bad url"); }
  if (!/^https?:$/.test(target.protocol) || PRIVATE.test(target.hostname)) return bad("blocked");
  try {
    const r = await fetch(target, { headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/128 Safari/537.36", accept: "image/avif,image/webp,image/*,*/*;q=0.8", referer: `${target.protocol}//${target.host}/` }, redirect: "follow", signal: AbortSignal.timeout(8_000) });
    const ct = r.headers.get("content-type") ?? "";
    if (!r.ok || !ct.startsWith("image/")) return bad("not an image", 415);
    const buf = await r.arrayBuffer();
    if (buf.byteLength > 6_000_000) return bad("too large", 413);
    return new Response(buf, { headers: { "content-type": ct, "cache-control": "public, max-age=86400", "access-control-allow-origin": "*" } });
  } catch { return bad("fetch failed", 502); }
};
export const config = { path: "/api/image" };
