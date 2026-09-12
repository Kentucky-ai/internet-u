/**
 * The decision ledger: every time the Guardian steps in, the user approves an
 * action, or shares something (like location), it is written down. Persisted
 * with the rest of the vault so it survives a reload and a new device.
 */
import { pushVault } from "./vault-client";

export type DecisionKind = "guardian-block" | "guardian-caution" | "approval" | "location-consent" | "location-revoked" | "lesson";

export interface Decision {
  id: string;
  at: string;
  kind: DecisionKind;
  subject: string;
  detail: string;
}

export const DECISIONS_KEY = "internet_u_decisions_v1";
export const DECISIONS_EVENT = "internet_u_decisions_updated";
const MAX = 200;

export function loadDecisions(): Decision[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DECISIONS_KEY);
    return raw ? (JSON.parse(raw) as Decision[]) : [];
  } catch {
    return [];
  }
}

export function writeDecisions(list: Decision[], options: { remote?: boolean } = {}): void {
  if (typeof window === "undefined") return;
  const trimmed = list.slice(0, MAX);
  try {
    localStorage.setItem(DECISIONS_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent(DECISIONS_EVENT, { detail: trimmed }));
  } catch {
    /* storage full or blocked */
  }
  if (options.remote !== false) pushVault({ decisions: trimmed }).catch(() => undefined);
}

export function recordDecision(input: Omit<Decision, "id" | "at">): Decision {
  const d: Decision = {
    id: `d-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    ...input,
  };
  writeDecisions([d, ...loadDecisions()]);
  return d;
}
