"use client";

import { useState } from "react";
import { AdvocateTile } from "@/lib/tiles-data";

interface TileDetailModalProps {
  tile: AdvocateTile | null;
  onClose: () => void;
  onOpenWorkspace?: (tile: AdvocateTile) => void;
}

export function TileDetailModal({ tile, onClose, onOpenWorkspace }: TileDetailModalProps) {
  const [approvedAction, setApprovedAction] = useState<string | null>(null);

  if (!tile) return null;

  const handleOpenWorkspace = () => {
    if (onOpenWorkspace) {
      onClose();
      onOpenWorkspace(tile);
    } else {
      setApprovedAction(tile.highlightData.actionLabel);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(1, 5, 7, 0.7)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "28px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
          border: "1px solid #dbdbe5",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  backgroundColor: "#e0e7ff",
                  color: "#4338ca",
                }}
              >
                {tile.category}
              </span>
              <span style={{ fontSize: "12px", color: "#57575b" }}>Status: {tile.status}</span>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "#010507" }}>
              {tile.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#ededf5",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            &times;
          </button>
        </div>

        {/* Summary */}
        <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.5, marginBottom: "20px" }}>
          {tile.summary}
        </p>

        {/* Highlight Metric */}
        <div
          style={{
            backgroundColor: "#f8f8fc",
            border: "1px solid #dbdbe5",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#57575b" }}>{tile.highlightData.primaryLabel}</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#166534" }}>
              {tile.highlightData.primaryMetric}
            </div>
          </div>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: "#dcfce7",
              color: "#166534",
              padding: "4px 10px",
              borderRadius: "999px",
            }}
          >
            {tile.highlightData.badge}
          </span>
        </div>

        {/* Active Guardrails */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#010507", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
            Active Advocate Guardrails
          </h4>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#374151" }}>
            {tile.guardrails.map((g, idx) => (
              <li key={idx} style={{ marginBottom: "4px" }}>
                ✓ {g}
              </li>
            ))}
          </ul>
        </div>

        {/* External Biases Blocked */}
        <div style={{ marginBottom: "24px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#991b1b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
            Commercial Biases Stripped
          </h4>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#991b1b" }}>
            {tile.externalBiasesBlocked.map((b, idx) => (
              <li key={idx} style={{ marginBottom: "4px" }}>
                🛡 {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Confirmation or Action button */}
        {approvedAction ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "#dcfce7",
                color: "#166534",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              ✓ Action Authorized for demo: &ldquo;{approvedAction}&rdquo;. No external charge was made.
            </div>
            {onOpenWorkspace && (
              <button
                type="button"
                onClick={handleOpenWorkspace}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#010507",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Go to Live Workspace &rarr;
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #dbdbe5",
                backgroundColor: "transparent",
                fontSize: "13px",
                cursor: "pointer",
                color: "#57575b",
              }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleOpenWorkspace}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#010507",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Open Workspace &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
