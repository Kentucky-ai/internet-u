export interface AdvocateTile {
  id: string;
  title: string;
  category: "Shopping" | "Travel" | "Housing" | "Tech" | "Productivity" | "Custom";
  status: "Active" | "Monitoring" | "Action Pending";
  summary: string;
  guardrails: string[];
  isSpecialSneakerTile?: boolean;
  highlightData: {
    primaryMetric: string;
    primaryLabel: string;
    badge: string;
    itemImage?: string;
    actionLabel: string;
  };
  createdTime: string;
  externalBiasesBlocked: string[];
}

export const INITIAL_TILES: AdvocateTile[] = [
  {
    id: "sneakers-showcase",
    title: "Footwear & Sneaker Advocate",
    category: "Shopping",
    status: "Active",
    summary: "Active skeptic screening sneaker markets against your $150 budget and personal comfort/style priorities.",
    isSpecialSneakerTile: true,
    guardrails: [
      "Hard maximum budget: $150.00 USD",
      "Strict exclusion: Balenciaga, Yeezy",
      "Dynamic ranking: 60% Budget / 25% Comfort / 15% Style",
      "Consequential action gate before cart or purchase",
    ],
    highlightData: {
      primaryMetric: "$150.00 Max",
      primaryLabel: "Enforced Budget",
      badge: "Deep-Dive Showcase",
      itemImage: "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600&auto=format&fit=crop&q=80",
      actionLabel: "Open Sneaker Experience",
    },
    createdTime: "Just now",
    externalBiasesBlocked: [
      "Blocked affiliate markups",
      "Filtered sponsored search placements",
      "Rejected over-budget Jordan 4 ($215)",
    ],
  },
  {
    id: "flight-sifter",
    title: "Flight & Travel Sifter",
    category: "Travel",
    status: "Monitoring",
    summary: "Researching weekend flights to Chicago with zero tolerance for hidden baggage fees or deceptive 'basic economy' restrictions.",
    guardrails: [
      "Max flight budget: $250 roundtrip",
      "Must include full overhead carry-on in base price",
      "No layovers exceeding 2 hours",
      "Block airlines with below 75% on-time arrival rate",
    ],
    highlightData: {
      primaryMetric: "$218 Roundtrip",
      primaryLabel: "Verified Total",
      badge: "Fee-Stripped",
      itemImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80",
      actionLabel: "View Verified Flights",
    },
    createdTime: "2 hours ago",
    externalBiasesBlocked: [
      "Stripped $65 hidden carry-on fee traps",
      "Blocked dynamic cookie-based price surges",
    ],
  },
  {
    id: "apartment-hunter",
    title: "Apartment Rental Guard",
    category: "Housing",
    status: "Active",
    summary: "Sifting local rental listings, filtering out broker fee scams, and verifying true rent-stabilized terms.",
    guardrails: [
      "Maximum rent: $1,800/month",
      "Must have verified in-unit washer/dryer",
      "Strict prohibition: Zero broker commissions",
      "Walk score minimum: 80+",
    ],
    highlightData: {
      primaryMetric: "$1,675/mo",
      primaryLabel: "Verified No-Fee",
      badge: "Direct Landlord",
      itemImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80",
      actionLabel: "Inspect Lease Terms",
    },
    createdTime: "Yesterday",
    externalBiasesBlocked: [
      "Rejected 4 listings with hidden broker fees",
      "Flagged deceptive photos via EXIF metadata check",
    ],
  },
  {
    id: "tech-scout",
    title: "Workstation Hardware Scout",
    category: "Tech",
    status: "Action Pending",
    summary: "Screening developer laptops for repairability, minimum 32GB RAM, and zero pre-installed OEM bloatware.",
    guardrails: [
      "Hard ceiling: $1,200 USD",
      "Minimum 32GB DDR5 (Non-soldered preferred)",
      "Strictly reject manufacturers with locked bootloaders",
    ],
    highlightData: {
      primaryMetric: "$1,099",
      primaryLabel: "Spec Verified",
      badge: "Approval Required",
      itemImage: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80",
      actionLabel: "Review Approval Gate",
    },
    createdTime: "3 days ago",
    externalBiasesBlocked: [
      "Filtered sponsored affiliate ranking articles",
      "Blocked deceptive 8GB unified memory configurations",
    ],
  },
];

export function createTileFromPrompt(prompt: string): AdvocateTile {
  const p = prompt.toLowerCase();
  const id = `tile-${Date.now()}`;

  if (p.includes("hotel") || p.includes("flight") || p.includes("trip") || p.includes("travel")) {
    return {
      id,
      title: "Travel & Itinerary Advocate",
      category: "Travel",
      status: "Active",
      summary: `Advocate screening: "${prompt}". Filtering out surge-pricing traps and undisclosed resort fees.`,
      guardrails: [
        "Enforce strict upfront all-in pricing",
        "Disclose hidden resort & cleaning fees",
        "Prioritize flexible cancellation terms",
      ],
      highlightData: {
        primaryMetric: "Trip Filtered",
        primaryLabel: "Bias Free",
        badge: "Active Sifter",
        itemImage: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop&q=80",
        actionLabel: "Inspect Itinerary",
      },
      createdTime: "Just now",
      externalBiasesBlocked: [
        "Hidden booking fees stripped",
        "Filtered sponsored OTA search rankings",
      ],
    };
  }

  if (p.includes("car") || p.includes("auto") || p.includes("vehicle")) {
    return {
      id,
      title: "Auto Purchase & Lease Advocate",
      category: "Shopping",
      status: "Active",
      summary: `Auditing vehicle listings for: "${prompt}". Detecting dealer markup tricks and mandatory add-on packages.`,
      guardrails: [
        "Reject dealer add-ons (nitrogen tires, VIN etching)",
        "Verify out-the-door price vs MSRP",
        "Cross-reference manufacturer APR incentives",
      ],
      highlightData: {
        primaryMetric: "OTD Audited",
        primaryLabel: "Price Guard",
        badge: "Dealer Sifter",
        itemImage: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80",
        actionLabel: "View Verified Deals",
      },
      createdTime: "Just now",
      externalBiasesBlocked: [
        "Stripped $2,400 in junk dealer accessories",
        "Verified true market invoice pricing",
      ],
    };
  }

  // Generic custom advocate tile
  return {
    id,
    title: prompt.length > 35 ? `${prompt.slice(0, 32)}...` : prompt,
    category: "Custom",
    status: "Active",
    summary: `Custom agent advocate spun up for: "${prompt}". Enforcing user-aligned rules against marketing algorithms.`,
    guardrails: [
      "User-aligned ranking (no ad steering)",
      "Strict data privacy & zero background tracking",
      "Explicit human-in-the-loop approval before actions",
    ],
    highlightData: {
      primaryMetric: "Guarded",
      primaryLabel: "Active Rule Set",
      badge: "Custom Advocate",
      itemImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80",
      actionLabel: "Open Workspace",
    },
    createdTime: "Just now",
    externalBiasesBlocked: [
      "Filtered dark commercial design patterns",
      "Enforcing strict user privacy guardrails",
    ],
  };
}

