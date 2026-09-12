# Internet U — Your Internet, Working for You

> **AI Tinkerers Hackathon MVP — Agents, Everywhere**  
> An AI advocate guided by *your* rules, budget, and priorities — actively protecting you from platform advertising algorithms, affiliate steering, and dark patterns.

---

## 1. Overview & Vision

The commercial internet is dominated by algorithms optimized for platform advertising revenue, affiliate margins, and engagement. **Internet U** flips that relationship: it provides users with an AI advocate that represents *their* interests alone.

Internet U learns what matters to each user—budget limits, brand exclusions, non-negotiables, and priority weights (budget savings, ergonomic comfort, street style)—and acts as an **active skeptic on the user's behalf**:
- Questions recommendations pushed by commercial algorithms.
- Strictly blocks products that violate hard constraints (e.g. over-budget or excluded brands).
- Surfaces tradeoffs and unverified manufacturer claims honestly.
- Requires explicit human-in-the-loop approval before any consequential action (such as cart staging or purchasing).
- Incorporates a supervised learning feedback loop to update user rules with explicit consent.

---

## 2. Quick Start & Local Run

### Prerequisites
- Node.js 22+ (tested on Node v24.20.0, npm 11.19.0)
- Git

### Installation & Launch

```bash
# 1. Install workspace dependencies
npm install

# 2. Run unit tests
npm test

# 3. Run typecheck across all workspaces
npm run typecheck

# 4. Start local development server
npm run dev
# or: npm run dev:web
```

The web application runs at **`http://localhost:3100`** (or configured `PORT`).

---

## 3. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Required? | Description |
|---|---|---|
| `PORT` | Optional | Web server port (default: `3100`). |
| `MODEL_PROVIDER` | Optional | `openai` or `openrouter`. Defaults to offline deterministic fallback if unconfigured. |
| `OPENAI_API_KEY` | Optional | OpenAI API key for live LLM reasoning. |
| `OPENROUTER_API_KEY` | Optional | OpenRouter API key for model switching. |
| `EXA_API_KEY` | Optional | Exa API key for live web search and grounded retrieval. |
| `EXA_SEARCH_TYPE` | Optional | `fast` (~450ms) or `instant`. |
| `AMBIGUOUS_API_KEY` | Optional | Workspace sync key for Ambiguous workplace records. |

> **Zero-Dependency Guarantee**: The demo application does **not** fail if API keys are missing. It automatically activates high-fidelity local deterministic ranking, rule auditing, and fallback catalog data so the complete end-to-end flow is fully testable and presentation-ready.

---

## 4. Key Architecture & Features

### A. Bento Command Center (`apps/web/src/app/page.tsx`)
- **Active Profile Guardrails Card**: Real-time summary of current budget ceiling ($150), shoe size, and brand exclusions.
- **Live Priority Sliders**: Direct, responsive sliders for **Budget**, **Comfort**, and **Style**. Dragging any slider instantly re-ranks all recommendations live without page reloads!
- **Search & Quick Request Bar**: Quick prompt triggers including `"Help me find sneakers"`, `"Prioritize max budget savings"`, and `"Maximize comfort for standing all day"`.
- **4 Recommendation Perspectives**:
  1. *Overall Match* (balanced multi-attribute weighted score)
  2. *Best Budget* (maximum dollar savings)
  3. *Best Comfort* (top cushioning and ergonomics)
  4. *Best Style* (cleanest aesthetics and silhouettes)
- **"Why This?" Explanation Modal (`apps/web/src/components/why-this-modal.tsx`)**:
  - Detailed audit of matched rules, violated rules, surfaced tradeoffs, and unverified attributes.
- **"Rejected by Your Rules" Defense Section**:
  - Visibly displays over-budget and excluded shoes (e.g. $215 Jordan 4, $165 Hoka Bondi, Balenciaga) that platform algorithms push, clearly explaining why the advocate blocked them.
- **Human-In-The-Loop Approval Gate (`apps/web/src/components/approval-modal.tsx`)**:
  - Consequential actions require explicit confirmation. Transparently confirms: *"Approved for demo purposes. No real purchase was made."*
