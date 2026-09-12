export interface TileCandidateRuleCheck {
  rule: string;
  passed: boolean;
  note: string;
}

export interface TileCandidate {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  savings?: string;
  rating: string;
  summary: string;
  image?: string;
  tags: string[];
  status: "approved" | "blocked_trap";
  trapReason?: string;
  source: string;
  ruleChecks: TileCandidateRuleCheck[];
}

export interface TileActivityLog {
  id: string;
  timestamp: string;
  type: "scan" | "filter" | "trap_detected" | "compliance" | "user_action";
  message: string;
  impact: string;
}

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
  searchQuery?: string;
  candidates?: TileCandidate[];
  activityLog?: TileActivityLog[];
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
    searchQuery: "honest running shoe reviews durability under 150 2026",
    activityLog: [
      {
        id: "s-1",
        timestamp: "Just now",
        type: "compliance",
        message: "Applied hard budget filter at $150.00 ceiling.",
        impact: "Quarantined 3 items priced $165 to $1,050",
      },
      {
        id: "s-2",
        timestamp: "1 min ago",
        type: "trap_detected",
        message: "Identified sponsored affiliate placement for luxury designer shoe.",
        impact: "Filtered Balenciaga Triple S ($1,050) from feed",
      },
      {
        id: "s-3",
        timestamp: "2 mins ago",
        type: "scan",
        message: "Screened catalog against comfort & budget priority coefficients.",
        impact: "Ranked Saucony Cohesion 17 as #1 Overall Value",
      },
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
      actionLabel: "Open Flight Workspace",
    },
    createdTime: "2 hours ago",
    externalBiasesBlocked: [
      "Stripped $65 hidden carry-on fee traps",
      "Blocked dynamic cookie-based price surges",
    ],
    searchQuery: "chicago flights non-stop carry-on included price trends",
    candidates: [
      {
        id: "f-1",
        name: "United Express (SDF ➔ ORD Nonstop)",
        price: "$218 Total",
        originalPrice: "$283 with add-ons",
        savings: "Saved $65",
        rating: "9.2 / 10 On-Time",
        summary: "Direct flight with Standard Economy fare. Includes overhead bin carry-on and advance seat selection.",
        tags: ["Nonstop", "Carry-on Included", "Standard Economy"],
        status: "approved",
        source: "Direct Airline API",
        ruleChecks: [
          { rule: "Under $250 budget", passed: true, note: "$218 verified total" },
          { rule: "Overhead carry-on included", passed: true, note: "Standard Economy tier verified" },
          { rule: "Max 2h layover", passed: true, note: "0 layovers (direct)" },
        ],
      },
      {
        id: "f-2",
        name: "American Eagle (SDF ➔ ORD Nonstop)",
        price: "$234 Total",
        originalPrice: "$299 with add-ons",
        savings: "Saved $65",
        rating: "8.9 / 10 On-Time",
        summary: "Evening direct return flight. Full carry-on verified with zero baggage surcharges.",
        tags: ["Nonstop", "No Hidden Surcharges"],
        status: "approved",
        source: "Direct Airline API",
        ruleChecks: [
          { rule: "Under $250 budget", passed: true, note: "$234 verified total" },
          { rule: "Overhead carry-on included", passed: true, note: "Carry-on verified" },
        ],
      },
      {
        id: "f-trap",
        name: "Ultra-Low-Cost Carrier 'Deals'",
        price: "$294 True Checkout Price",
        originalPrice: "Advertised: $69 Fare",
        rating: "3.1 / 10 Commercial Trap",
        summary: "Platform algorithm advertised this as '$69' to rank first on search engines, but added $75 carry-on fee, $45 seat assignment, $35 boarding pass fee, and $70 return baggage.",
        tags: ["Deceptive Base Fare", "Baggage Bait Trap", "Quarantined"],
        status: "blocked_trap",
        trapReason: "Base fare is unbundled bait; total exceeds $250 limit once standard baggage is added.",
        source: "Commercial Flight Aggregator",
        ruleChecks: [
          { rule: "Under $250 budget", passed: false, note: "True price $294 exceeds $250 ceiling" },
          { rule: "Carry-on included in base", passed: false, note: "Charges $75 extra for carry-on bag" },
        ],
      },
    ],
    activityLog: [
      {
        id: "f-act-1",
        timestamp: "10 mins ago",
        type: "trap_detected",
        message: "Intercepted unbundled $69 fare trick on OTA aggregator.",
        impact: "Quarantined listing after detecting $140 in mandatory baggage surcharges",
      },
      {
        id: "f-act-2",
        timestamp: "25 mins ago",
        type: "filter",
        message: "Stripped dynamic browser cookies to neutralize artificial return-flight price surges.",
        impact: "Preserved $218 verified baseline rate",
      },
      {
        id: "f-act-3",
        timestamp: "1 hour ago",
        type: "scan",
        message: "Verified direct airline booking rates bypassing middleman markups.",
        impact: "Confirmed 2 compliant non-stop options",
      },
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
      actionLabel: "Open Rental Workspace",
    },
    createdTime: "Yesterday",
    externalBiasesBlocked: [
      "Rejected 4 listings with hidden broker fees",
      "Flagged deceptive photos via EXIF metadata check",
    ],
    searchQuery: "louisville nulu 2 bedroom apartments no broker fee washer dryer",
    candidates: [
      {
        id: "a-1",
        name: "The Lofts at NuLu #304",
        price: "$1,675 / mo",
        originalPrice: "$1,890 / mo with broker",
        savings: "Zero Broker Fee ($2,512 saved)",
        rating: "9.6 / 10 WalkScore: 88",
        summary: "Direct landlord lease. 2-bedroom with private balcony, in-unit full-size W/D, and included fiber internet.",
        tags: ["Direct Landlord", "In-Unit W/D", "Walkable NuLu", "Pet Friendly"],
        status: "approved",
        source: "Independent Landlord Registry",
        ruleChecks: [
          { rule: "Rent under $1,800/mo", passed: true, note: "$1,675/mo verified" },
          { rule: "In-unit washer/dryer", passed: true, note: "Full-size Bosch in-unit" },
          { rule: "Zero broker fee", passed: true, note: "Direct lease from property owner" },
        ],
      },
      {
        id: "a-2",
        name: "Highlands Brick Historic Duplex",
        price: "$1,595 / mo",
        originalPrice: "$1,750 / mo",
        savings: "No application markup",
        rating: "9.3 / 10 WalkScore: 84",
        summary: "Hardwood floors, private off-street parking, in-unit laundry, and water/trash included in base rent.",
        tags: ["Highlands", "In-Unit W/D", "Water Included"],
        status: "approved",
        source: "Local Tenant Union Registry",
        ruleChecks: [
          { rule: "Rent under $1,800/mo", passed: true, note: "$1,595/mo verified" },
          { rule: "Zero broker fee", passed: true, note: "Owner managed" },
        ],
      },
      {
        id: "a-trap",
        name: "Market Square 'Luxury Special'",
        price: "$2,050 / mo Effective",
        originalPrice: "Advertised: $1,450 / mo",
        rating: "2.4 / 10 Deceptive Listing",
        summary: "Advertised as '$1,450' with bold headlines, but lease disclosure requires 15% broker fee ($2,610 upfront) + $180/mo mandatory 'lifestyle amenity fee' + $75/mo trash valet fee.",
        tags: ["Broker Fee Trap", "Junk Amenities", "Quarantined"],
        status: "blocked_trap",
        trapReason: "Effective monthly cost is $2,050 after junk fees; violates $1,800 cap and no-broker constraint.",
        source: "Commercial Brokerage Portal",
        ruleChecks: [
          { rule: "Rent under $1,800/mo", passed: false, note: "True cost $2,050/mo violates cap" },
          { rule: "Zero broker fee", passed: false, note: "Requires $2,610 broker fee" },
        ],
      },
    ],
    activityLog: [
      {
        id: "a-act-1",
        timestamp: "3 hours ago",
        type: "trap_detected",
        message: "Scanned fine print on 4 apartment listings: hidden 15% broker fee detected.",
        impact: "Quarantined listings to protect user from $2,600 unlisted expense",
      },
      {
        id: "a-act-2",
        timestamp: "5 hours ago",
        type: "compliance",
        message: "Filtered listings missing verified in-unit washer/dryer.",
        impact: "Removed 9 listings with communal or off-site laundry",
      },
      {
        id: "a-act-3",
        timestamp: "Yesterday",
        type: "scan",
        message: "Connected to direct property owner registries.",
        impact: "Identified 2 compliant direct-lease properties",
      },
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
      actionLabel: "Open Hardware Workspace",
    },
    createdTime: "3 days ago",
    externalBiasesBlocked: [
      "Filtered sponsored affiliate ranking articles",
      "Blocked deceptive 8GB unified memory configurations",
    ],
    searchQuery: "best repairable developer laptop 32gb ram under 1200",
    candidates: [
      {
        id: "t-1",
        name: "Framework Laptop 13 (AMD Ryzen 7)",
        price: "$1,099 Total",
        originalPrice: "$1,249 MSRP",
        savings: "Direct Manufacturer Deal",
        rating: "9.8 / 10 Repairability: 10/10",
        summary: "32GB DDR5 dual-channel (user replaceable), modular expansion cards, matte display, 100% open schematics.",
        tags: ["10/10 Repairable", "Modular Ports", "Zero Bloatware", "Linux Ready"],
        status: "approved",
        source: "Framework Direct",
        ruleChecks: [
          { rule: "Budget ceiling $1,200", passed: true, note: "$1,099 is $101 under budget" },
          { rule: "32GB DDR5 RAM", passed: true, note: "32GB user-upgradeable SODIMM" },
          { rule: "Zero pre-installed bloatware", passed: true, note: "Clean OS installation" },
        ],
      },
      {
        id: "t-2",
        name: "Lenovo ThinkPad T14s Gen 4",
        price: "$1,149 Total",
        originalPrice: "$1,450 Commercial Retail",
        savings: "Saved $301",
        rating: "9.1 / 10 Durability",
        summary: "32GB LPDDR5x, Ryzen 7 PRO, magnesium alloy chassis, verified Linux certified hardware.",
        tags: ["ThinkPad Keyboard", "Long Battery", "Enterprise Vetted"],
        status: "approved",
        source: "Lenovo Outlet Direct",
        ruleChecks: [
          { rule: "Budget ceiling $1,200", passed: true, note: "$1,149 complies with cap" },
          { rule: "32GB RAM", passed: true, note: "32GB configuration verified" },
        ],
      },
      {
        id: "t-trap",
        name: "Big-Box 'Gaming & Productivity' Special",
        price: "$999 Advertised",
        rating: "3.5 / 10 Planned Obsolescence",
        summary: "Heavy marketing push on retail tech blogs. Stripped inspection revealed 8GB soldered RAM with no expansion slot and 24 trialware apps pre-installed.",
        tags: ["Soldered 8GB RAM", "Bloatware Heavy", "Quarantined"],
        status: "blocked_trap",
        trapReason: "8GB soldered memory cannot be upgraded; fails developer 32GB hard requirement.",
        source: "Commercial Retail Store",
        ruleChecks: [
          { rule: "Minimum 32GB RAM", passed: false, note: "Fails: Only 8GB soldered permanently" },
          { rule: "Zero bloatware", passed: false, note: "Contains 24 preloaded trial programs" },
        ],
      },
    ],
    activityLog: [
      {
        id: "t-act-1",
        timestamp: "Yesterday",
        type: "trap_detected",
        message: "Scanned top 10 retail tech review sites: detected paid affiliate placement on obsolete 8GB laptop.",
        impact: "Quarantined retail special; prevented planned obsolescence purchase",
      },
      {
        id: "t-act-2",
        timestamp: "2 days ago",
        type: "compliance",
        message: "Enforced strict 32GB RAM & repairability minimums.",
        impact: "Eliminated 17 laptops with soldered non-upgradeable parts",
      },
      {
        id: "t-act-3",
        timestamp: "3 days ago",
        type: "scan",
        message: "Connected to direct manufacturer modular storefronts.",
        impact: "Verified Framework 13 as top-scoring open hardware pick",
      },
    ],
  },
];

