"use client";

import { useState, useEffect } from "react";

interface SearchHit {
  title: string;
  url: string;
  published?: string;
  highlight?: string;
}

interface ExaSearchCardProps {
  initialQuery?: string;
}

export function ExaWebSearchCard({ initialQuery = "best everyday sneakers under 150 honest reviews" }: ExaSearchCardProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [error, setError] = useState<string | null>(null);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, results: 3 }),
      });
      if (!res.ok) {
        throw new Error(`Search request failed (${res.status})`);
      }
      const data = await res.json();
      if (Array.isArray(data.results)) {
        setResults(data.results);
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
  }, []);

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

      <p style={{ fontSize: "13px", color: "#57575b", margin: "0 0 16px" }}>
        Your advocate uses Exa to retrieve live, unmanipulated web evidence, cutting through affiliate-incentivized &ldquo;top 10&rdquo; articles to locate genuine consumer tests.
      </p>

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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

