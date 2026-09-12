import type { Profile } from "../types";
import type { Tile, TileOp } from "../tiles";
import { modules } from "../modules";
import { money } from "../profile";

export type HubReply = { reply: string; ops: TileOp[]; source: "llm" | "local"; via?: string };

/** Hub agent: /api/agent when a key exists, else a deterministic local router that still changes tiles. */
export async function hubAgent(message: string, profile: Profile, tiles: Tile[], signal?: AbortSignal): Promise<HubReply> {
  try {
    const res = await fetch("/api/agent", {
      method: "POST", headers: { "content-type": "application/json" }, signal,
      body: JSON.stringify({ message, profile, tiles: tiles.map(t => ({ id: t.id, kind: t.kind, title: t.title })), modules: modules.map(m => ({ id: m.id, name: m.name, status: m.status, route: m.route })) }),
    });
    if (res.ok) {
      const d = await res.json();
      if (typeof d.reply === "string") return { reply: d.reply, ops: Array.isArray(d.ops) ? d.ops : [], source: "llm", via: d.via };
    }
  } catch { /* fall through */ }
  return localHub(message, profile, tiles);
}

export function localHub(message: string, profile: Profile, tiles: Tile[]): HubReply {
  const m = message.toLowerCase();
  const budget = money(profile.budget, profile.currency);
  if (/sneaker|shoe|trainer|kicks/.test(m)) return { reply: "Opening the sneaker module with your rules loaded.", ops: [{ op: "open", route: "/modules/sneakers", q: message }], source: "local" };
  if (/remove|delete|close|hide/.test(m)) {
    const target = tiles.find(t => t.createdBy === "agent" && m.includes(t.title.toLowerCase().split(" ")[0]));
    const victim = target ?? [...tiles].reverse().find(t => t.createdBy === "agent");
    return victim ? { reply: `Removed the "${victim.title}" tile.`, ops: [{ op: "remove", id: victim.id }], source: "local" } : { reply: "There is no agent-added tile to remove.", ops: [], source: "local" };
  }
  if (/restaurant|dinner|lunch|eat|food/.test(m)) return {
    reply: `Added a restaurants tile for ${profile.preferences.location || "your area"} filtered by your ${budget} budget rule. Demo data: no live search key is configured here.`, source: "local",
    ops: [{ op: "add", tile: { kind: "list", title: "Restaurants tonight", span: 6, data: { intro: `Ranked by your rules (budget ${budget}, no surprises).`, provider: "demo data", items: [
      { name: "Harvest Table", subtitle: "Farm-to-table, walkable, quiet room", price: "$$", fits: true, note: "Menu prices not verified" },
      { name: "Noodle Bar 502", subtitle: "Fast, cheap, good for a weeknight", price: "$", fits: true },
      { name: "The Brass Room", subtitle: "Steakhouse; tasting menu only", price: "$$$$", fits: false, note: "Over your budget rule" },
      { name: "Casa Verde", subtitle: "Vegetarian, no reservation needed", price: "$$", fits: true },
    ] } } }],
  };
  if (/social|profile|instagram|linkedin|twitter|\bx\b|facebook|tiktok/.test(m)) return {
    reply: "I do not have access to your social accounts and will not read them silently. I added a permission request; approve it and the Social module can connect with those scopes only.", source: "local",
    ops: [{ op: "add", tile: { kind: "permission", title: "Connect: Social profile", span: 4, data: { connector: "Social", scopes: ["Read your public profile", "Read your timeline (last 30 days)", "Post only with approval"], why: "You asked for your social profile in the hub.", state: "requested" } } }],
  };
  if (/email|inbox|mail/.test(m)) return { reply: "Email needs a scoped connection first. I added the permission request.", source: "local", ops: [{ op: "add", tile: { kind: "permission", title: "Connect: Email", span: 4, data: { connector: "Email", scopes: ["Read inbox (scoped)", "Draft only; sending needs approval"], why: "You asked about your inbox.", state: "requested" } } }] };
  if (/calendar|schedule|meeting/.test(m)) return { reply: "Calendar needs a scoped connection first. I added the permission request.", source: "local", ops: [{ op: "add", tile: { kind: "permission", title: "Connect: Calendar", span: 4, data: { connector: "Calendar", scopes: ["Read calendar", "Propose events; creating needs approval"], why: "You asked about your schedule.", state: "requested" } } }] };
  if (/travel|flight|hotel|trip/.test(m)) return { reply: `Added a travel note tile. Live fare search needs an API key; your ${budget} rule will apply when it runs.`, source: "local", ops: [{ op: "add", tile: { kind: "note", title: "Travel", span: 4, data: { text: `Nothing booked and nothing will be without your approval. When the travel module is connected it will rank fares by your budget (${budget}), comfort and time rules.` } } }] };
  return { reply: "I can open the sneaker module, add tiles (restaurants, travel, notes), or request a scoped connection to your accounts (social, email, calendar). What should the hub do?", ops: [], source: "local" };
}
