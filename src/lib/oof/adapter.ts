/**
 * OOF boundary: authentication / authorization / billing.
 * Nothing in the app talks to OOF directly; it goes through this interface.
 * Set VITE_OOF_BASE_URL to try the HTTP adapter; otherwise the demo adapter is used.
 */
export type User = { id: string; name: string; authenticated: boolean };
export type Action = "read:profile" | "write:profile" | "execute:add_to_cart";

export interface OofAdapter {
  currentUser(): Promise<User>;
  isAuthorized(action: Action): Promise<boolean>;
}

export const demoOof: OofAdapter = {
  async currentUser() { return { id: "demo-user", name: "Demo user", authenticated: false }; },
  async isAuthorized() { return true; },
};

export function httpOof(baseUrl: string): OofAdapter {
  const get = async (path: string) => {
    const r = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, { credentials: "include" });
    if (!r.ok) throw new Error(`OOF ${path} -> ${r.status}`);
    return r.json();
  };
  return {
    async currentUser() { try { const u = await get("/me"); return { id: String(u.id), name: String(u.name ?? u.id), authenticated: true }; } catch { return demoOof.currentUser(); } },
    async isAuthorized(action) { try { const a = await get(`/authorize?action=${encodeURIComponent(action)}`); return !!a.allowed; } catch { return demoOof.isAuthorized(action); } },
  };
}

export const oof: OofAdapter = import.meta.env.VITE_OOF_BASE_URL ? httpOof(import.meta.env.VITE_OOF_BASE_URL) : demoOof;
