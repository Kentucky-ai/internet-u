# Internet U

**Your internet, working for you.** An AI advocate that recommends by *your* rules,
priorities and non-negotiables, not by ads, popularity or a platform's algorithm.

Built by a four-person team at the **AI Tinkerers Louisville** global hackathon,
*Agents, Everywhere: Bots, Channels & More*, September 12, 2026.

Live demo: https://internet-u.netlify.app

## What it does

The MVP proves the idea with one job: **find sneakers by the user's own rules.**

1. **My Rules** holds the profile: hard constraints (max budget, currency, shoe size,
   brands and styles to avoid, free-text non-negotiables) and adjustable priorities
   (Budget / Comfort / Style sliders). The profile is the only thing the agent optimizes for.
2. **"Help me find sneakers."** loads the profile, searches products (live if configured,
   otherwise a demo catalog), rejects anything that breaks a hard constraint, ranks the rest
   by the priority weights, and shows four perspectives: best match for current priorities,
   best budget fit, best comfort tradeoff, best style match.
3. **Why this?** on every option lists the rules it satisfies, the rules it broke, the
   tradeoffs and what is still unknown.
4. **Rejected by your rules** is a separate, visible section. Over-budget options are never
   presented as acceptable.
5. Moving a priority slider re-ranks everything instantly, no reload.
6. **Add to cart** opens an approval gate. Approving records the decision and says plainly
   that no real purchase was made. After an approval the agent may *propose* a profile
   change; it never applies one without a yes.

## Running it locally

```bash
npm install
npm run dev          # Vite only: http://localhost:5173 (API routes 404 -> demo catalog)
netlify dev          # Vite + the two functions: http://localhost:8888
```

Checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

## Environment variables

Copy `.env.example` to `.env`. Everything is optional; with nothing set the whole demo
runs on deterministic local logic.

| Variable | Where | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | server (function) | live product search via OpenAI web search; chat if no OpenRouter key |
| `OPENROUTER_API_KEY` | server (function) | chat replies; preferred over OpenAI for chat when both are set |
| `OPENAI_SEARCH_MODEL`, `OPENAI_CHAT_MODEL`, `OPENROUTER_MODEL` | server | model overrides |
| `VITE_OOF_BASE_URL` | client | OOF auth/authz base URL; unset = demo user |

## How live search and fallback work

On Netlify, with the team's **AI Gateway** enabled, `OPENAI_API_KEY` and `OPENAI_BASE_URL`
are injected into the functions automatically, so live search and LLM replies work in
production with no keys configured by hand. `GET /api/health` reports which integrations
are present (names only). Locally without keys, everything runs in demo mode.

- `netlify/functions/search.mts` (`POST /api/search`) asks OpenAI web search for real
  products around the user's budget and returns them in the normalized `Product` shape.
  Comfort/style scores from live data are model estimates and are labeled as such in the UI.
- `netlify/functions/chat.mts` (`POST /api/chat`) writes the conversational reply *over*
  the deterministic ranking. It receives the profile, weights, ranking and unknowns, and is
  instructed never to re-rank, never to change preferences, and never to claim an action.
- `src/lib/products/search.ts` falls back to `src/lib/products/mock.ts` on a missing key
  (503), an upstream failure, a network error, or fewer than three usable products, and
  says which happened in the UI ("Demo catalog" badge plus a note).
- `src/lib/llm/adapter.ts` falls back to a deterministic local reply the same way; the
  reply is labeled "Deterministic reply (no LLM key needed)".
- Ranking (`src/lib/ranking.ts`) is pure and tested (`src/lib/ranking.test.ts`): reject
  hard-constraint violators, normalize weights, weighted sum, return explanation metadata.

## Deploying to Netlify

`netlify.toml` builds with `npm run build`, publishes `dist/`, bundles the functions from
`netlify/functions`, and rewrites all paths to `index.html` for client routing. The site is
git-linked: a push to `main` deploys. Set the server-side variables in the Netlify site
settings if you want live search or LLM replies in production.

## What is mocked

- The demo catalog: nine fictional sneakers with a deliberate spread (several under $150,
  two over, two brands worth avoiding, different styles and comfort/style tradeoffs).
  Product images are inline SVG placeholders.
- OOF (auth / authorization / billing): `src/lib/oof/adapter.ts` is an interface with a
  demo adapter (demo user, always authorized) and an HTTP adapter behind `VITE_OOF_BASE_URL`.
- The profile persists in `localStorage` under `internet-u.profile`; decisions under
  `internet-u.decisions`. Both are swappable for per-user server storage.
- Connectors (`src/lib/connectors/types.ts`): interface only, no implementations.

## Intentionally deferred

Real checkout or payment, cart integrations, social/email/calendar ingestion, background
monitoring, autonomous purchasing, plugin marketplace, billing, multi-user admin,
automatic learning, vector database, fine-tuning.

## Team

_Add yourselves here._

## License

Apache-2.0