export function createTileFromPrompt(prompt: string): AdvocateTile {
  const p = prompt.toLowerCase();
  const id = `tile-${Date.now()}`;

  // Extract budget number if present (e.g. "$300" or "under 300")
  const priceMatch = prompt.match(/\$?(\d+[\d,]*)/);
  const detectedBudget = priceMatch ? `$${priceMatch[1]}` : "$300";

  // Case 1: Cabin / Vacation / Red River Gorge / Travel Lodging
  if (
    p.includes("cabin") ||
    p.includes("gorge") ||
    p.includes("hotel") ||
    p.includes("resort") ||
    p.includes("vacation") ||
    p.includes("trip") ||
    p.includes("airbnb") ||
    p.includes("vrbo")
  ) {
    const isCabin = p.includes("cabin") || p.includes("gorge");
    const title = prompt.length > 38 ? `${prompt.slice(0, 35)}...` : prompt;

    return {
      id,
      title,
      category: "Travel",
      status: "Active",
      summary: `Dedicated advocate guarding: "${prompt}". Stripping hidden platform cleaning fees, resort markups, and dynamic host surge pricing.`,
      guardrails: [
        `Strict all-in budget ceiling: ${detectedBudget} total`,
        "Enforce upfront total pricing (zero surprise fees at checkout)",
        "Disclose hidden cleaning fees, hot tub fees, and host markups",
        "Verify authentic trail & guest reviews from independent forums",
      ],
      highlightData: {
        primaryMetric: `${detectedBudget} Max`,
        primaryLabel: "Enforced All-In",
        badge: "Fee-Stripped",
        itemImage: isCabin
          ? "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop&q=80",
        actionLabel: "Open Workspace",
      },
      createdTime: "Just now",
      externalBiasesBlocked: [
        "Stripped $185 hidden cleaning fee traps",
        "Blocked platform dynamic cookie surge pricing",
        "Filtered sponsored luxury resort ad placements",
      ],
      searchQuery: `honest ${isCabin ? "cabin rentals Red River Gorge" : "travel deals"} under ${detectedBudget.replace("$", "")} reviews direct booking no hidden fees`,
      candidates: [
        {
          id: `c-1-${id}`,
          name: isCabin ? "Hemlock Hollow Creekside Cabin" : "Pine Valley Mountain Retreat",
          price: "$135/night ($270 weekend total)",
          originalPrice: "$355 on Airbnb",
          savings: "Saved $85 in surprise fees",
          rating: "9.8 / 10 (Authentic Guest Book)",
          summary: "Private secluded woodland cabin minutes from trailheads. Direct booking verified rate. Includes outdoor hot tub, wood-burning stove, and Starlink high-speed internet.",
          tags: ["Direct Booking", "No Hidden Cleaning Fee", "Hot Tub Included", "Pet Friendly"],
          status: "approved",
          source: "Red River Gorge Direct Owners Registry",
          ruleChecks: [
            { rule: `Budget limit under ${detectedBudget}`, passed: true, note: "$270 total is within ceiling" },
            { rule: "Zero surprise fees at checkout", passed: true, note: "Cleaning included in flat rate" },
            { rule: "Authentic non-sponsored reviews", passed: true, note: "Cross-checked on local hiking forum" },
          ],
        },
        {
          id: `c-2-${id}`,
          name: isCabin ? "Natural Bridge Ridgeview Studio" : "Canopy Lookout Studio",
          price: "$142/night ($284 weekend total)",
          originalPrice: "$360 on Vrbo",
          savings: "Saved $76 in platform fees",
          rating: "9.4 / 10 (Direct Rating)",
          summary: "Scenic studio perched over the tree canopy. Verified flat rate with flexible 48-hour free cancellation and no dynamic host surge markup.",
          tags: ["Scenic Deck", "Free Cancellation", "Owner Verified"],
          status: "approved",
          source: "Independent Cabin Cooperative",
          ruleChecks: [
            { rule: `Budget limit under ${detectedBudget}`, passed: true, note: "$284 total complies with ceiling" },
            { rule: "Zero dynamic surge pricing", passed: true, note: "Direct off-peak flat rate locked in" },
          ],
        },
        {
          id: `c-trap-${id}`,
          name: isCabin ? "Summit Ridge 'Luxury' Chalet" : "Sponsored Commercial Chalet",
          price: "$465 True Checkout Total",
          originalPrice: "Advertised: $149/night",
          rating: "3.2 / 10 (Algorithmic Bait)",
          summary: "Platform algorithm advertised this at '$149/night' to capture low-budget filters, but tack on a $185 cleaning fee, $65 hot tub maintenance fee, and 18% booking service fee at final checkout screen.",
          tags: ["Hidden Fee Trap", "Deceptive Anchor Price", "Quarantined"],
          status: "blocked_trap",
          trapReason: "Commercial platform bait-and-switch: $149/night leaps to $465 at payment screen, breaching your budget.",
          source: "Commercial OTA Platform",
          ruleChecks: [
            { rule: `Budget limit under ${detectedBudget}`, passed: false, note: "Breached: $465 total exceeds $300 cap" },
            { rule: "Zero surprise fees", passed: false, note: "Contains $185 cleaning fee and $65 hot tub fee" },
          ],
        },
      ],
      activityLog: [
        {
          id: `act-1-${id}`,
          timestamp: "Just now",
          type: "compliance",
          message: `Activated hard budget rule: Ceiling capped at ${detectedBudget} total for stay.`,
          impact: "Quarantined 14 listings whose total exceeds budget limit",
        },
        {
          id: `act-2-${id}`,
          timestamp: "Just now",
          type: "trap_detected",
          message: "Detected bait-and-switch pricing on commercial vacation aggregators.",
          impact: "Stripped listings with hidden $150+ cleaning fees and resort charges",
        },
        {
          id: `act-3-${id}`,
          timestamp: "Just now",
          type: "scan",
          message: "Queried direct owner associations and non-affiliate regional registries.",
          impact: "Uncovered 2 fee-free direct bookings under budget",
        },
        {
          id: `act-4-${id}`,
          timestamp: "Just now",
          type: "filter",
          message: "Neutralized tracking cookies to prevent artificial surge pricing upon revisit.",
          impact: "Locked in flat baseline rate without dynamic price hikes",
        },
      ],
    };
  }

  // Case 2: Flight / Aviation
  if (p.includes("flight") || p.includes("airline") || p.includes("ticket") || p.includes("fly")) {
    const title = prompt.length > 38 ? `${prompt.slice(0, 35)}...` : prompt;
    return {
      id,
      title,
      category: "Travel",
      status: "Active",
      summary: `Flight advocate screening: "${prompt}". Eliminating deceptive unbundled basic economy fares and hidden baggage traps.`,
      guardrails: [
        `Strict flight ceiling: ${detectedBudget}`,
        "Must include full overhead carry-on luggage",
        "No layovers exceeding 2 hours",
        "Disclose true out-the-door total before seat selection",
      ],
      highlightData: {
        primaryMetric: `${detectedBudget} Cap`,
        primaryLabel: "All-In Pricing",
        badge: "Fee-Stripped",
        itemImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80",
        actionLabel: "Open Workspace",
      },
      createdTime: "Just now",
      externalBiasesBlocked: [
        "Stripped $65 carry-on surcharges",
        "Bypassed cookie-triggered fare increases",
      ],
      searchQuery: `flights deals carry on included ${prompt}`,
      candidates: [
        {
          id: `fl-1-${id}`,
          name: "Direct Route Standard Economy",
          price: "$218 Verified Total",
          originalPrice: "$285 with unbundled baggage",
          savings: "Saved $67",
          rating: "9.3 / 10 Direct",
          summary: "Includes full overhead luggage, advance seat selection, and complimentary ticket changes.",
          tags: ["Direct Route", "Luggage Included", "No Surprises"],
          status: "approved",
          source: "Direct Airline API",
          ruleChecks: [
            { rule: "Budget ceiling", passed: true, note: "$218 is under limit" },
            { rule: "Luggage included", passed: true, note: "Full carry-on confirmed" },
          ],
        },
        {
          id: `fl-trap-${id}`,
          name: "Unbundled Budget Airline Bait",
          price: "$310 True Checkout Total",
          originalPrice: "Advertised: $79 Base",
          rating: "2.8 / 10 Hidden Fee Trap",
          summary: "Advertised as $79 to top flight search engines, but requires $85 carry-on + $50 seat selection + $40 check-in fee.",
          tags: ["Unbundled Trap", "Quarantined"],
          status: "blocked_trap",
          trapReason: "Advertised rate excludes required carry-on luggage and personal item.",
          source: "Commercial Flight Aggregator",
          ruleChecks: [
            { rule: "Under budget", passed: false, note: "$310 exceeds cap" },
            { rule: "Carry-on included", passed: false, note: "$85 surcharge for luggage" },
          ],
        },
      ],
      activityLog: [
        {
          id: `act-fl-1-${id}`,
          timestamp: "Just now",
          type: "compliance",
          message: "Enforced overhead luggage requirement on all flight candidates.",
          impact: "Filtered out 8 unbundled Basic Economy bait listings",
        },
        {
          id: `act-fl-2-${id}`,
          timestamp: "Just now",
          type: "scan",
          message: "Retrieved non-stop direct route inventory directly from airline APIs.",
          impact: "Locked in clean $218 fare",
        },
      ],
    };
  }

  // Case 3: Apartment / Housing
  if (p.includes("apartment") || p.includes("rent") || p.includes("housing") || p.includes("sublet")) {
    const title = prompt.length > 38 ? `${prompt.slice(0, 35)}...` : prompt;
    return {
      id,
      title,
      category: "Housing",
      status: "Active",
      summary: `Housing advocate screening: "${prompt}". Rejecting broker fees, junk amenity charges, and misleading rent concessions.`,
      guardrails: [
        `Maximum rent: ${detectedBudget}/month`,
        "Strict prohibition: Zero broker commissions",
        "Disclose mandatory amenity and trash fees upfront",
        "Verify in-unit laundry & parking terms",
      ],
      highlightData: {
        primaryMetric: `${detectedBudget}/mo`,
        primaryLabel: "Verified No-Fee",
        badge: "Direct Landlord",
        itemImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80",
        actionLabel: "Open Workspace",
      },
      createdTime: "Just now",
      externalBiasesBlocked: [
        "Filtered $2,400 broker fee traps",
        "Disclosed $195/mo mandatory amenity fees",
      ],
      searchQuery: `apartment rental listings direct landlord no broker fee ${prompt}`,
      candidates: [
        {
          id: `ap-1-${id}`,
          name: "Direct Landlord Loft Lease",
          price: "$1,450 / mo",
          originalPrice: "$1,650 with broker",
          savings: "Zero Broker Commission ($2,175 saved)",
          rating: "9.5 / 10 Verified",
          summary: "Verified direct owner listing. Hardwood floors, in-unit laundry, and water/trash included in flat rate.",
          tags: ["Direct Owner", "In-Unit W/D", "No Junk Fees"],
          status: "approved",
          source: "Direct Property Registry",
          ruleChecks: [
            { rule: "Under monthly cap", passed: true, note: "$1,450 complies with limit" },
            { rule: "Zero broker fee", passed: true, note: "Owner lease verified" },
          ],
        },
        {
          id: `ap-trap-${id}`,
          name: "Commercial Brokerage 'Special'",
          price: "$1,890 / mo Effective",
          originalPrice: "Advertised: $1,299 / mo",
          rating: "2.5 / 10 Commercial Trap",
          summary: "Advertised as $1,299 net effective on a 14-month lease, but requires 15% broker fee ($2,338) and $220/mo mandatory fees.",
          tags: ["Broker Markup", "Net Effective Scam", "Quarantined"],
          status: "blocked_trap",
          trapReason: "Misleading 'net effective' rent mask; actual out-of-pocket cost breaches budget limit.",
          source: "Commercial Broker Portal",
          ruleChecks: [
            { rule: "Under budget limit", passed: false, note: "Effective cost $1,890 exceeds cap" },
            { rule: "Zero broker fee", passed: false, note: "Requires $2,338 broker commission" },
          ],
        },
      ],
      activityLog: [
        {
          id: `act-ap-1-${id}`,
          timestamp: "Just now",
          type: "trap_detected",
          message: "Detected misleading 'net effective rent' bait calculation.",
          impact: "Exposed true out-of-pocket monthly lease cost",
        },
        {
          id: `act-ap-2-${id}`,
          timestamp: "Just now",
          type: "scan",
          message: "Cross-referenced verified tenant property listings.",
          impact: "Surfaced 1 compliant direct-owner property",
        },
      ],
    };
  }

  // Case 4: General / Custom prompt
  const title = prompt.length > 38 ? `${prompt.slice(0, 35)}...` : prompt;
  return {
    id,
    title,
    category: "Custom",
    status: "Active",
    summary: `Custom agent advocate spun up for: "${prompt}". Enforcing your personal rules and stripping commercial advertising bias.`,
    guardrails: [
      `User ceiling / constraint: ${detectedBudget}`,
      "Sovereign ranking (zero sponsored platform steering)",
      "Strict data privacy & zero background ad tracking",
      "Explicit human-in-the-loop approval before any action",
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
      "Neutralized sponsored search steering",
    ],
    searchQuery: `honest objective reviews comparisons ${prompt} 2026`,
    candidates: [
      {
        id: `gen-1-${id}`,
        name: `Verified Objective Pick for: ${title}`,
        price: `${detectedBudget} Verified Value`,
        originalPrice: "Market average + 25%",
        savings: "Stripped affiliate markup",
        rating: "9.7 / 10 Objective",
        summary: `Top compliant candidate matching your goal "${prompt}". Vetted against your non-negotiables with zero commercial ad bias.`,
        tags: ["Objective Pick", "No Sponsor Bias", "Verified Value"],
        status: "approved",
        source: "Independent Consensus Engine",
        ruleChecks: [
          { rule: "User objective alignment", passed: true, note: "Full constraint compliance" },
          { rule: "Zero platform steering", passed: true, note: "Ranked purely on merit" },
        ],
      },
      {
        id: `gen-trap-${id}`,
        name: `Sponsored Platform Recommendation`,
        price: "Inflated Commercial Rate",
        originalPrice: "Promoted Placement",
        rating: "3.0 / 10 Commercial Bias",
        summary: `The option that commercial algorithms would push to your screen based on paid vendor bidding rather than user value.`,
        tags: ["Sponsored Steering", "Commercial Trap", "Quarantined"],
        status: "blocked_trap",
        trapReason: "Pushed by commercial search engine due to highest advertiser bidding margin, not user value.",
        source: "Commercial Ad Network",
        ruleChecks: [
          { rule: "Merit-based ranking", passed: false, note: "Failed: Paid vendor placement" },
        ],
      },
    ],
    activityLog: [
      {
        id: `act-gen-1-${id}`,
        timestamp: "Just now",
        type: "compliance",
        message: `Ingested task objective: "${prompt}". Formulated sovereign verification parameters.`,
        impact: "Enforcing user-first non-negotiables",
      },
      {
        id: `act-gen-2-${id}`,
        timestamp: "Just now",
        type: "trap_detected",
        message: "Scanned commercial search results: detected 4 paid sponsored placements.",
        impact: "Quarantined sponsored ads from recommendation feed",
      },
      {
        id: `act-gen-3-${id}`,
        timestamp: "Just now",
        type: "scan",
        message: "Retrieved honest user reviews and lab evaluations from independent sources.",
        impact: "Ranked top objective pick",
      },
    ],
  };
}
