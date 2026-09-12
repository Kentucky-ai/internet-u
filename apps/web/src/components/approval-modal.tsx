"use client";

import { useState } from "react";
import { EvaluationResult } from "@/lib/ranking";
import { getUid, UID_HEADER } from "@/lib/vault-client";
import { recordDecision } from "@/lib/decisions";

interface ApprovalModalProps {
  evaluation: EvaluationResult | null;
  onClose: () => void;
  onApproved: (productName: string) => void;
}

export function ApprovalModal({ evaluation, onClose, onApproved }: ApprovalModalProps) {
  const [approved, setApproved] = useState(false);
  const [checking, setChecking] = useState(false);
  const [refusal, setRefusal] = useState<string[] | null>(null);

  if (!evaluation) return null;

  const { product, matchedRules } = evaluation;

  // The click is a request, not a command. The server-side Guardian reads the
  // user's bio from the vault and decides; the UI only reports what it said.
  const handleApprove = async () => {
    setChecking(true);
    setRefusal(null);
    try {
      const uid = getUid();
      const res = await fetch("/api/guardian", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(uid ? { [UID_HEADER]: uid } : {}) },
        body: JSON.stringify({
          action: "approve",
          subject: { title: `${product.brand} ${product.name}`, description: product.description, tags: [product.category, ...product.features] },
        }),
      });
      const data = (await res.json()) as { verdict?: { blocked: string[] }; error?: string };
      if (res.status === 403 && data.verdict) {
        setRefusal(data.verdict.blocked);
        recordDecision({ kind: "guardian-block", subject: product.name, detail: `Server gate refused approval: ${data.verdict.blocked.join(" ")}` });
        return;
      }
      if (!res.ok) {
        setRefusal([data.error || `Gate unavailable (${res.status}). Nothing was approved.`]);
        return;
      }
    } catch {
      setRefusal(["Could not reach the Guardian gate. Nothing was approved."]);
      return;
    } finally {
      setChecking(false);
    }
    recordDecision({ kind: "approval", subject: product.name, detail: `Approved at $${product.price.toFixed(2)} after server Guardian check.` });
    setApproved(true);
    setTimeout(() => {
      onApproved(product.name);
      setApproved(false);
      onClose();
    }, 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-title"
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
          maxWidth: "520px",
          width: "100%",
          padding: "28px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
          border: "1px solid #dbdbe5",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!approved ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#fef3c7",
                  color: "#d97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "18px",
                }}
              >
                !
              </div>
              <div>
                <h3 id="approval-title" style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#010507" }}>
                  Approval Required
                </h3>
                <p style={{ margin: 0, fontSize: "12px", color: "#57575b" }}>
                  Internet U Consequential Action Gate
                </p>
              </div>
            </div>

            <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.5, marginBottom: "16px" }}>
              I can prepare this item for your cart, but because Internet U works strictly for you,{" "}
              <strong>I will never execute a purchase or submit billing information without your explicit human confirmation.</strong>
            </p>

            <div
              style={{
                backgroundColor: "#f8f8fc",
                border: "1px solid #dbdbe5",
                borderRadius: "10px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", color: "#57575b" }}>Selected Item:</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#010507" }}>{product.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", color: "#57575b" }}>Price:</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#166534" }}>
                  ${product.price.toFixed(2)} {product.currency}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#57575b", marginTop: "10px", borderTop: "1px dashed #dbdbe5", paddingTop: "8px" }}>
                <strong style={{ color: "#010507" }}>Rules verified:</strong>
                <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
                  {matchedRules.slice(0, 2).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p style={{ fontSize: "13px", fontWeight: 500, color: "#010507", marginBottom: "20px" }}>
              Do you authorize preparing this action?
            </p>

            {refusal && (
              <div
                role="alert"
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                <strong>Guardian refused this on the server.</strong>
                <ul style={{ margin: "6px 0 0", paddingLeft: "18px" }}>
                  {refusal.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                <div style={{ fontSize: "11px", marginTop: "6px", color: "#b91c1c" }}>
                  Enforced by /api/guardian against the bio in your vault — not by this button.
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  backgroundColor: "transparent",
                  color: "#57575b",
                  border: "1px solid #dbdbe5",
                  fontWeight: 500,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Decline & Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={checking}
                style={{
                  padding: "9px 20px",
                  borderRadius: "8px",
                  backgroundColor: "#010507",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: checking ? "wait" : "pointer",
                  opacity: checking ? 0.7 : 1,
                }}
              >
                {checking ? "Asking the Guardian…" : refusal ? "Try Again" : "Yes, Authorize Action"}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 8px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#dcfce7",
                color: "#166534",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                marginBottom: "12px",
              }}
            >
              ✓
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600, color: "#166534" }}>
              Action Authorized
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#374151" }}>
              {product.name} was staged to your saved items.
            </p>
            <div
              style={{
                marginTop: "16px",
                padding: "10px",
                borderRadius: "8px",
                backgroundColor: "#f3f4f6",
                fontSize: "12px",
                color: "#6b7280",
              }}
            >
              Notice: Approved for demo purposes. <strong>No real purchase or credit card charge was made.</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

