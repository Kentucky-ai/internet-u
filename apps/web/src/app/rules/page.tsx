"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserProfile,
  SovereignKnowledgeRule,
  loadUserProfile,
  saveUserProfile,
  resetUserProfile,
  DEFAULT_USER_PROFILE,
} from "@/lib/user-profile";

export default function RulesPage() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [newRuleText, setNewRuleText] = useState("");
  const [newRuleCategory, setNewRuleCategory] = useState<SovereignKnowledgeRule["category"]>("General");
  const [avoidBrandInput, setAvoidBrandInput] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setProfile(loadUserProfile());
  }, []);

  const totalPriority =
    profile.priorities.budget + profile.priorities.comfort + profile.priorities.style || 1;

  const pctBudget = Math.round((profile.priorities.budget / totalPriority) * 100);
  const pctComfort = Math.round((profile.priorities.comfort / totalPriority) * 100);
  const pctStyle = Math.round((profile.priorities.style / totalPriority) * 100);

  const handleSave = () => {
    saveUserProfile(profile);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleReset = () => {
    const def = resetUserProfile();
    setProfile(def);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // Toggle a knowledge rule
  const toggleKnowledgeRule = (id: string) => {
    const updatedRules = (profile.knowledgeRules || []).map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    const updated = { ...profile, knowledgeRules: updatedRules };
    setProfile(updated);
    saveUserProfile(updated);
  };

  // Delete a knowledge rule
  const deleteKnowledgeRule = (id: string) => {
    const updatedRules = (profile.knowledgeRules || []).filter((r) => r.id !== id);
    const updated = { ...profile, knowledgeRules: updatedRules };
    setProfile(updated);
    saveUserProfile(updated);
  };

  // Add new knowledge rule
  const handleAddKnowledgeRule = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newRuleText.trim();
    if (!text) return;

    const newRule: SovereignKnowledgeRule = {
      id: `kb-${Date.now()}`,
      category: newRuleCategory,
      rule: text,
      type: "hard_constraint",
      enabled: true,
    };

    const updatedRules = [...(profile.knowledgeRules || []), newRule];
    const updated = { ...profile, knowledgeRules: updatedRules };
    setProfile(updated);
    saveUserProfile(updated);
    setNewRuleText("");
  };

  // Avoid brands
  const addAvoidBrand = (e: React.FormEvent) => {
    e.preventDefault();
    const brand = avoidBrandInput.trim();
    if (!brand) return;
    if (!profile.preferences.avoidBrands.some((b) => b.toLowerCase() === brand.toLowerCase())) {
      const updated = {
        ...profile,
        preferences: {
          ...profile.preferences,
          avoidBrands: [...profile.preferences.avoidBrands, brand],
        },
      };
      setProfile(updated);
      saveUserProfile(updated);
    }
    setAvoidBrandInput("");
  };

  const removeAvoidBrand = (brand: string) => {
    const updated = {
      ...profile,
      preferences: {
        ...profile.preferences,
        avoidBrands: profile.preferences.avoidBrands.filter((b) => b !== brand),
      },
    };
    setProfile(updated);
    saveUserProfile(updated);
  };

  return (
    <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 24px", minHeight: "100vh" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#57575b",
              textDecoration: "none",
              marginBottom: "8px",
            }}
          >
            &larr; Return to Portal Canvas
          </Link>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: 0, color: "#010507", letterSpacing: "-0.03em" }}>
            Sovereign Knowledge Base &amp; Rules
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "14px", color: "#57575b" }}>
            Your personal AI advocate enforces these universal rules and knowledge preferences across every tile you create.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {savedNotice && (
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#166534", backgroundColor: "#dcfce7", padding: "6px 12px", borderRadius: "8px" }}>
              ✓ Knowledge Saved Live
            </span>
          )}
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "1px solid #dbdbe5",
              backgroundColor: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              color: "#57575b",
            }}
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#010507",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save Changes
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Card 1: Sovereign Knowledge Rules */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            border: "1px solid #dbdbe5",
            padding: "28px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px", color: "#010507" }}>
                Active Sovereign Knowledge ({profile.knowledgeRules?.length || 0})
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#57575b" }}>
                These non-negotiables are automatically fed into every agentic search and workspace generation.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
            {(profile.knowledgeRules || []).map((rule) => (
              <div
                key={rule.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  backgroundColor: rule.enabled ? "#f8fafc" : "#f1f5f9",
                  border: rule.enabled ? "1px solid #e2e8f0" : "1px dashed #cbd5e1",
                  opacity: rule.enabled ? 1 : 0.6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      backgroundColor:
                        rule.category === "Finance"
                          ? "#dcfce7"
                          : rule.category === "Privacy"
                          ? "#fee2e2"
                          : rule.category === "Travel"
                          ? "#e0e7ff"
                          : "#f3f4f6",
                      color:
                        rule.category === "Finance"
                          ? "#166534"
                          : rule.category === "Privacy"
                          ? "#991b1b"
                          : rule.category === "Travel"
                          ? "#4338ca"
                          : "#374151",
                    }}
                  >
                    {rule.category}
                  </span>
                  <span style={{ fontSize: "14px", color: "#0f172a", fontWeight: 500 }}>
                    {rule.rule}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => toggleKnowledgeRule(rule.id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      border: "none",
                      backgroundColor: rule.enabled ? "#dcfce7" : "#e2e8f0",
                      color: rule.enabled ? "#166534" : "#64748b",
                      cursor: "pointer",
                    }}
                  >
                    {rule.enabled ? "ACTIVE" : "PAUSED"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteKnowledgeRule(rule.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      fontSize: "16px",
                      cursor: "pointer",
                      padding: "4px 8px",
                    }}
                    title="Delete Rule"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Knowledge Rule Form */}
          <form
            onSubmit={handleAddKnowledgeRule}
            style={{
              padding: "16px",
              borderRadius: "12px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <select
              value={newRuleCategory}
              onChange={(e) => setNewRuleCategory(e.target.value as SovereignKnowledgeRule["category"])}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #dbdbe5",
                fontSize: "13px",
                backgroundColor: "#ffffff",
              }}
            >
              <option value="General">General</option>
              <option value="Finance">Finance</option>
              <option value="Travel">Travel</option>
              <option value="Shopping">Shopping</option>
              <option value="Housing">Housing</option>
              <option value="Privacy">Privacy</option>
              <option value="Custom">Custom</option>
            </select>
            <input
              type="text"
              value={newRuleText}
              onChange={(e) => setNewRuleText(e.target.value)}
              placeholder="e.g. Reject flights with layovers over 2 hours, I have wide feet, Must include free breakfast..."
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #dbdbe5",
                fontSize: "13px",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                backgroundColor: "#010507",
                color: "#ffffff",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Add Knowledge Rule
            </button>
          </form>
        </div>

        {/* Card 2: Value Priority Weights & Universal Controls */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
          {/* Sliders */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              border: "1px solid #dbdbe5",
              padding: "24px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px", color: "#010507" }}>
              Universal Decision Priority Weights
            </h3>
            <p style={{ fontSize: "13px", color: "#57575b", margin: "0 0 20px" }}>
              How your advocate mathematically balances trade-offs when scoring live candidates.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#010507" }}>Budget &amp; Cost Savings</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#166534" }}>{pctBudget}% weight</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={profile.priorities.budget}
                  onChange={(e) => {
                    const updated = { ...profile, priorities: { ...profile.priorities, budget: Number(e.target.value) } };
                    setProfile(updated);
                    saveUserProfile(updated);
                  }}
                  style={{ width: "100%", accentColor: "#166534" }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#010507" }}>Convenience &amp; Comfort</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb" }}>{pctComfort}% weight</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={profile.priorities.comfort}
                  onChange={(e) => {
                    const updated = { ...profile, priorities: { ...profile.priorities, comfort: Number(e.target.value) } };
                    setProfile(updated);
                    saveUserProfile(updated);
                  }}
                  style={{ width: "100%", accentColor: "#2563eb" }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#010507" }}>Quality &amp; Aesthetics</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#7c3aed" }}>{pctStyle}% weight</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={profile.priorities.style}
                  onChange={(e) => {
                    const updated = { ...profile, priorities: { ...profile.priorities, style: Number(e.target.value) } };
                    setProfile(updated);
                    saveUserProfile(updated);
                  }}
                  style={{ width: "100%", accentColor: "#7c3aed" }}
                />
              </div>
            </div>
          </div>

          {/* Excluded Brands & Entities */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              border: "1px solid #dbdbe5",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px", color: "#991b1b" }}>
                Strict Exclusions &amp; Blocklist
              </h3>
              <p style={{ fontSize: "13px", color: "#57575b", margin: "0 0 14px" }}>
                Entities, brands, or platforms your advocate will strictly eliminate from all feeds.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                {profile.preferences.avoidBrands.map((brand) => (
                  <span
                    key={brand}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      backgroundColor: "#fee2e2",
                      color: "#991b1b",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    <span>{brand}</span>
                    <button
                      type="button"
                      onClick={() => removeAvoidBrand(brand)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b", padding: 0 }}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <form onSubmit={addAvoidBrand} style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={avoidBrandInput}
                onChange={(e) => setAvoidBrandInput(e.target.value)}
                placeholder="Add brand or vendor to block..."
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
                  padding: "8px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#991b1b",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Block
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
