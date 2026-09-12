"use client";

import { useState } from "react";
import Link from "next/link";
import type { UserBio } from "@/lib/user-bio";
import { saveUserBio } from "@/lib/user-bio";
import { requestCoarseLocation, LOCATION_CONSENT_TEXT } from "@/lib/location";
import { recordDecision, type Decision } from "@/lib/decisions";
import { derivedProtections } from "@/lib/guardian";

interface GuardianCardProps {
  bio: UserBio;
  onBioUpdated: (bio: UserBio) => void;
  vaultBackend: "netlify-blobs" | "local-file" | null;
  lastDecision?: Decision | null;
  compact?: boolean;
}

export function LocationControl({ bio, onBioUpdated }: { bio: UserBio; onBioUpdated: (b: UserBio) => void }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = async () => {
    setBusy(true);
    setError(null);
    try {
      const location = await requestCoarseLocation();
      const next = saveUserBio({ ...bio, location });
      onBioUpdated(next);
      recordDecision({ kind: "location-consent", subject: location.label, detail: "Coarse location (~1 km) stored in vault with explicit approval." });
      setAsking(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Location was not shared.");
    } finally {
      setBusy(false);
    }
  };

  const revoke = () => {
    const label = bio.location?.label ?? "";
    const next = saveUserBio({ ...bio, location: null });
    onBioUpdated(next);
    recordDecision({ kind: "location-revoked", subject: label, detail: "Location deleted from vault by the user." });
  };

  if (bio.location) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", fontSize: "13px" }}>
        <div>
          <span style={{ color: "#57575b" }}>Location: </span>
          <span style={{ fontWeight: 700, color: "#010507" }}>📍 {bio.location.label}</span>
          <span style={{ color: "#6b7280", fontSize: "11px" }}> · coarse · approved {new Date(bio.location.grantedAt).toLocaleDateString()}</span>
        </div>
        <button type="button" onClick={revoke} style={{ background: "none", border: "1px solid #dbdbe5", borderRadius: "8px", padding: "4px 10px", fontSize: "12px", cursor: "pointer", color: "#991b1b" }}>
          Revoke
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", fontSize: "13px" }}>
        <div>
          <span style={{ color: "#57575b" }}>Location: </span>
          <span style={{ fontWeight: 600, color: "#010507" }}>Not shared</span>
        </div>
        {!asking && (
          <button type="button" onClick={() => setAsking(true)} style={{ background: "#010507", color: "#fff", border: "none", borderRadius: "8px", padding: "5px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            Share coarse location
          </button>
        )}
      </div>
      {asking && (
        <div style={{ marginTop: "10px", padding: "12px 14px", borderRadius: "10px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", fontSize: "12px", color: "#78350f" }}>
          <strong>Before anything is read, here is exactly what happens:</strong>
          <ul style={{ margin: "6px 0 10px", paddingLeft: "18px" }}>
            {LOCATION_CONSENT_TEXT.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {error && <div style={{ color: "#991b1b", marginBottom: "8px" }}>{error}</div>}
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setAsking(false)} style={{ background: "transparent", border: "1px solid #dbdbe5", borderRadius: "8px", padding: "5px 12px", fontSize: "12px", cursor: "pointer" }}>
              Not now
            </button>
            <button type="button" onClick={approve} disabled={busy} style={{ background: "#010507", color: "#fff", border: "none", borderRadius: "8px", padding: "5px 12px", fontSize: "12px", fontWeight: 600, cursor: busy ? "wait" : "pointer" }}>
              {busy ? "Reading once…" : "Approve"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function GuardianCard({ bio, onBioUpdated, vaultBackend, lastDecision, compact }: GuardianCardProps) {
  const derived = derivedProtections(bio);
  const protectionCount = bio.protections.length + derived.length;
  const vaultLabel =
    vaultBackend === "netlify-blobs" ? "Vault: Netlify Blobs" : vaultBackend === "local-file" ? "Vault: this machine" : "Vault: connecting…";

  return (
    <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #dbdbe5", padding: compact ? "20px" : "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", backgroundColor: "#ede9fe", color: "#5b21b6", padding: "3px 8px", borderRadius: "999px" }}>
          Guardian · {bio.guardianMode}
        </span>
        <Link href="/me" style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
          Edit About Me &rarr;
        </Link>
      </div>

      <h3 style={{ fontSize: compact ? "18px" : "20px", fontWeight: 700, color: "#010507", margin: "0 0 6px" }}>
        {bio.name ? `Guarding ${bio.name}` : "Your Guardian"}
      </h3>
      <p style={{ fontSize: "13px", color: "#57575b", margin: "0 0 14px" }}>
        Screens every recommendation against your faith, lifestyle, age, abilities, and the things you asked to be protected from — on the server, before it reaches you.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#57575b" }}>Protections enforced:</span>
          <span style={{ fontWeight: 700, color: "#5b21b6" }}>{protectionCount}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#57575b" }}>Age gate:</span>
          <span style={{ fontWeight: 600, color: "#010507" }}>{bio.age !== null ? `Active (${bio.age})` : "Age not set"}</span>
        </div>
        {bio.faith && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#57575b" }}>Faith honored:</span>
            <span style={{ fontWeight: 600, color: "#010507" }}>{bio.faith}</span>
          </div>
        )}
        {bio.abilities.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span style={{ color: "#57575b", whiteSpace: "nowrap" }}>Abilities:</span>
            <span style={{ fontWeight: 600, color: "#010507", textAlign: "right" }}>{bio.abilities[0]}{bio.abilities.length > 1 ? ` +${bio.abilities.length - 1}` : ""}</span>
          </div>
        )}
        <LocationControl bio={bio} onBioUpdated={onBioUpdated} />
      </div>

      {!compact && bio.protections.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "14px" }}>
          {bio.protections.map((p) => (
            <span key={p} style={{ fontSize: "11px", fontWeight: 600, padding: "3px 9px", borderRadius: "999px", backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>
              ⛔ {p}
            </span>
          ))}
          {derived.map((d) => (
            <span key={d.from} style={{ fontSize: "11px", fontWeight: 600, padding: "3px 9px", borderRadius: "999px", backgroundColor: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" }} title={`From your bio: "${d.from}"`}>
              ⛔ {d.term}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #eeeef3", fontSize: "11px", color: "#6b7280" }}>
        <span>{vaultLabel}</span>
        {lastDecision ? (
          <span title={lastDecision.detail}>
            Last: {lastDecision.kind.replace("-", " ")} · {lastDecision.subject.slice(0, 28)}
          </span>
        ) : (
          <span>No decisions logged yet</span>
        )}
      </div>
    </div>
  );
}
