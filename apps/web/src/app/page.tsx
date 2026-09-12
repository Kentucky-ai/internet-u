"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { CopilotChat, useConfigureSuggestions } from "@copilotkit/react-core/v2";
import {
  UserProfile,
  loadUserProfile,
  saveUserProfile,
  DEFAULT_USER_PROFILE,
} from "@/lib/user-profile";
import { SNEAKER_CATALOG } from "@/lib/sneakers-data";
import { rankSneakers, EvaluationResult, RankedPerspectiveResults } from "@/lib/ranking";
import { AdvocateTile, INITIAL_TILES, createTileFromPrompt } from "@/lib/tiles-data";
import { WhyThisModal } from "@/components/why-this-modal";
import { ApprovalModal, CustomActionItem } from "@/components/approval-modal";
import { TileDetailModal } from "@/components/tile-detail-modal";
import { TileWorkspaceView } from "@/components/tile-workspace-view";
import { SupervisedLearningCard } from "@/components/supervised-learning-card";
import { FutureConnectorsCard } from "@/components/future-connectors-card";
import { ExaWebSearchCard } from "@/components/exa-web-search-card";

type PerspectiveTab = "overall" | "budget" | "comfort" | "style";

export default function HomePage() {
  // Navigation mode: "portal" (multi-tile canvas), "sneaker-deep-dive", or "tile-workspace"
  const [activeView, setActiveView] = useState<"portal" | "sneaker-deep-dive" | "tile-workspace">("portal");
  const [activeWorkspaceTile, setActiveWorkspaceTile] = useState<AdvocateTile | null>(null);

  // Tiles State
  const [tiles, setTiles] = useState<AdvocateTile[]>(INITIAL_TILES);
  const [commandPrompt, setCommandPrompt] = useState("");
  const [inspectingTile, setInspectingTile] = useState<AdvocateTile[] | null>(null);
  const [activeModalTile, setActiveModalTile] = useState<AdvocateTile | null>(null);
  const [tileCreatedNotice, setTileCreatedNotice] = useState<string | null>(null);

  // Sneaker Experience State
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [activePerspective, setActivePerspective] = useState<PerspectiveTab>("overall");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectingItem, setInspectingItem] = useState<EvaluationResult | null>(null);
  const [approvingItem, setApprovingItem] = useState<EvaluationResult | null>(null);
  const [customApprovingItem, setCustomApprovingItem] = useState<CustomActionItem | null>(null);
  const [purchasedNotice, setPurchasedNotice] = useState<string | null>(null);
  const [showChatPanel, setShowChatPanel] = useState(false);

  // Load profile from localStorage on mount and listen to changes
  useEffect(() => {
    setProfile(loadUserProfile());
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<UserProfile>;
      if (customEvent.detail) {
        setProfile(customEvent.detail);
      }
    };
    window.addEventListener("internet_u_profile_updated", handleProfileUpdate);
    return () => window.removeEventListener("internet_u_profile_updated", handleProfileUpdate);
  }, []);

  // Filter sneaker catalog by search query
  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return SNEAKER_CATALOG;
    const q = searchQuery.toLowerCase();
    return SNEAKER_CATALOG.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Rank sneakers dynamically
  const rankingResults: RankedPerspectiveResults = useMemo(() => {
    return rankSneakers(filteredCatalog, profile);
  }, [filteredCatalog, profile]);

  const topSneaker = rankingResults.overall[0] || null;

  // Priority percentages for display
  const totalPriority =
    profile.priorities.budget + profile.priorities.comfort + profile.priorities.style || 1;
  const pctBudget = Math.round((profile.priorities.budget / totalPriority) * 100);
  const pctComfort = Math.round((profile.priorities.comfort / totalPriority) * 100);
  const pctStyle = Math.round((profile.priorities.style / totalPriority) * 100);

  // Update slider priority live
  const handlePriorityChange = (key: keyof UserProfile["priorities"], val: number) => {
    const updated: UserProfile = {
      ...profile,
      priorities: {
        ...profile.priorities,
        [key]: val,
      },
    };
    setProfile(updated);
    saveUserProfile(updated);
  };

  // Open any tile's dedicated workspace
  const handleOpenTileWorkspace = (tile: AdvocateTile) => {
    if (tile.isSpecialSneakerTile) {
      setActiveView("sneaker-deep-dive");
    } else {
      setActiveWorkspaceTile(tile);
      setActiveView("tile-workspace");
    }
  };

  // Spin up a new advocate tile
  const handleCreateTile = (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = commandPrompt.trim();
    if (!prompt) return;

    if (prompt.toLowerCase().includes("shoe") || prompt.toLowerCase().includes("sneaker")) {
      setActiveView("sneaker-deep-dive");
      setCommandPrompt("");
      return;
    }

    const newTile = createTileFromPrompt(prompt);
    setTiles([newTile, ...tiles]);
    setCommandPrompt("");
    setActiveWorkspaceTile(newTile);
    setActiveView("tile-workspace");
    setTileCreatedNotice(`Spun up new advocate tile: "${newTile.title}"`);
    setTimeout(() => setTileCreatedNotice(null), 4000);
  };

  // Configure CopilotKit suggestions
  useConfigureSuggestions(
    {
      suggestions: [
        {
          title: "Find sneakers under $150",
          message: "Help me find sneakers within my budget limit.",
        },
        {
          title: "Book flight with no hidden fees",
          message: "Help me find a roundtrip flight to Chicago under $250 with all fees included.",
        },
        {
          title: "Audit rental lease terms",
          message: "Screen 2-bedroom rental listings for broker fee traps.",
        },
      ],
      available: "always",
    },
    []
  );

  const activeResultsList = useMemo(() => {
    switch (activePerspective) {
      case "budget":
        return rankingResults.bestBudget;
      case "comfort":
        return rankingResults.bestComfort;
      case "style":
        return rankingResults.bestStyle;
      case "overall":
      default:
        return rankingResults.overall;
    }
  }, [activePerspective, rankingResults]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ededf5", paddingBottom: "60px" }}>
      {/* Top Navigation */}
      <header
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #dbdbe5",
          padding: "16px 32px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              onClick={() => setActiveView("portal")}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#010507",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              U
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  onClick={() => setActiveView("portal")}
                  style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.03em", color: "#010507", cursor: "pointer" }}
                >
                  Internet U
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                  }}
                >
                  Agentic Web Portal
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#57575b" }}>
                Your personal internet advocate — deploying custom AI tiles across all your digital tasks.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {(activeView === "sneaker-deep-dive" || activeView === "tile-workspace") && (
              <button
                type="button"
                onClick={() => setActiveView("portal")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  color: "#010507",
                  border: "1px solid #dbdbe5",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                &larr; Back to Portal Canvas
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowChatPanel(!showChatPanel)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: showChatPanel ? "#010507" : "#ffffff",
                color: showChatPanel ? "#ffffff" : "#010507",
                border: "1px solid #010507",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>💬</span>
              <span>{showChatPanel ? "Hide Assistant" : "Open Assistant"}</span>
            </button>

            <Link
              href="/rules"
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                backgroundColor: "#010507",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>⚙</span>
              <span>My Rules &amp; Guardrails</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "1280px", margin: "28px auto 0", padding: "0 24px" }}>
        {tileCreatedNotice && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              backgroundColor: "#dcfce7",
              color: "#166534",
              border: "1px solid #86efac",
              marginBottom: "20px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            ✓ {tileCreatedNotice}
          </div>
        )}

        {purchasedNotice && (
          <div
            style={{
              padding: "14px 20px",
              borderRadius: "12px",
              backgroundColor: "#dcfce7",
              color: "#166534",
              border: "1px solid #86efac",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>✓</span>
              <div>
                <strong>Action Staged &amp; Approved:</strong> {purchasedNotice}
                <div style={{ fontSize: "12px", color: "#15803d" }}>
                  Demo approval confirmed. No real credit card or external purchase was made.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPurchasedNotice(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#166534", fontSize: "16px" }}
            >
              &times;
            </button>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: showChatPanel ? "1fr 380px" : "1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {/* ========================================================================= */}
          {/* VIEW 1: PORTAL CANVAS (Multi-Tile Agentic Canvas)                        */}
          {/* ========================================================================= */}
          {activeView === "portal" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Central Agent Command Box */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  border: "1px solid #dbdbe5",
                  padding: "32px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      backgroundColor: "#f3f4f6",
                      color: "#374151",
                      padding: "4px 12px",
                      borderRadius: "999px",
                      display: "inline-block",
                      marginBottom: "12px",
                    }}
                  >
                    Personal Web Advocate
                  </span>
                  <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#010507", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
                    What would you like your advocate to do?
                  </h2>
                  <p style={{ fontSize: "14px", color: "#57575b", margin: "0 0 24px" }}>
                    Tell Internet U what to search, screen, or purchase. Your advocate will spin up a dedicated tile, enforce your personal rules, and strip commercial platform biases.
                  </p>

                  <form onSubmit={handleCreateTile} style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                    <input
                      type="text"
                      value={commandPrompt}
                      onChange={(e) => setCommandPrompt(e.target.value)}
                      placeholder="e.g. Find sneakers under $150, book flight to Chicago without fees, find quiet apartment..."
                      style={{
                        flex: 1,
                        padding: "14px 18px",
                        borderRadius: "12px",
                        border: "1px solid #dbdbe5",
                        fontSize: "14px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: "14px 28px",
                        borderRadius: "12px",
                        backgroundColor: "#010507",
                        color: "#ffffff",
                        border: "none",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Spin Up Tile &rarr;
                    </button>
                  </form>

                  {/* Quick Prompts */}
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "#57575b", alignSelf: "center" }}>Try asking:</span>
                    <button
                      type="button"
                      onClick={() => setActiveView("sneaker-deep-dive")}
                      style={{
                        padding: "4px 12px",
                        borderRadius: "999px",
                        border: "1px solid #dbdbe5",
                        backgroundColor: "#f4f4f5",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      &ldquo;Help me find sneakers&rdquo;
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommandPrompt("Find roundtrip flight to Chicago under $250 with overhead carry-on included")}
                      style={{
                        padding: "4px 12px",
                        borderRadius: "999px",
                        border: "1px solid #dbdbe5",
                        backgroundColor: "#f4f4f5",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      &ldquo;Flight with no hidden baggage fees&rdquo;
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommandPrompt("Screen 2-bedroom rental apartments under $1,800 with no broker fees")}
                      style={{
                        padding: "4px 12px",
                        borderRadius: "999px",
                        border: "1px solid #dbdbe5",
                        backgroundColor: "#f4f4f5",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      &ldquo;Apartment search with no broker fees&rdquo;
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Advocate Tiles Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px", color: "#010507" }}>
                    Active Advocate Tiles ({tiles.length})
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#57575b" }}>
                    Independent internet workspaces guarded by your personal non-negotiables.
                  </p>
                </div>
                <div style={{ fontSize: "12px", color: "#57575b", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🛡 Zero platform ad steering</span>
                </div>
              </div>

              {/* Tiles Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
                {tiles.map((tile) => {
                  const isSneaker = tile.isSpecialSneakerTile;

                  return (
                    <div
                      key={tile.id}
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "16px",
                        border: isSneaker ? "2px solid #010507" : "1px solid #dbdbe5",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        transition: "transform 0.15s ease",
                      }}
                    >
                      {/* Tile Header Image */}
                      <div style={{ height: "160px", backgroundColor: "#f3f4f6", overflow: "hidden", position: "relative" }}>
                        <img
                          src={tile.highlightData.itemImage}
                          alt={tile.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            left: "12px",
                            backgroundColor: isSneaker ? "#010507" : "rgba(1, 5, 7, 0.75)",
                            color: "#ffffff",
                            padding: "3px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          {tile.highlightData.badge}
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            bottom: "12px",
                            right: "12px",
                            backgroundColor: "#ffffff",
                            color: "#010507",
                            padding: "4px 10px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: 700,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          }}
                        >
                          {tile.highlightData.primaryMetric}
                        </div>
                      </div>

                      {/* Tile Body */}
                      <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#57575b", textTransform: "uppercase" }}>
                              {tile.category} · {tile.status}
                            </span>
                            <span style={{ fontSize: "11px", color: "#9ca3af" }}>{tile.createdTime}</span>
                          </div>

                          <h4 style={{ fontSize: "18px", fontWeight: 700, color: "#010507", margin: "0 0 8px" }}>
                            {tile.title}
                          </h4>
                          <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.4, margin: "0 0 16px" }}>
                            {tile.summary}
                          </p>

                          {/* Sneaker Tile Live Preview Highlight */}
                          {isSneaker && topSneaker && (
                            <div
                              style={{
                                padding: "10px 12px",
                                borderRadius: "8px",
                                backgroundColor: "#f0fdf4",
                                border: "1px solid #bbf7d0",
                                marginBottom: "14px",
                                fontSize: "12px",
                                color: "#166534",
                              }}
                            >
                              <strong>Current #1 Pick:</strong> {topSneaker.product.name} (${topSneaker.product.price.toFixed(2)}) · Saves ${(profile.budget - topSneaker.product.price).toFixed(2)} under ${profile.budget}
                            </div>
                          )}

                          {/* Guardrails snippet */}
                          <div style={{ marginBottom: "16px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#374151", textTransform: "uppercase", marginBottom: "4px" }}>
                              Enforced Rules ({tile.guardrails.length}):
                            </div>
                            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#57575b" }}>
                              {tile.guardrails.slice(0, 2).map((g, i) => (
                                <li key={i}>{g}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Button Action */}
                        <div style={{ paddingTop: "14px", borderTop: "1px solid #f0f0f4" }}>
                          {isSneaker ? (
                            <button
                              type="button"
                              onClick={() => setActiveView("sneaker-deep-dive")}
                              style={{
                                width: "100%",
                                padding: "10px 16px",
                                borderRadius: "10px",
                                backgroundColor: "#010507",
                                color: "#ffffff",
                                border: "none",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <span>Explore Sneaker Experience</span>
                              <span>&rarr;</span>
                            </button>
                          ) : (
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                type="button"
                                onClick={() => handleOpenTileWorkspace(tile)}
                                style={{
                                  flex: 1,
                                  padding: "10px 14px",
                                  borderRadius: "10px",
                                  backgroundColor: "#010507",
                                  color: "#ffffff",
                                  border: "none",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                }}
                              >
                                <span>Open Workspace</span>
                                <span>&rarr;</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveModalTile(tile)}
                                title="View Guardrail Summary"
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: "10px",
                                  backgroundColor: "#f4f4f5",
                                  color: "#57575b",
                                  border: "1px solid #dbdbe5",
                                  fontSize: "13px",
                                  cursor: "pointer",
                                }}
                              >
                                ℹ
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Exa Web Grounding */}
              <ExaWebSearchCard initialQuery="best honest travel deals and sneaker reviews 2026" />

              {/* Supervised Learning & Connectors at Bottom of Canvas */}
              <SupervisedLearningCard
                profile={profile}
                onProfileUpdated={(updated) => setProfile(updated)}
              />
              <FutureConnectorsCard />
            </div>
          ) : activeView === "tile-workspace" && activeWorkspaceTile ? (
            <TileWorkspaceView
              tile={activeWorkspaceTile}
              onBack={() => setActiveView("portal")}
              onStageAction={(item) => setCustomApprovingItem(item)}
            />
          ) : (
            /* ========================================================================= */
            /* VIEW 2: SNEAKER SHOPPING DEEP DIVE EXPERIENCE (Expanded Full View)        */
            /* ========================================================================= */
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Back to Canvas Header Bar */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #dbdbe5",
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveView("portal")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      backgroundColor: "#f4f4f5",
                      border: "1px solid #dbdbe5",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    &larr; Back to Portal Canvas
                  </button>
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#010507" }}>
                      Footwear &amp; Sneaker Shopping Advocate
                    </h2>
                    <span style={{ fontSize: "12px", color: "#57575b" }}>
                      Enforcing your ${profile.budget} budget ceiling and priority weights
                    </span>
                  </div>
                </div>

                <Link
                  href="/rules"
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#010507",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Edit Hard Constraints &rarr;
                </Link>
              </div>

              {/* Bento Row 1: Rule Summary & Interactive Sliders */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "20px" }}>
                {/* Active Rules Card */}
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #dbdbe5",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          backgroundColor: "#f3f4f6",
                          color: "#374151",
                          padding: "3px 8px",
                          borderRadius: "999px",
                        }}
                      >
                        Active Profile
                      </span>
                      <Link href="/rules" style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
                        Edit Rules &rarr;
                      </Link>
                    </div>

                    <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#010507", margin: "0 0 6px" }}>
                      Advocate Guardrails
                    </h3>
                    <p style={{ fontSize: "13px", color: "#57575b", margin: "0 0 16px" }}>
                      Enforcing hard boundaries against commercial algorithm bias.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "#57575b" }}>Budget Limit:</span>
                        <span style={{ fontWeight: 700, color: "#166534" }}>${profile.budget.toFixed(2)} USD</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "#57575b" }}>Preferred Size:</span>
                        <span style={{ fontWeight: 600, color: "#010507" }}>{profile.preferences.shoeSize || "Not specified"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "#57575b" }}>Excluded Brands:</span>
                        <span style={{ fontWeight: 600, color: "#991b1b" }}>
                          {profile.preferences.avoidBrands.join(", ") || "None"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "16px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      fontSize: "12px",
                      color: "#166534",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>🛡</span>
                    <span><strong>Zero-Compromise Guard:</strong> Over-budget products are blocked.</span>
                  </div>
                </div>

                {/* Priority Sliders */}
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #dbdbe5",
                    padding: "24px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#010507", margin: 0 }}>
                      Live Priority Ranking Weights
                    </h3>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        backgroundColor: "#e0e7ff",
                        color: "#4338ca",
                        padding: "2px 8px",
                        borderRadius: "999px",
                      }}
                    >
                      Instant Re-rank
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#57575b", margin: "0 0 16px" }}>
                    Adjust weights below to see recommendations re-rank immediately according to your criteria.
                  </p>

                  {/* Budget Slider */}
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, color: "#166534" }}>Budget Savings ({pctBudget}%)</span>
                      <span style={{ color: "#57575b" }}>Weight: {profile.priorities.budget}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={profile.priorities.budget}
                      onChange={(e) => handlePriorityChange("budget", parseInt(e.target.value) || 0)}
                      style={{ width: "100%", accentColor: "#166534" }}
                    />
                  </div>

                  {/* Comfort Slider */}
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, color: "#2563eb" }}>Comfort &amp; Cushioning ({pctComfort}%)</span>
                      <span style={{ color: "#57575b" }}>Weight: {profile.priorities.comfort}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={profile.priorities.comfort}
                      onChange={(e) => handlePriorityChange("comfort", parseInt(e.target.value) || 0)}
                      style={{ width: "100%", accentColor: "#2563eb" }}
                    />
                  </div>

                  {/* Style Slider */}
                  <div style={{ marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, color: "#9333ea" }}>Style &amp; Aesthetics ({pctStyle}%)</span>
                      <span style={{ color: "#57575b" }}>Weight: {profile.priorities.style}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={profile.priorities.style}
                      onChange={(e) => handlePriorityChange("style", parseInt(e.target.value) || 0)}
                      style={{ width: "100%", accentColor: "#9333ea" }}
                    />
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #dbdbe5",
                  padding: "20px 24px",
                }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter sneakers by brand, model, or category..."
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        border: "1px solid #dbdbe5",
                        fontSize: "14px",
                      }}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "#9ca3af",
                          cursor: "pointer",
                        }}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Sneaker Prompts */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "12px", color: "#57575b", fontWeight: 500 }}>Quick re-rankings:</span>
                  <button
                    type="button"
                    onClick={() => {
                      handlePriorityChange("budget", 85);
                      handlePriorityChange("comfort", 10);
                      handlePriorityChange("style", 5);
                    }}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "999px",
                      border: "1px solid #dbdbe5",
                      backgroundColor: "#f4f4f5",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    &ldquo;Prioritize max budget savings&rdquo;
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handlePriorityChange("budget", 10);
                      handlePriorityChange("comfort", 80);
                      handlePriorityChange("style", 10);
                    }}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "999px",
                      border: "1px solid #dbdbe5",
                      backgroundColor: "#f4f4f5",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    &ldquo;Maximize comfort for standing all day&rdquo;
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handlePriorityChange("budget", 10);
                      handlePriorityChange("comfort", 15);
                      handlePriorityChange("style", 75);
                    }}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "999px",
                      border: "1px solid #dbdbe5",
                      backgroundColor: "#f4f4f5",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    &ldquo;Prioritize clean street style&rdquo;
                  </button>
                </div>
              </div>

              {/* Perspectives & Grid */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #dbdbe5",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "20px",
                    borderBottom: "1px solid #f0f0f4",
                    paddingBottom: "16px",
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px", color: "#010507" }}>
                      Advocate Recommendations
                    </h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "#57575b" }}>
                      {rankingResults.summary}
                    </p>
                  </div>

                  {/* Perspective Tabs */}
                  <div style={{ display: "flex", backgroundColor: "#f4f4f6", borderRadius: "10px", padding: "4px" }}>
                    <button
                      type="button"
                      onClick={() => setActivePerspective("overall")}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: activePerspective === "overall" ? "#ffffff" : "transparent",
                        color: activePerspective === "overall" ? "#010507" : "#57575b",
                        fontWeight: activePerspective === "overall" ? 600 : 500,
                        fontSize: "13px",
                        cursor: "pointer",
                        boxShadow: activePerspective === "overall" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                      }}
                    >
                      Overall Match
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePerspective("budget")}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: activePerspective === "budget" ? "#ffffff" : "transparent",
                        color: activePerspective === "budget" ? "#166534" : "#57575b",
                        fontWeight: activePerspective === "budget" ? 600 : 500,
                        fontSize: "13px",
                        cursor: "pointer",
                        boxShadow: activePerspective === "budget" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                      }}
                    >
                      Best Budget
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePerspective("comfort")}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: activePerspective === "comfort" ? "#ffffff" : "transparent",
                        color: activePerspective === "comfort" ? "#2563eb" : "#57575b",
                        fontWeight: activePerspective === "comfort" ? 600 : 500,
                        fontSize: "13px",
                        cursor: "pointer",
                        boxShadow: activePerspective === "comfort" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                      }}
                    >
                      Best Comfort
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePerspective("style")}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: activePerspective === "style" ? "#ffffff" : "transparent",
                        color: activePerspective === "style" ? "#9333ea" : "#57575b",
                        fontWeight: activePerspective === "style" ? 600 : 500,
                        fontSize: "13px",
                        cursor: "pointer",
                        boxShadow: activePerspective === "style" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                      }}
                    >
                      Best Style
                    </button>
                  </div>
                </div>

                {/* Sneaker Cards Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                  {activeResultsList.map((res, index) => {
                    const { product, componentScores, matchedRules } = res;
                    const savings = profile.budget - product.price;

                    return (
                      <div
                        key={product.id}
                        style={{
                          borderRadius: "14px",
                          border: index === 0 ? "2px solid #010507" : "1px solid #dbdbe5",
                          backgroundColor: "#ffffff",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          position: "relative",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            left: "12px",
                            backgroundColor: index === 0 ? "#010507" : "rgba(255,255,255,0.9)",
                            color: index === 0 ? "#ffffff" : "#010507",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            backdropFilter: "blur(4px)",
                            zIndex: 2,
                          }}
                        >
                          {index === 0
                            ? `★ #1 ${activePerspective.toUpperCase()} CHOICE`
                            : `#${index + 1} Choice`}
                        </div>

                        <div style={{ height: "170px", backgroundColor: "#f3f4f6", overflow: "hidden", position: "relative" }}>
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>

                        <div style={{ padding: "18px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontSize: "11px", color: "#57575b", fontWeight: 600, textTransform: "uppercase" }}>
                              {product.brand} · {product.category}
                            </div>
                            <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#010507", margin: "4px 0 8px" }}>
                              {product.name}
                            </h4>

                            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "12px" }}>
                              <span style={{ fontSize: "20px", fontWeight: 700, color: "#166534" }}>
                                ${product.price.toFixed(2)}
                              </span>
                              {savings > 0 && (
                                <span style={{ fontSize: "12px", color: "#15803d", fontWeight: 500 }}>
                                  (Saves ${savings.toFixed(2)})
                                </span>
                              )}
                            </div>

                            <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                              <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "#f0fdf4", color: "#166534", fontWeight: 600 }}>
                                Budget {componentScores.budgetScore}/100
                              </span>
                              <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "#eff6ff", color: "#1d4ed8", fontWeight: 600 }}>
                                Comfort {product.comfortScore}/100
                              </span>
                              <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "#faf5ff", color: "#7e22ce", fontWeight: 600 }}>
                                Style {product.styleScore}/100
                              </span>
                            </div>

                            <p style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.4, margin: "0 0 16px" }}>
                              {matchedRules[0] || product.description}
                            </p>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "8px", paddingTop: "12px", borderTop: "1px solid #f0f0f4" }}>
                            <button
                              type="button"
                              onClick={() => setInspectingItem(res)}
                              style={{
                                padding: "8px 10px",
                                borderRadius: "8px",
                                border: "1px solid #dbdbe5",
                                backgroundColor: "#ffffff",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#374151",
                                cursor: "pointer",
                              }}
                            >
                              Why this?
                            </button>
                            <button
                              type="button"
                              onClick={() => setApprovingItem(res)}
                              style={{
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: "#010507",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#ffffff",
                                cursor: "pointer",
                              }}
                            >
                              Prepare Cart &rarr;
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rejected by Rules Section */}
              {rankingResults.rejected.length > 0 && (
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #fecaca",
                    padding: "24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span
                      style={{
                        backgroundColor: "#fee2e2",
                        color: "#991b1b",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      Protected by Your Rules
                    </span>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#991b1b" }}>
                      Rejected by Your Rules ({rankingResults.rejected.length})
                    </h3>
                  </div>

                  <p style={{ fontSize: "13px", color: "#57575b", margin: "0 0 16px" }}>
                    Commercial shopping sites push these models because of high affiliate commission or influencer hype. Internet U blocks them because they violate your explicit rules.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                    {rankingResults.rejected.map((res) => {
                      const { product, violatedRules } = res;
                      return (
                        <div
                          key={product.id}
                          style={{
                            borderRadius: "12px",
                            border: "1px solid #fee2e2",
                            backgroundColor: "#fff5f5",
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                              <span style={{ fontSize: "12px", fontWeight: 600, color: "#7f1d1d" }}>{product.brand}</span>
                              <span style={{ fontSize: "14px", fontWeight: 700, color: "#991b1b" }}>
                                ${product.price.toFixed(2)}
                              </span>
                            </div>
                            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#010507", margin: "0 0 8px" }}>
                              {product.name}
                            </h4>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#991b1b",
                                backgroundColor: "#fee2e2",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                marginBottom: "12px",
                              }}
                            >
                              <strong>Violation:</strong> {violatedRules[0]}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setInspectingItem(res)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              border: "1px solid #fca5a5",
                              backgroundColor: "#ffffff",
                              color: "#991b1b",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Inspect Rejection Reasons
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Live Exa Web Grounding */}
              <ExaWebSearchCard initialQuery="best everyday sneakers under 150 honest durability reviews" />
            </div>
          )}

          {/* Right Column: CopilotChat Assistant Panel */}
          {showChatPanel && (
            <aside
              style={{
                position: "sticky",
                top: "90px",
                height: "calc(100vh - 120px)",
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #dbdbe5",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #dbdbe5",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#010507" }}>
                    Advocate Assistant
                  </h3>
                  <p style={{ margin: 0, fontSize: "11px", color: "#57575b" }}>
                    Reasoning according to your profile
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChatPanel(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "18px",
                    cursor: "pointer",
                    color: "#57575b",
                  }}
                >
                  &times;
                </button>
              </div>

              <div style={{ flex: 1, overflow: "hidden" }}>
                <CopilotChat
                  className="ck-chat"
                  labels={{
                    welcomeMessageText: `Hello! I am your Internet U advocate. Tell me what you'd like to do or ask about your active tiles and rules.`,
                    chatInputPlaceholder: "Ask your advocate...",
                  }}
                />
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* Why This Explanation Modal */}
      <WhyThisModal
        evaluation={inspectingItem}
        onClose={() => setInspectingItem(null)}
      />

      {/* Consequential Action Approval Modal */}
      {(approvingItem || customApprovingItem) && (
        <ApprovalModal
          evaluation={approvingItem}
          customAction={customApprovingItem}
          onClose={() => {
            setApprovingItem(null);
            setCustomApprovingItem(null);
          }}
          onApproved={(name) => {
            setPurchasedNotice(name);
            setApprovingItem(null);
            setCustomApprovingItem(null);
            setTimeout(() => setPurchasedNotice(null), 5000);
          }}
        />
      )}

      {/* General Tile Detail / Action Modal */}
      <TileDetailModal
        tile={activeModalTile}
        onClose={() => setActiveModalTile(null)}
        onOpenWorkspace={handleOpenTileWorkspace}
      />
    </div>
  );
}
