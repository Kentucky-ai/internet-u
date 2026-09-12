"use client";

import { useState, useEffect } from "react";
import type { UserLocation } from "@/lib/user-bio";
import { localizeQuery } from "@/lib/location";
import { getUid, UID_HEADER } from "@/lib/vault-client";

interface SearchHit {
  title: string;
  url: string;
  published?: string;
  highlight?: string;
  cautions?: string[];
}

interface HeldHit {
  title: string;
  url: string;
  reasons: string[];
}

interface ExaSearchCardProps {
  initialQuery?: string;
  /** User-approved coarse location; when present the query is grounded to it, visibly. */
  location?: UserLocation | null;
}

export function ExaWebSearchCard({ initialQuery = "best everyday sneakers under 150 honest reviews", location = null }: ExaSearchCardProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [held, setHeld] = useState<HeldHit[]>([]);
  const [guardianNote, setGuardianNote] = useState<string | null>(null);
  const [showHeld, setShowHeld] = useState(false);
  const [sentQuery, setSentQuery] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    const grounded = localizeQuery(searchQuery, location);
    setSentQuery(grounded);
    try {
      const uid = getUid();
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(uid ? { [UID_HEADER]: uid } : {}) },
        body: JSON.stringify({ query: grounded, results: 5 }),
      });
      if (!res.ok) {
        throw new Error(`Search request failed (${res.status})`);
      }
      const data = await res.json();
      if (Array.isArray(data.results)) {
        setResults(data.results);
        setHeld(Array.isArray(data.held) ? data.held : []);
        setGuardianNote(data.guardian?.summary ?? null);
      } else if (typeof data.results === "string") {
        setError(data.results);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute Exa search");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch(initialQuery);
    // Re-run when the user grants or revokes location so the grounding is live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.label ?? null]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #dbdbe5",
        padding: "24px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                backgroundColor: "#fef3c7",
                color: "#b45309",
                padding: "2px 8px",
                borderRadius: "999px",
              }}
            >
              Live Exa Web Grounding
            </span>
            <span style={{ fontSize: "12px", color: "#166534", fontWeight: 600 }}>
              ✓ API Connected
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#010507" }}>
            Real-Time Web Sifter &amp; Source Verification
          </h3>
        </div>
        <span style={{ fontSize: "12px", color: "#57575b" }}>Exa Semantic API</span>
      </div>

      <p style={{ fontSize: "13px", color: "#57575b", margin: "0 0 12px" }}>
        Your advocate uses Exa to retrieve live, unmanipulated web evidence, cutting through affiliate-incentivized &ldquo;top 10&rdquo; articles to locate genuine consumer tests. Every hit is screened by your Guardian on the server before it gets here.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", marginBottom: "12px", fontSize: "12px" }}>
        {location ? (
          <span style={{ padding: "3px 10px", borderRadius: "999px", backgroundColor: "#ede9fe", color: "#5b21b6", fontWeight: 600 }}>
            📍 Grounded to {location.label} · coarse · you approved this
          </span>
        ) : (
          <span style={{ padding: "3px 10px", borderRadius: "999px", backgroundColor: "#f3f4f6", color: "#6b7280", fontWeight: 600 }}>
            📍 Location not shared — results are not localized
          </span>
        )}
        {guardianNote && (
          <span style={{ padding: "3px 10px", borderRadius: "999px", backgroundColor: held.length ? "#fef2f2" : "#f0fdf4", color: held.length ? "#991b1b" : "#166534", fontWeight: 600 }}>
            🛡 {guardianNote}
          </span>
        )}
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask Exa to research live sneaker reviews, flight pricing, or rental terms..."
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid #dbdbe5",
            fontSize: "13px",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "8px 18px",
            borderRadius: "8px",
            backgroundColor: "#010507",
            color: "#ffffff",
            border: "none",
            fontSize: "13px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Searching..." : "Research Web"}
        </button>
      </form>

      {/* Error message */}
      {error && (
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
            borderRadius: "8px",
            fontSize: "12px",
            marginBottom: "12px",
          }}
        >
          {error}
        </div>
      )}

      {sentQuery && (
        <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "10px", fontFamily: "'Spline Sans Mono', monospace" }}>
          sent to Exa: &ldquo;{sentQuery}&rdquo;
        </div>
      )}

      {held.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <button type="button" onClick={() => setShowHeld(!showHeld)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#991b1b", fontWeight: 600, padding: 0 }}>
            {showHeld ? "Hide" : "Show"} {held.length} result{held.length === 1 ? "" : "s"} the Guardian held back
          </button>
          {showHeld && (
            <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {held.map((h, i) => (
                <div key={i} style={{ padding: "8px 12px", borderRadius: "8px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", fontSize: "12px", color: "#991b1b" }}>
                  <div style={{ fontWeight: 600 }}>{h.title}</div>
                  {h.reasons.map((r, j) => (
                    <div key={j}>⛔ {r}</div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results List */}
      {results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {results.map((hit, idx) => (
            <div
              key={idx}
              style={{
                padding: "12px 14px",
                borderRadius: "10px",
                backgroundColor: "#f8f8fc",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                <a
                  href={hit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#2563eb",
                    textDecoration: "none",
                  }}
                >
                  {hit.title} &rarr;
                </a>
                {hit.published && (
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>
                    {new Date(hit.published).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div style={{ fontSize: "11px", color: "#6b7280", wordBreak: "break-all", marginBottom: "6px" }}>
                {hit.url}
              </div>
              {hit.highlight && (
                <p style={{ fontSize: "12px", color: "#374151", margin: 0, lineHeight: 1.4, fontStyle: "italic" }}>
                  &ldquo;{hit.highlight}&rdquo;
                </p>
              )}
              {hit.cautions && hit.cautions.length > 0 && (
                <div style={{ marginTop: "6px", fontSize: "11px", color: "#92400e" }}>
                  {hit.cautions.map((c, j) => (
                    <div key={j}>⚠ Guardian: {c}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

