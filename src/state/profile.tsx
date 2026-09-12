import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Decision, Profile } from "../lib/types";
import { defaultProfile, loadProfile, saveProfile } from "../lib/profile";
import { oof, type User } from "../lib/oof/adapter";

const DECISIONS_KEY = "internet-u.decisions";

type Ctx = {
  profile: Profile;
  setProfile: (next: Profile | ((p: Profile) => Profile)) => void;
  resetProfile: () => void;
  decisions: Decision[];
  addDecision: (kind: Decision["kind"], text: string) => void;
  clearDecisions: () => void;
  user: User;
};

const ProfileContext = createContext<Ctx | null>(null);

function loadDecisions(): Decision[] {
  try { const raw = localStorage.getItem(DECISIONS_KEY); return raw ? (JSON.parse(raw) as Decision[]) : []; } catch { return []; }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile>(loadProfile);
  const [decisions, setDecisions] = useState<Decision[]>(loadDecisions);
  const [user, setUser] = useState<User>({ id: "demo-user", name: "Demo user", authenticated: false });

  useEffect(() => { let on = true; oof.currentUser().then(u => { if (on) setUser(u); }); return () => { on = false; }; }, []);
  useEffect(() => { try { localStorage.setItem(DECISIONS_KEY, JSON.stringify(decisions.slice(0, 50))); } catch { /* unavailable */ } }, [decisions]);

  const setProfile = useCallback((next: Profile | ((p: Profile) => Profile)) => {
    setProfileState(prev => { const v = typeof next === "function" ? next(prev) : next; saveProfile(v); return v; });
  }, []);
  const resetProfile = useCallback(() => setProfile(defaultProfile), [setProfile]);
  const addDecision = useCallback((kind: Decision["kind"], text: string) => {
    setDecisions(d => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: new Date().toISOString(), kind, text }, ...d].slice(0, 50));
  }, []);
  const clearDecisions = useCallback(() => setDecisions([]), []);

  const value = useMemo(() => ({ profile, setProfile, resetProfile, decisions, addDecision, clearDecisions, user }), [profile, setProfile, resetProfile, decisions, addDecision, clearDecisions, user]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile outside ProfileProvider");
  return ctx;
}
