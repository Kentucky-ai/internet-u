"use client";

import { useState } from "react";
import { UserProfile, saveUserProfile } from "@/lib/user-profile";

interface SupervisedLearningProps {
  profile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
}

export function SupervisedLearningCard({ profile, onProfileUpdated }: SupervisedLearningProps) {
  const [newRule, setNewRule] = useState("");
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newRule.trim();
    if (!trimmed) return;

    const updated: UserProfile = {
      ...profile,
      learnedRules: [...profile.learnedRules, trimmed],
    };

    saveUserProfile(updated);
    onProfileUpdated(updated);
    setNewRule("");
    setFeedbackNotice(`Learned rule saved to knowledge base: "${trimmed}"`);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleRemoveRule = (index: number) => {
    const updatedRules = profile.learnedRules.filter((_, i) => i !== index);
    const updated: UserProfile = {
      ...profile,
      learnedRules: updatedRules,
    };
    saveUserProfile(updated);
    onProfileUpdated(updated);
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
              color: "#4338ca",
              backgroundColor: "#e0e7ff",
              padding: "2px 8px",
              borderRadius: "999px",
            }}
          >
            Supervised Learning Loop
          </span>
          <h3 style={{ margin: "6px 0 0", fontSize: "18px", fontWeight: 600, color: "#010507" }}>
            Teach Your Advocate
          </h3>
        </div>
        <span style={{ fontSize: "12px", color: "#57575b" }}>Human-in-the-Loop</span>
      </div>

      <p style={{ fontSize: "13px", color: "#57575b", margin: "0 0 16px" }}>
        Provide direct feedback on recommendations. Unlike commercial algorithms that train on user engagement for advertisers, Internet U only retains rules you explicitly approve.
      </p>

      {feedbackNotice && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "#dcfce7",
            color: "#166534",
            borderRadius: "8px",
            fontSize: "12px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>✓</span>
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Existing Learned Rules */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
          Active Stored Knowledge ({profile.learnedRules.length}):
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {profile.learnedRules.map((rule, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor: "#f8f8fc",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
                color: "#1f2937",
              }}
            >
              <span>{rule}</span>
              <button
                type="button"
                onClick={() => handleRemoveRule(idx)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                  padding: "2px 6px",
                  fontSize: "14px",
                }}
                title="Remove rule"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Rule Form */}
      <form onSubmit={handleAddRule} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={newRule}
          onChange={(e) => setNewRule(e.target.value)}
          placeholder="e.g. Always prioritize wide toe-box over fashion..."
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #dbdbe5",
            fontSize: "13px",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            backgroundColor: "#010507",
            color: "#ffffff",
            border: "none",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Add Rule
        </button>
      </form>
    </div>
  );
}

