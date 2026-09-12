/** The hub is a grid of tiles. System tiles render built-in panels; agent tiles carry their own data. */
export type TileKind = "hero" | "ask" | "rules" | "priorities" | "modules" | "brain" | "decisions" | "list" | "note" | "permission";
export type ListItem = { name: string; subtitle?: string; price?: string | null; url?: string | null; fits?: boolean; note?: string | null };
export type Tile = {
  id: string;
  kind: TileKind;
  title: string;
  span: 3 | 4 | 5 | 6 | 7 | 8 | 12;
  createdBy: "system" | "agent";
  data?: {
    intro?: string; search?: string; items?: ListItem[]; provider?: string; fetchedAt?: string;   // list
    text?: string;                                                                                 // note
    connector?: string; scopes?: string[]; why?: string; state?: "requested" | "approved" | "declined"; // permission
  };
};
export type TileOp = { op: "add"; tile: Omit<Tile, "id" | "createdBy"> & { id?: string } } | { op: "remove"; id: string } | { op: "open"; route: string; q?: string };

export const TILES_KEY = "internet-u.tiles";

export const defaultTiles: Tile[] = [
  { id: "hero", kind: "hero", title: "Internet U", span: 7, createdBy: "system" },
  { id: "rules", kind: "rules", title: "My Rules", span: 5, createdBy: "system" },
  { id: "ask", kind: "ask", title: "Ask your advocate", span: 7, createdBy: "system" },
  { id: "priorities", kind: "priorities", title: "Priorities", span: 5, createdBy: "system" },
  { id: "modules", kind: "modules", title: "Your modules", span: 12, createdBy: "system" },
  { id: "brain", kind: "brain", title: "Brain", span: 4, createdBy: "system" },
  { id: "decisions", kind: "decisions", title: "Recent decisions", span: 8, createdBy: "system" },
];

export function loadTiles(): Tile[] {
  try {
    const raw = localStorage.getItem(TILES_KEY);
    if (!raw) return defaultTiles;
    const parsed = JSON.parse(raw) as Tile[];
    return Array.isArray(parsed) && parsed.length ? parsed : defaultTiles;
  } catch { return defaultTiles; }
}
export function saveTiles(t: Tile[]) { try { localStorage.setItem(TILES_KEY, JSON.stringify(t)); } catch { /* unavailable */ } }

export function applyOps(tiles: Tile[], ops: TileOp[]): Tile[] {
  let next = tiles.slice();
  for (const op of ops) {
    if (op.op === "add") {
      const id = op.tile.id ?? `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const tile: Tile = { ...op.tile, id, createdBy: "agent", span: ([3, 4, 5, 6, 7, 8, 12] as const).includes(op.tile.span) ? op.tile.span : 6 };
      // Same title from the agent = refresh that tile in place; otherwise it goes right under the priorities tile so the change is visible.
      const dup = next.findIndex(t => t.createdBy === "agent" && t.kind === tile.kind && t.title.trim().toLowerCase() === tile.title.trim().toLowerCase());
      if (dup >= 0) { next[dup] = { ...tile, id: next[dup].id }; continue; }
      const at = next.findIndex(t => t.kind === "priorities");
      next.splice(at >= 0 ? at + 1 : next.length, 0, tile);
    } else if (op.op === "remove") {
      next = next.filter(t => t.id !== op.id || t.kind === "hero" || t.kind === "ask");
    }
  }
  return next;
}
