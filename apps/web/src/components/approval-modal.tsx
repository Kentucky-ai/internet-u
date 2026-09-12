"use client";

import { useState } from "react";
import { EvaluationResult } from "@/lib/ranking";

export interface CustomActionItem {
  title: string;
  cost: string;
  action: string;
}

interface ApprovalModalProps {
  evaluation?: EvaluationResult | null;
  customAction?: CustomActionItem | null;
  onClose: () => void;
  onApproved: (productName: string) => void;
}

export function ApprovalModal({ evaluation, customAction, onClose, onApproved }: ApprovalModalProps) {
  const [approved, setApproved] = useState(false);

  if (!evaluation && !customAction) return null;

  const itemName = customAction ? customAction.title : evaluation?.product.name || "Selected Item";
  const itemCost = customAction
    ? customAction.cost
    : evaluation
    ? `$${evaluation.product.price.toFixed(2)} ${evaluation.product.currency}`
    : "$0.00";
  const rulesList = customAction
    ? [
        "Budget ceiling compliance verified",
        "Commercial platform middleman markups stripped",
        "Explicit human confirmation required before staging",
      ]
    : evaluation?.matchedRules || [];

  const handleApprove = () => {
    setApproved(true);
    setTimeout(() => {
      onApproved(itemName);
      setApproved(false);
      onClose();
    }, 1600);
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
              I can prepare this item for your cart or booking, but because Internet U works strictly for you,{" "}
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
                <span style={{ fontSize: "13px", color: "#57575b" }}>Selected Option:</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#010507" }}>{itemName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", color: "#57575b" }}>Verified Price:</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#166534" }}>{itemCost}</span>
              </div>
              <div style={{ fontSize: "12px", color: "#57575b", marginTop: "10px", borderTop: "1px dashed #dbdbe5", paddingTop: "8px" }}>
                <strong style={{ color: "#010507" }}>Rules verified:</strong>
                <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
                  {rulesList.slice(0, 3).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p style={{ fontSize: "13px", fontWeight: 500, color: "#010507", marginBottom: "20px" }}>
              Do you authorize staging this action?
            </p>

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
                Decline &amp; Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                style={{
                  padding: "9px 20px",
                  borderRadius: "8px",
                  backgroundColor: "#010507",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Yes, Authorize Action
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
              {itemName} was staged to your approved workspace.
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
