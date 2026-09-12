"use client";

import { useState } from "react";

interface ConnectorItem {
  id: string;
  name: string;
  category: string;
  scope: string;
  description: string;
  enabled: boolean;
}

export function FutureConnectorsCard() {
  const [connectors, setConnectors] = useState<ConnectorItem[]>([
    {
      id: "amazon",
      name: "Amazon Marketplace Sifter",
      category: "E-Commerce",
      scope: "read:product-specs",
      description: "Extracts honest spec sheets while stripping sponsored ad placement biases.",
      enabled: true,
    },
    {
      id: "google-shopping",
      name: "Google Shopping Price Audit",
      category: "Pricing",
      scope: "read:live-pricing",
      description: "Validates historical MSRP to detect artificial retail markups and fake sales.",
      enabled: true,
    },
    {
      id: "calendar",
      name: "Work & Personal Calendar",
      category: "Context",
      scope: "read:events-summary",
      description: "Recommends footwear tailored to upcoming travel days, standing conferences, or wet climates.",
      enabled: false,
    },
    {
      id: "slack",
      name: "Team Slack Channel Agent",
      category: "Workplace",
      scope: "read:thread-mentions",
      description: "Collaborative gear evaluation with team members directly in Slack threads via CopilotKit Channels.",
      enabled: false,
    },
  ]);

  const toggleConnector = (id: string) => {
    setConnectors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #dbdbe5",
        borderRadius: "16px",
        padding: "24px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#0891b2",
              backgroundColor: "#cffafe",
              padding: "2px 8px",
              borderRadius: "999px",
            }}
          >
            Sponsor & Surface Connectors
          </span>
          <h3 style={{ margin: "6px 0 0", fontSize: "18px", fontWeight: 600, color: "#010507" }}>
            Scoped Data Connectors
          </h3>
        </div>
        <span style={{ fontSize: "12px", color: "#57575b" }}>Permission-Gated</span>
      </div>

      <p style={{ fontSize: "13px", color: "#57575b", margin: "0 0 16px" }}>
        Internet U operates under strict least-privilege principles. The advocate never silently scrapes background data—every external integration requires explicit permission and limited scope.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {connectors.map((c) => (
          <div
            key={c.id}
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              border: c.enabled ? "1px solid #0891b2" : "1px solid #e5e7eb",
              backgroundColor: c.enabled ? "#f0fdfa" : "#f9fafb",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontWeight: 600, fontSize: "13px", color: "#010507" }}>{c.name}</span>
              <button
                type="button"
                onClick={() => toggleConnector(c.id)}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: c.enabled ? "#0891b2" : "#e5e7eb",
                  color: c.enabled ? "#ffffff" : "#4b5563",
                }}
              >
                {c.enabled ? "Authorized" : "Disabled"}
              </button>
            </div>
            <div style={{ fontSize: "11px", color: "#6b7280", fontFamily: "monospace", marginBottom: "4px" }}>
              scope: {c.scope}
            </div>
            <div style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.4 }}>
              {c.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

