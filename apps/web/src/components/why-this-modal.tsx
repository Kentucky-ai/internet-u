"use client";

import { EvaluationResult } from "@/lib/ranking";

interface WhyThisModalProps {
  evaluation: EvaluationResult | null;
  onClose: () => void;
}

export function WhyThisModal({ evaluation, onClose }: WhyThisModalProps) {
  if (!evaluation) return null;

  const { product, score, isRejected, matchedRules, violatedRules, tradeoffs, unknowns, explanation, componentScores } =
    evaluation;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(1, 5, 7, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          maxWidth: "640px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "28px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #dbdbe5",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  padding: "3px 8px",
                  borderRadius: "999px",
                  backgroundColor: isRejected ? "#fee2e2" : "#dcfce7",
                  color: isRejected ? "#991b1b" : "#166534",
                }}
              >
                {isRejected ? "Blocked by Your Rules" : `Advocate Score: ${score}/100`}
              </span>
              <span style={{ fontSize: "12px", color: "#57575b" }}>{product.brand} · {product.category}</span>
            </div>
            <h2 id="modal-title" style={{ fontSize: "22px", fontWeight: 600, margin: 0, color: "#010507" }}>
              {product.name}
            </h2>
            <p style={{ fontSize: "18px", fontWeight: 600, color: "#166534", margin: "4px 0 0" }}>
              ${product.price.toFixed(2)} {product.currency}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: "#ededf5",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#57575b",
              cursor: "pointer",
            }}
          >
            &times;
          </button>
        </div>

        {/* Score Breakdown Bars */}
        <div
          style={{
            background: "#f8f8fc",
            borderRadius: "12px",
            padding: "14px 16px",
            marginBottom: "20px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "#57575b", fontWeight: 500 }}>Budget Fit</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#010507" }}>
              {componentScores.budgetScore}/100
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#57575b", fontWeight: 500 }}>Comfort Score</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#010507" }}>
              {componentScores.comfortScore}/100
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#57575b", fontWeight: 500 }}>Style Score</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#010507" }}>
              {componentScores.styleScore}/100
            </div>
          </div>
        </div>

        {/* Plain Language Advocate Explanation */}
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "10px",
            backgroundColor: isRejected ? "#fef2f2" : "#f0fdf4",
            borderLeft: isRejected ? "4px solid #ef4444" : "4px solid #22c55e",
            marginBottom: "20px",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "4px", color: isRejected ? "#991b1b" : "#166534" }}>
            Advocate Analysis
          </div>
          <div style={{ fontSize: "13px", color: "#1f2937", lineHeight: 1.5 }}>
            {explanation}
          </div>
        </div>

        {/* Rules Satisfied */}
        {matchedRules.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#166534", margin: "0 0 8px" }}>
              ✓ Rules Satisfied
            </h4>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#374151" }}>
              {matchedRules.map((rule, idx) => (
                <li key={idx} style={{ marginBottom: "4px" }}>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Rules Violated */}
        {violatedRules.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#991b1b", margin: "0 0 8px" }}>
              ✕ Rules Violated (Blocked)
            </h4>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#991b1b" }}>
              {violatedRules.map((rule, idx) => (
                <li key={idx} style={{ marginBottom: "4px" }}>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tradeoffs */}
        {tradeoffs.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#b45309", margin: "0 0 8px" }}>
              ⚠ Tradeoffs & Skepticism
            </h4>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#4b5563" }}>
              {tradeoffs.map((item, idx) => (
                <li key={idx} style={{ marginBottom: "4px" }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Unknowns / Missing verification */}
        {unknowns.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", margin: "0 0 8px" }}>
              ? Unverified / Missing Data
            </h4>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#6b7280" }}>
              {unknowns.map((item, idx) => (
                <li key={idx} style={{ marginBottom: "4px" }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Close button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              backgroundColor: "#010507",
              color: "#ffffff",
              border: "none",
              fontWeight: 500,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
}