- **Supervised Learning Feedback Loop (`apps/web/src/components/supervised-learning-card.tsx`)**:
  - "Teach Your Advocate" lets users submit corrections or preferences that are explicitly retained in the user knowledge base.
- **Future Connectors Architecture (`apps/web/src/components/future-connectors-card.tsx`)**:
  - Scoped, permission-gated connectors for Amazon, Google Shopping, Calendar, and Slack.

### B. Dedicated My Rules Page (`apps/web/src/app/rules/page.tsx`)
- Fully editable hard constraints (budget cap, currency, shoe size, brand avoid list, non-negotiables).
- Priority weight sliders with visual distribution bars.
- Full localStorage persistence with live cross-component sync.

### C. Deterministic Ranking & Audit Engine (`apps/web/src/lib/ranking.ts`)
- Pure, mathematical scoring function with unit tests in `apps/web/src/lib/ranking.test.ts`.
- Enforces strict hard constraints before scoring.
- Computes weighted overall score:
  $$\text{score} = w_{\text{budget}} \cdot S_{\text{budget}} + w_{\text{comfort}} \cdot S_{\text{comfort}} + w_{\text{style}} \cdot S_{\text{style}}$$

---

## 5. Demo Acceptance Script (90-Second Walkthrough)

To reproduce the hackathon demonstration:

1. **Open Internet U Homepage** at `http://localhost:3100`.
2. **Review Command Center**: Point out the active $150 budget cap and 60% budget / 25% comfort / 15% style weights.
3. **Open "My Rules" (`/rules`)**:
   - Change budget or add a brand exclusion.
   - Adjust priority sliders.
   - Save and return to Command Center.
4. **Trigger Search**: Click `"Help me find sneakers"` or search for a style.
5. **Inspect Recommendations**:
   - Show how the top options fit the $150 budget.
   - Switch between **Overall**, **Best Budget**, **Best Comfort**, and **Best Style** perspectives.
6. **Show "Why This?"**: Click on a recommendation to reveal the transparent breakdown of rules satisfied, tradeoffs, and unverified data.
7. **Demonstrate Advocacy Protection**: Scroll down to the **"Rejected by Your Rules"** section. Show that high-margin or hype sneakers (like the $215 Nike Jordan 4) were blocked on the user's behalf.
8. **Live Priority Shift**: Move the **Style** slider up to 90% in the command center and watch the recommendations dynamically re-rank in real time!
9. **Consequential Action Gate**: Click `"Prepare Cart"` on a shoe. Show the approval modal explaining the action and verifying rules. Click `"Yes, Authorize Action"` to reveal the transparent demo confirmation.
10. **Supervised Learning**: Add a rule in `"Teach Your Advocate"` (e.g., *"Prefer arch support and wide toe-box"*), showing how explicit feedback enters the user's knowledge base.

---

## 6. Deployment to Netlify

The application is built with Next.js 15:

```bash
# Build production bundle
npm run build --workspace web

# Start production server
npm start --workspace web
```

For Netlify:
- Base directory: `apps/web`
- Build command: `npm run build`
- Publish directory: `apps/web/.next`
- Add `@netlify/plugin-nextjs` in `netlify.toml` if deploying via Netlify CLI or Git.

---

## 7. What is Mocked vs. Implemented

| Feature | Status | Notes |
|---|---|---|
| User Rules & Constraints | **Live & Implemented** | Full state persistence in browser storage & real-time sync |
| Ranking Engine | **Live & Implemented** | Pure deterministic mathematical scoring & perspective generation |
| Bento Command Center UI | **Live & Implemented** | Modern Bento grid, responsive, live sliders, modals |
| Rejection & Skepticism UI | **Live & Implemented** | Visibly blocks non-compliant shoes with audit logs |
| Approval Gate (HITL) | **Live & Implemented** | Consequential action modal with transparent confirmation |
| Supervised Learning Loop | **Live & Implemented** | Explicit knowledge feedback storage and rule removal |
| Product Catalog | **Mocked / Live hybrid** | Real-world models with fallback data + Exa web search tool |
| External Cart / Checkout | **Intentionally Deferred** | Real credit card charging is out of scope for the MVP |
| Background Social Scraping | **Intentionally Deferred** | Disallowed by design: all connectors require explicit consent |
