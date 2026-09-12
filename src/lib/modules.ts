/**
 * The advocate platform is a set of modules. Each declares the data it needs and the permissions it would ask for.
 * Only "active" modules run today; the rest are boundaries for future connectors (see connectors/types.ts).
 */
export type Module = {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  status: "active" | "planned";
  route?: string;
  permissions: string[];
  example?: string;
};

export const modules: Module[] = [
  { id: "sneakers", name: "Shopping: sneakers", icon: "👟", tagline: "Find shoes by your budget, comfort and style rules. Real listings, ranked your way.", status: "active", route: "/modules/sneakers", permissions: ["Read My Rules", "Search the web for products", "Ask before adding to any cart"], example: "Help me find sneakers." },
  { id: "email", name: "Email", icon: "✉️", tagline: "Triage by your priorities, draft replies in your voice, never send without a yes.", status: "planned", permissions: ["Read inbox (scoped)", "Draft only; sending needs approval"] },
  { id: "calendar", name: "Calendar", icon: "📅", tagline: "Protect focus time and family time the way you defined them.", status: "planned", permissions: ["Read calendar", "Propose events; creating needs approval"] },
  { id: "subscriptions", name: "Subscriptions", icon: "🔁", tagline: "Surface every recurring charge and flag the ones that break your rules.", status: "planned", permissions: ["Read transactions (scoped)", "Cancel only with approval"] },
  { id: "travel", name: "Travel", icon: "✈️", tagline: "Flights and stays ranked by your budget, comfort and time constraints.", status: "planned", permissions: ["Search fares", "Book only with approval"] },
  { id: "finance", name: "Financial planning", icon: "📊", tagline: "Plans against your goals, not a bank's product catalog. Information only, no advice.", status: "planned", permissions: ["Read balances (scoped)", "No transfers, ever"] },
  { id: "social", name: "Social", icon: "💬", tagline: "Your feed filtered by your values, not an engagement score.", status: "planned", permissions: ["Read timeline (scoped)", "Post only with approval"] },
  { id: "work", name: "Work tools", icon: "🧰", tagline: "Tickets, docs and chats summarized by what you said matters.", status: "planned", permissions: ["Read workspace (scoped)", "Write only with approval"] },
];
