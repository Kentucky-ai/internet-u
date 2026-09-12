"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserProfile,
  loadUserProfile,
  saveUserProfile,
  resetUserProfile,
  DEFAULT_USER_PROFILE,
} from "@/lib/user-profile";
import { hydrateFromVault } from "@/lib/persistence";

export default function RulesPage() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [avoidBrandInput, setAvoidBrandInput] = useState("");
  const [nonNegInput, setNonNegInput] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setProfile(loadUserProfile());
    hydrateFromVault().then((r) => setProfile(r.profile));
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

  const addAvoidBrand = (e: React.FormEvent) => {
    e.preventDefault();
    const brand = avoidBrandInput.trim();
    if (!brand) return;
    if (!profile.preferences.avoidBrands.some((b) => b.toLowerCase() === brand.toLowerCase())) {
      setProfile({
        ...profile,
        preferences: {
          ...profile.preferences,
          avoidBrands: [...profile.preferences.avoidBrands, brand],
        },
      });
    }
    setAvoidBrandInput("");
  };

  const removeAvoidBrand = (brand: string) => {
    setProfile({
      ...profile,
      preferences: {
        ...profile.preferences,
        avoidBrands: profile.preferences.avoidBrands.filter((b) => b !== brand),
      },
    });
  };

  const addNonNegotiable = (e: React.FormEvent) => {
    e.preventDefault();
    const text = nonNegInput.trim();
    if (!text) return;
    setProfile({
      ...profile,
      preferences: {
        ...profile.preferences,
        nonNegotiables: [...profile.preferences.nonNegotiables, text],
      },
    });
    setNonNegInput("");
  };

  const removeNonNegotiable = (idx: number) => {
    setProfile({
      ...profile,
      preferences: {
        ...profile.preferences,
        nonNegotiables: profile.preferences.nonNegotiables.filter((_, i) => i !== idx),
      },
    });
  };

  return (
    <main className="ck-workspace" style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 24px" }}>
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
              color: "#57575b",
              textDecoration: "none",
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            &larr; Back to Command Center
          </Link>
          <h1 style={{ fontSize: "32px", fontWeight: 700, margin: 0, letterSpacing: "-0.03em" }}>
            My Rules &amp; Advocacy Guardrails
          </h1>
          <p style={{ color: "#57575b", margin: "6px 0 0", fontSize: "15px" }}>
            Define the non-negotiable boundaries and ranking weights your AI advocate uses across the web.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              backgroundColor: "#f4f4f5",
              color: "#374151",
              border: "1px solid #dbdbe5",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: "10px 24px",
              borderRadius: "10px",
              backgroundColor: "#010507",
              color: "#ffffff",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save Rules
          </button>
        </div>
      </div>

      {savedNotice && (
        <div
          style={{
            padding: "12px 18px",
            backgroundColor: "#dcfce7",
            color: "#166534",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 500,
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>✓</span>
          <span>Your rules have been saved and applied to all future recommendations!</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Left Column: Hard Constraints */}
        <section
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #dbdbe5",
            padding: "28px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                padding: "2px 8px",
                borderRadius: "999px",
              }}
            >
              Strict Enforcement
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#010507" }}>
              Hard Constraints
            </h2>
          </div>
          <p style={{ fontSize: "13px", color: "#57575b", margin: "0 0 20px" }}>
            The advocate <strong>strictly blocks</strong> any product violating these rules, no matter how hard an algorithm pushes it.
          </p>

          {/* Budget */}
          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="budget-input"
              style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#010507", marginBottom: "6px" }}
            >
              Maximum Budget Cap ({profile.currency})
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "#57575b" }}>$</span>
              <input
                id="budget-input"
                type="number"
                min="10"
                max="5000"
                value={profile.budget}
                onChange={(e) => setProfile({ ...profile, budget: parseFloat(e.target.value) || 0 })}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #dbdbe5",
                  fontSize: "15px",
                  fontWeight: 600,
                  width: "120px",
                }}
              />
              <span style={{ fontSize: "12px", color: "#57575b" }}>
                Products over this price are immediately rejected.
              </span>
            </div>
          </div>

          {/* Shoe Size */}
          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="size-input"
              style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#010507", marginBottom: "6px" }}
            >
              Preferred Shoe Size
            </label>
            <input
              id="size-input"
              type="text"
              value={profile.preferences.shoeSize || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  preferences: { ...profile.preferences, shoeSize: e.target.value },
                })
              }
              placeholder="e.g. 10.5 US"
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #dbdbe5",
                fontSize: "14px",
                width: "140px",
              }}
            />
          </div>

          {/* Excluded Brands */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#010507", marginBottom: "6px" }}
            >
              Restricted &amp; Excluded Brands
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
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
                    fontWeight: 500,
                  }}
                >
                  {brand}
                  <button
                    type="button"
                    onClick={() => removeAvoidBrand(brand)}
                    style={{ background: "none", border: "none", color: "#991b1b", cursor: "pointer", padding: 0 }}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={addAvoidBrand} style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={avoidBrandInput}
                onChange={(e) => setAvoidBrandInput(e.target.value)}
                placeholder="Add brand to exclude..."
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
                  backgroundColor: "#f4f4f5",
                  border: "1px solid #dbdbe5",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </form>
          </div>

          {/* Non-negotiables */}
          <div>
            <label
              style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#010507", marginBottom: "6px" }}
            >
              Non-Negotiables
            </label>
            <ul style={{ margin: "0 0 10px", paddingLeft: "18px", fontSize: "13px", color: "#374151" }}>
              {profile.preferences.nonNegotiables.map((item, idx) => (
                <li key={idx} style={{ marginBottom: "6px" }}>
                  <span>{item}</span>{" "}
                  <button
                    type="button"
                    onClick={() => removeNonNegotiable(idx)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#9ca3af",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    [remove]
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={addNonNegotiable} style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={nonNegInput}
                onChange={(e) => setNonNegInput(e.target.value)}
                placeholder="e.g. Must have arch support..."
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
                  backgroundColor: "#f4f4f5",
                  border: "1px solid #dbdbe5",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Add Rule
              </button>
            </form>
          </div>
        </section>

        {/* Right Column: Adjustable Priorities */}
        <section
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #dbdbe5",
            padding: "28px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                backgroundColor: "#e0e7ff",
                color: "#4338ca",
                padding: "2px 8px",
                borderRadius: "999px",
              }}
            >
              Ranking Heuristic
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#010507" }}>
              Adjustable Priorities
            </h2>
          </div>
          <p style={{ fontSize: "13px", color: "#57575b", margin: "0 0 24px" }}>
            Priority weights determine how acceptable shoes are ranked. Changing these immediately shifts recommendations.
          </p>

          {/* Budget Priority */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#010507" }}>Budget Priority</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#166534" }}>
                {pctBudget}% weight
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={profile.priorities.budget}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  priorities: { ...profile.priorities, budget: parseInt(e.target.value) || 0 },
                })
              }
              style={{ width: "100%", accentColor: "#166534" }}
            />
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Higher weight prioritizes lowest prices and maximum dollar savings.
            </div>
          </div>

          {/* Comfort Priority */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#010507" }}>Comfort Priority</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#2563eb" }}>
                {pctComfort}% weight
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={profile.priorities.comfort}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  priorities: { ...profile.priorities, comfort: parseInt(e.target.value) || 0 },
                })
              }
              style={{ width: "100%", accentColor: "#2563eb" }}
            />
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Higher weight prioritizes plush cushioning, foam technology, and foot support.
            </div>
          </div>

          {/* Style Priority */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#010507" }}>Style Priority</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#9333ea" }}>
                {pctStyle}% weight
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={profile.priorities.style}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  priorities: { ...profile.priorities, style: parseInt(e.target.value) || 0 },
                })
              }
              style={{ width: "100%", accentColor: "#9333ea" }}
            />
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Higher weight prioritizes clean silhouettes, modern colorways, and aesthetics.
            </div>
          </div>

          {/* Visual Bar Summary */}
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              backgroundColor: "#f8f8fc",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
              Current Weight Distribution
            </div>
            <div
              style={{
                height: "12px",
                borderRadius: "999px",
                display: "flex",
                overflow: "hidden",
                backgroundColor: "#e5e7eb",
              }}
            >
              <div style={{ width: `${pctBudget}%`, backgroundColor: "#166534" }} title={`Budget: ${pctBudget}%`} />
              <div style={{ width: `${pctComfort}%`, backgroundColor: "#2563eb" }} title={`Comfort: ${pctComfort}%`} />
              <div style={{ width: `${pctStyle}%`, backgroundColor: "#9333ea" }} title={`Style: ${pctStyle}%`} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginTop: "6px", color: "#57575b" }}>
              <span>Budget ({pctBudget}%)</span>
              <span>Comfort ({pctComfort}%)</span>
              <span>Style ({pctStyle}%)</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

