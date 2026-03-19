/**
 * NuVista Chatbot Service
 * A realtor-domain AI service that handles text + multimodal inputs.
 * Produces rich responses with quick-reply suggestions and metadata cards.
 */

import type { ChatMessage, ChatAttachment, ChatOption, ChatPropertyListing } from '../store/chatbotStore';
import { MOCK_PUBLIC_PROPERTIES } from '../hooks/useProperties';

const uuid = () =>
  `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

type BotResponse = Pick<
  ChatMessage,
  'content' | 'quickReplies' | 'options' | 'listings' | 'metadata'
>;

/* ─────────────────────── Property search engine ─────────────────────── */

function toListingCard(p: (typeof MOCK_PUBLIC_PROPERTIES)[0]): ChatPropertyListing {
  return {
    _id: p._id,
    title: p.title,
    price: p.price,
    status: p.status,
    propertyType: p.propertyType,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    squareFeet: p.squareFeet,
    address: { street: p.address.street, city: p.address.city, province: p.address.province },
    neighbourhood: p.neighbourhood,
    images: p.images,
    daysOnMarket: p.daysOnMarket ?? 0,
    slug: p.slug,
  };
}

interface SearchFilters {
  status?: string[];
  type?: string[];
  city?: string;
  minBeds?: number;
  maxPrice?: number;
  minPrice?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'days_asc';
}

function searchProperties(filters: SearchFilters): ChatPropertyListing[] {
  let results = [...MOCK_PUBLIC_PROPERTIES];

  if (filters.status?.length)
    results = results.filter((p) => filters.status!.includes(p.status));
  if (filters.type?.length)
    results = results.filter((p) => filters.type!.includes(p.propertyType));
  if (filters.city)
    results = results.filter((p) =>
      p.address.city.toLowerCase().includes(filters.city!.toLowerCase()) ||
      (p.neighbourhood ?? '').toLowerCase().includes(filters.city!.toLowerCase())
    );
  if (filters.minBeds)
    results = results.filter((p) => p.bedrooms >= filters.minBeds!);
  if (filters.maxPrice)
    results = results.filter((p) => p.price <= filters.maxPrice!);
  if (filters.minPrice)
    results = results.filter((p) => p.price >= filters.minPrice!);

  // Sort
  switch (filters.sortBy ?? 'newest') {
    case 'newest':
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'price_asc':
      results.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      results.sort((a, b) => b.price - a.price);
      break;
    case 'days_asc':
      results.sort((a, b) => (a.daysOnMarket ?? 0) - (b.daysOnMarket ?? 0));
      break;
  }

  return results.map(toListingCard);
}

/** Parse free-text query into filters */
function parseListingQuery(input: string): { filters: SearchFilters; label: string } {
  const t = input.toLowerCase();
  const filters: SearchFilters = {};
  const labels: string[] = [];

  // Status
  if (/\bnew\b|just listed|latest|recent/.test(t)) { filters.status = ['active']; labels.push('newest listings'); }
  else if (/active|available|for sale/.test(t)) { filters.status = ['active']; labels.push('active'); }
  else if (/sold|recently sold/.test(t)) { filters.status = ['sold']; labels.push('sold'); }
  else if (/pending/.test(t)) { filters.status = ['pending']; labels.push('pending'); }
  else if (/coming soon/.test(t)) { filters.status = ['coming_soon']; labels.push('coming soon'); }

  // Property types
  if (/condo|apartment/.test(t)) { filters.type = ['condo']; labels.push('condos'); }
  else if (/detach/.test(t)) { filters.type = ['detached']; labels.push('detached'); }
  else if (/semi/.test(t)) { filters.type = ['semi-detached']; labels.push('semi-detached'); }
  else if (/townhouse|town house/.test(t)) { filters.type = ['townhouse']; labels.push('townhouses'); }
  else if (/bungalow/.test(t)) { filters.type = ['bungalow']; labels.push('bungalows'); }

  // Cities / neighbourhoods
  const cityMatch = t.match(/\b(toronto|mississauga|oakville|burlington|markham|brampton|vaughan|richmond hill)\b/);
  if (cityMatch) { filters.city = cityMatch[1]; labels.push(`in ${cityMatch[1]}`); }

  // Bedrooms
  const bedMatch = t.match(/(\d)\s*(?:bed|bedroom|br)\b/);
  if (bedMatch) { filters.minBeds = parseInt(bedMatch[1]); labels.push(`${bedMatch[1]}+ beds`); }

  // Price
  const underMatch = t.match(/under\s*\$?([\d,.]+)\s*[km]?/i);
  if (underMatch) {
    let n = parseFloat(underMatch[1].replace(/,/g, ''));
    if (/[km]$/i.test(underMatch[0])) n *= /k/i.test(underMatch[0]) ? 1000 : 1_000_000;
    if (n < 10_000) n *= 1000; // "under 1m" → 1,000,000 if small number
    filters.maxPrice = n;
    labels.push(`under $${(n / 1000).toFixed(0)}K`);
  }
  const overMatch = t.match(/over\s*\$?([\d,.]+)\s*[km]?/i);
  if (overMatch) {
    let n = parseFloat(overMatch[1].replace(/,/g, ''));
    if (/[km]$/i.test(overMatch[0])) n *= /k/i.test(overMatch[0]) ? 1000 : 1_000_000;
    if (n < 10_000) n *= 1000;
    filters.minPrice = n;
    labels.push(`over $${(n / 1000).toFixed(0)}K`);
  }

  // Sorting
  if (/cheapest|lowest price|price.*low/.test(t)) filters.sortBy = 'price_asc';
  else if (/expensive|highest price|price.*high/.test(t)) filters.sortBy = 'price_desc';
  else if (/newest|latest|recent|just listed/.test(t)) filters.sortBy = 'newest';

  return {
    filters,
    label: labels.length ? labels.join(', ') : 'all listings',
  };
}

/* Shared "back to main menu" option list */
const MAIN_MENU_OPTIONS: ChatOption[] = [
  { icon: '📊', label: 'Market Statistics',    value: 'Show market stats',        description: 'GTA prices & trends' },
  { icon: '🏡', label: 'Property Listings',     value: 'Tell me about properties', description: 'Types & management' },
  { icon: '👥', label: 'Lead Management',       value: 'Tell me about leads',      description: 'Pipeline & scoring' },
  { icon: '💰', label: 'Pricing & Valuation',   value: 'Property pricing tips',    description: 'CMA & best practices' },
  { icon: '🗺️', label: 'Neighbourhoods',        value: 'Best neighbourhoods',      description: 'GTA area guide' },
  { icon: '🏦', label: 'Mortgage Info',         value: 'Mortgage info',            description: 'Rates & down payments' },
  { icon: '🏷️', label: 'Selling Tips',          value: 'Selling tips',             description: 'Get top dollar' },
  { icon: '🔑', label: 'Buying Guide',          value: 'Buying guide',             description: 'Offers & negotiations' },
];

/* ─────────────────────────── Knowledge Base ──────────────────────────── */

const MARKET_STATS = {
  avgPrice: '$1,285,000',
  activeListings: 248,
  soldThisMonth: 62,
  avgDaysOnMarket: 18,
  listToSaleRatio: '97.4%',
  hotNeighbourhoods: ['Rosedale', 'Forest Hill', 'The Annex', 'Leslieville'],
};


const LEAD_STAGES = [
  'New → Contacted → Qualified → Showing → Offer → Closed',
];

/* ──────────────────────── Property listing intent ───────────────────── */

function propertyListingResponse(input: string): BotResponse {
  const { filters, label } = parseListingQuery(input);
  const listings = searchProperties(filters);

  if (listings.length === 0) {
    return {
      content: `No listings matched **${label}**. Try broadening your search:`,
      options: [
        { icon: '🏠', label: 'All Active Listings',  value: 'show all active listings',  description: 'Everything currently for sale' },
        { icon: '💰', label: 'Under $1M',            value: 'houses under 1 million',    description: 'Budget-friendly options' },
        { icon: '🔙', label: 'Back to Main Menu',    value: 'help menu',                 description: 'See all topics' },
      ],
    };
  }

  return {
    content: `Found **${listings.length} listing${listings.length > 1 ? 's' : ''}** for **${label}**, sorted by newest first:`,
    listings,
    options: [
      { icon: '💰', label: 'Sort by Lowest Price',  value: 'show listings cheapest first',  description: 'Most affordable first' },
      { icon: '📅', label: 'Sort by Newest',        value: 'show newest listings',           description: 'Recently listed first' },
      { icon: '🏙️', label: 'Filter by City',        value: 'show listings in toronto',       description: 'Narrow by location' },
      { icon: '🔙', label: 'Back to Main Menu',     value: 'help menu',                      description: 'See all topics' },
    ],
  };
}

/* ─────────────────────────── Intent Patterns ─────────────────────────── */

interface IntentRule {
  patterns: RegExp[];
  handler: (input: string, attachments?: ChatAttachment[]) => BotResponse;
}

const intentRules: IntentRule[] = [
  /* ── Property listing search (must be before generic property intent) ── */
  {
    patterns: [
      /show\s*(me\s*)?(all\s*)?(new|latest|recent|active|sold|pending|coming\s*soon)?\s*(listings?|houses?|homes?|properties|condos?|townhouses?|detach\w*|bungalow\w*)/i,
      /list\s*(all\s*)?(new|active|sold)?\s*(listings?|houses?|homes?|properties|condos?)/i,
      /give\s*me\s*(a\s*)?(list\s*of\s*)?(all\s*)?(new|latest|active|available)?\s*(listings?|houses?|homes?|properties|condos?)/i,
      /find\s*(me\s*)?(a\s*)?(house|home|condo|property|listing)/i,
      /(what|which)\s*(houses?|homes?|properties|listings?|condos?)\s*(are|do you have|available|for sale)/i,
      /(houses?|homes?|condos?|listings?)\s*(under|over|below|above)\s*\$?[\d,.]+/i,
      /\d\s*(bed|bedroom|br)\s*(houses?|condos?|homes?|listings?|townhouses?)/i,
      /(available|active)\s*(properties|listings?|homes?|houses?)/i,
    ],
    handler: (input) => propertyListingResponse(input),
  },

  /* ── Greetings ── */
  {
    patterns: [/^(hi|hey|hello|howdy|good\s*(morning|afternoon|evening))/i],
    handler: () => ({
      content: "Hello! Great to see you. I'm **Nova**, your NuVista real estate assistant. What would you like to explore?",
      options: MAIN_MENU_OPTIONS,
    }),
  },

  /* ── Market Stats ── */
  {
    patterns: [/market|stats|statistic|overview|trend|data|report/i],
    handler: () => ({
      content: `Here's the current **GTA Market Snapshot** 📊\n\n| Metric | Value |\n|---|---|\n| Avg. List Price | **${MARKET_STATS.avgPrice}** |\n| Active Listings | **${MARKET_STATS.activeListings}** |\n| Sold This Month | **${MARKET_STATS.soldThisMonth}** |\n| Avg. Days on Market | **${MARKET_STATS.avgDaysOnMarket} days** |\n| List-to-Sale Ratio | **${MARKET_STATS.listToSaleRatio}** |\n\n🔥 **Hot neighbourhoods:** ${MARKET_STATS.hotNeighbourhoods.join(', ')}\n\nWhat would you like to explore next?`,
      options: [
        { icon: '🗺️', label: 'Neighbourhood Prices',   value: 'Best neighbourhoods',      description: 'Deep dive by area' },
        { icon: '📈', label: 'Buyer Demand Trends',    value: 'buyer demand trends',       description: 'Who\'s buying & why' },
        { icon: '📦', label: 'Inventory Levels',       value: 'inventory levels',          description: 'Supply vs demand' },
        { icon: '🔙', label: 'Back to Main Menu',      value: 'help menu',                 description: 'See all topics' },
      ],
      metadata: { type: 'stat_card', data: MARKET_STATS },
    }),
  },

  /* ── Property Pricing ── */
  {
    patterns: [/pric(e|ing)|valuat|apprais|worth|value|cma|comparable/i],
    handler: () => ({
      content:
        "**Property Pricing Strategy** 💰\n\nKey factors affecting price:\n- **Location & Neighbourhood** – accounts for ~40% of value\n- **Property condition & updates** – kitchens/baths drive ROI\n- **Comparable sales (CMA)** – analyse last 90 days in area\n- **Days on Market** – overpriced listings sit; properly priced sell in 7–21 days\n- **Seasonal demand** – Spring (Mar–May) & Fall (Sep–Nov) peak periods\n\n💡 **Pro tip:** Price within 2–3% of CMA for best list-to-sale ratio.",
      options: [
        { icon: '📋', label: 'Run a CMA Analysis',       value: 'Run CMA analysis',         description: 'Comparable sales walkthrough' },
        { icon: '🛋️', label: 'Staging to Boost Value',   value: 'staging tips',             description: 'ROI improvements before listing' },
        { icon: '⚔️', label: 'Pricing for Bidding War',  value: 'pricing for bidding war',  description: 'Strategic under-pricing approach' },
        { icon: '🔙', label: 'Back to Main Menu',        value: 'help menu',                description: 'See all topics' },
      ],
    }),
  },

  /* ── Leads / CRM ── */
  {
    patterns: [/lead|crm|client|contact|prospect|pipeline|follow.?up/i],
    handler: () => ({
      content:
        "**Lead Management** 👥\n\nYour pipeline stages:\n`" + LEAD_STAGES[0] + '`\n\n📊 Leads with score **70+** are ready for showing — act fast!\n\nWhat would you like to do?',
      options: [
        { icon: '➕', label: 'Add a New Lead',          value: 'add new lead',           description: 'Create a contact from scratch' },
        { icon: '📊', label: 'Leads by Status',         value: 'leads by status',        description: 'View pipeline breakdown' },
        { icon: '⭐', label: 'Top Scoring Leads',       value: 'top scoring leads',      description: 'Highest priority contacts' },
        { icon: '💡', label: 'Lead Conversion Tips',    value: 'lead conversion tips',   description: 'How to close more deals' },
        { icon: '🔙', label: 'Back to Main Menu',       value: 'help menu',              description: 'See all topics' },
      ],
    }),
  },

  /* ── Add Lead ── */
  {
    patterns: [/add.*(lead|client|contact)|new.*(lead|client)|create.*lead/i],
    handler: () => ({
      content:
        "To **add a new lead**, go to **Leads** in the sidebar and click **+ New Lead**.\n\nYou'll need:\n- First & last name, email / phone\n- Source (website, referral, open house…)\n- Budget range & preferred property types\n- Assigned agent\n\n📋 The system auto-calculates a lead score once the profile is complete.",
      options: [
        { icon: '👥', label: 'Go to Leads Page',       value: 'navigate to leads',      description: 'Open the CRM' },
        { icon: '🎯', label: 'Lead Scoring Info',       value: 'lead scoring info',      description: 'How scores are calculated' },
        { icon: '📥', label: 'Import Leads via CSV',    value: 'import leads CSV',       description: 'Bulk upload contacts' },
        { icon: '🔙', label: 'Back to Main Menu',       value: 'help menu',              description: 'See all topics' },
      ],
    }),
  },

  /* ── Properties / Listings ── */
  {
    patterns: [/propert(y|ies)|listing|mls|home|house|condo|townhouse|detach/i],
    handler: () => ({
      content: "**Property Management** 🏡\n\nWhat type of property are you looking for? I'll pull up matching listings for you.",
      options: [
        { icon: '🏠', label: 'Detached House',        value: 'show me detached houses',         description: 'Single-family, full lot' },
        { icon: '🏘️', label: 'Semi-Detached',         value: 'show semi-detached listings',     description: 'Shared wall, lower price' },
        { icon: '🏚️', label: 'Townhouse',             value: 'show townhouse listings',         description: 'Multi-storey, low maintenance' },
        { icon: '🏢', label: 'Condo / Apartment',     value: 'show condo listings',             description: 'Building amenities, condo fees' },
        { icon: '👑', label: 'Penthouse / Luxury',    value: 'show listings over 2 million',    description: 'Premium listings & pricing' },
        { icon: '🏡', label: 'All Active Listings',   value: 'show all active listings',        description: 'Everything currently for sale' },
        { icon: '🏷️', label: 'Recently Sold',         value: 'show sold listings',              description: 'See what\'s closed recently' },
        { icon: '🔙', label: 'Back to Main Menu',     value: 'help menu',                       description: 'See all topics' },
      ],
    }),
  },

  /* ── Image / Photo attachment ── */
  {
    patterns: [/photo|image|picture|visual|upload.*image/i],
    handler: (_input, attachments) => {
      if (attachments?.some((a) => a.type === 'image')) {
        return {
          content: "I can see the property photo you've shared! 📸\n\nWhat would you like help with?",
          options: [
            { icon: '🛋️', label: 'Staging Advice',         value: 'staging tips',           description: 'Improve presentation' },
            { icon: '📸', label: 'Photography Tips',       value: 'photography guide',      description: 'Angles, lighting, MLS rules' },
            { icon: '🖥️', label: 'Virtual Staging Tools',  value: 'virtual staging tools',  description: 'AI-powered room renders' },
            { icon: '🔙', label: 'Back to Main Menu',      value: 'help menu',              description: 'See all topics' },
          ],
        };
      }
      return {
        content: "You can **attach property photos or documents** using the 📎 button below.\n\nWhat type of file would you like to share?",
        options: [
          { icon: '🖼️', label: 'Property Photos',         value: 'photo tips',             description: 'JPG, PNG, WEBP, HEIC' },
          { icon: '📄', label: 'Real Estate Documents',   value: 'document help',          description: 'PDF, DOCX, XLSX' },
          { icon: '🔙', label: 'Back to Main Menu',       value: 'help menu',              description: 'See all topics' },
        ],
      };
    },
  },

  /* ── Document attachment ── */
  {
    patterns: [/document|pdf|docx|contract|agreement|form/i],
    handler: (_input, attachments) => {
      if (attachments?.some((a) => a.type === 'document' || a.type === 'pdf')) {
        return {
          content: "I've received your document. 📄\n\nWhat would you like to know?",
          options: [
            { icon: '📝', label: 'Explain Key Clauses',   value: 'explain key clauses',    description: 'Plain-English breakdown' },
            { icon: '⚠️', label: 'Common Conditions',     value: 'common conditions',      description: 'Financing, inspection, title' },
            { icon: '🤝', label: 'Offer Strategy',        value: 'offer strategy',         description: 'How to negotiate effectively' },
            { icon: '🔙', label: 'Back to Main Menu',     value: 'help menu',              description: 'See all topics' },
          ],
        };
      }
      return {
        content: "Use the 📎 attach button to upload real estate documents. Which type can I help with?",
        options: [
          { icon: '🤝', label: 'Purchase Agreement (APS)', value: 'APS walkthrough',        description: 'Agreement of Purchase & Sale' },
          { icon: '📋', label: 'Listing Agreement',        value: 'listing agreement info', description: 'MLS authority form' },
          { icon: '👤', label: 'Buyer Rep Agreement',      value: 'buyer rep agreement',    description: 'BRA explained' },
          { icon: '📢', label: 'Disclosure Forms',         value: 'disclosure forms',       description: 'SPIS, environmental' },
          { icon: '🔙', label: 'Back to Main Menu',        value: 'help menu',              description: 'See all topics' },
        ],
      };
    },
  },

  /* ── Neighbourhood / Location ── */
  {
    patterns: [/neighbourhood|neighborhood|location|area|district|community|toronto|mississauga|oakville|markham|burlington/i],
    handler: () => ({
      content: "**Top GTA Neighbourhoods** 🗺️\n\n| Neighbourhood | Avg. Price | Type | Hot? |\n|---|---|---|---|\n| Rosedale | $3.2M | Detached | 🔥 |\n| Forest Hill | $2.8M | Detached | 🔥 |\n| The Annex | $1.9M | Semi/Condo | ✅ |\n| Leslieville | $1.2M | Semi/Town | ✅ |\n| Mississauga City Centre | $850K | Condo | 📈 |\n| Oakville | $1.6M | Detached | ✅ |\n| Markham | $1.3M | Detached | 📈 |\n\nWhich area interests you?",
      options: [
        { icon: '🔥', label: 'Rosedale / Forest Hill',   value: 'Rosedale details',       description: 'Luxury detached market' },
        { icon: '🏙️', label: 'Downtown Toronto',         value: 'downtown toronto info',  description: 'Condos & walkability' },
        { icon: '🌳', label: 'Oakville / Burlington',    value: 'oakville info',          description: 'Family suburbs, top schools' },
        { icon: '🚇', label: 'Transit-Friendly Areas',   value: 'transit scores',         description: 'Best TTC & GO access' },
        { icon: '🏫', label: 'Top School Districts',     value: 'school districts',       description: 'Great for families' },
        { icon: '🔙', label: 'Back to Main Menu',        value: 'help menu',              description: 'See all topics' },
      ],
    }),
  },

  /* ── Mortgage / Financing ── */
  {
    patterns: [/mortgage|financ|loan|down.*payment|rate|interest|lender|pre.?approv/i],
    handler: () => ({
      content:
        "**Mortgage & Financing** 🏦\n\n**Current rates (2024):**\n- Variable: ~6.2% – 6.7%\n- Fixed 5yr: ~5.5% – 6.0%\n- Stress test: contract rate + 2%\n\n**Down payment minimums:**\n- Under $500K → 5%\n- $500K–$999K → 5% on first $500K + 10% on balance\n- $1M+ → 20% (no CMHC)\n\nWhat would you like to explore?",
      options: [
        { icon: '🧮', label: 'Mortgage Calculator',        value: 'calculate mortgage payment',  description: 'Estimate monthly payments' },
        { icon: '✅', label: 'Pre-Approval Tips',          value: 'pre-approval tips',            description: 'How to qualify faster' },
        { icon: '🎁', label: 'First-Time Buyer Programs',  value: 'first time buyer incentives',  description: 'FHSA, RRSP, rebates' },
        { icon: '🔙', label: 'Back to Main Menu',          value: 'help menu',                    description: 'See all topics' },
      ],
    }),
  },

  /* ── Seller Tips ── */
  {
    patterns: [/sell(er|ing)|list.*home|put.*market|selling.*tips|prepare.*sale/i],
    handler: () => ({
      content:
        "**Seller Success Checklist** 🏷️\n\n1. 🧹 Deep clean + declutter\n2. 🎨 Neutral paint touch-ups\n3. 💡 Bright lighting throughout\n4. 🌿 Fresh curb appeal\n5. 📸 Professional photography\n6. 🏡 Virtual tour / 3D walkthrough\n\n**Timing:** Spring listings get 15–22% more offers. What do you need help with?",
      options: [
        { icon: '🛋️', label: 'Staging Guide',           value: 'staging guide',          description: 'Room-by-room checklist' },
        { icon: '🚪', label: 'Open House Tips',         value: 'open house tips',        description: 'Maximise foot traffic' },
        { icon: '⚔️', label: 'Offer Strategy',         value: 'offer strategy',         description: 'Hold-back dates & bidding' },
        { icon: '📸', label: 'Property Photography',   value: 'photography guide',      description: 'MLS photo best practices' },
        { icon: '🔙', label: 'Back to Main Menu',      value: 'help menu',              description: 'See all topics' },
      ],
    }),
  },

  /* ── Buyer Tips ── */
  {
    patterns: [/buyer|buy(ing)?|purchase|bid|first.*home|looking.*home/i],
    handler: () => ({
      content:
        "**Buyer's Guide** 🔑\n\n1. 💰 Get pre-approved first\n2. 🗺️ Define must-haves vs nice-to-haves\n3. 🏡 Book showings within 24–48h of new listings\n4. 📋 Prepare offer with conditions\n5. 🤝 Negotiate — always leave room\n6. ✅ Remove conditions once satisfied\n7. 🎉 Close with your lawyer\n\nWhat stage are you at?",
      options: [
        { icon: '📝', label: 'Making an Offer',           value: 'making an offer',        description: 'How to write a strong offer' },
        { icon: '🔍', label: 'Home Inspection Tips',      value: 'inspection tips',        description: 'What to look for' },
        { icon: '💸', label: 'Closing Costs Breakdown',   value: 'closing costs',          description: 'Land transfer tax, legal fees' },
        { icon: '🏦', label: 'Mortgage Info',             value: 'mortgage info',          description: 'Rates & pre-approval' },
        { icon: '🔙', label: 'Back to Main Menu',         value: 'help menu',              description: 'See all topics' },
      ],
    }),
  },

  /* ── Dashboard / Navigation ── */
  {
    patterns: [/dashboard|navigate|where|how.*find|go.*to|analytics/i],
    handler: () => ({
      content: "**NuVista CRM Navigation** 🧭\n\nWhere would you like to go?",
      options: [
        { icon: '📊', label: 'Dashboard Overview',     value: 'Show market stats',       description: 'KPIs, charts, recent activity' },
        { icon: '🏡', label: 'Properties Section',     value: 'Tell me about properties', description: 'Manage all listings' },
        { icon: '👥', label: 'Leads / CRM',            value: 'Tell me about leads',     description: 'Pipeline & contact management' },
        { icon: '🔙', label: 'Back to Main Menu',      value: 'help menu',               description: 'See all topics' },
      ],
    }),
  },

  /* ── Open House ── */
  {
    patterns: [/open.?house|showing|tour|visit|viewing/i],
    handler: () => ({
      content:
        "**Open House & Showings** 🚪\n\n- Schedule **Sat/Sun 2–4pm** for max foot traffic\n- Collect contact info from every visitor → instant leads!\n- Prepare info sheets with QR code to listing\n- Light candles / bake cookies — scent sells\n- Zoom tours for out-of-town buyers\n\nWhat would you like to know more about?",
      options: [
        { icon: '📅', label: 'Schedule an Open House',  value: 'schedule open house',    description: 'Best dates & times' },
        { icon: '📋', label: 'Open House Checklist',    value: 'open house checklist',   description: 'Full prep list' },
        { icon: '🎯', label: 'Lead Capture Tips',       value: 'lead capture tips',      description: 'Convert visitors to clients' },
        { icon: '🔙', label: 'Back to Main Menu',       value: 'help menu',              description: 'See all topics' },
      ],
    }),
  },

  /* ── Commission / Fees ── */
  {
    patterns: [/commission|fee|cost|realtor.*fee|agent.*pay|percent|brokerage/i],
    handler: () => ({
      content:
        "**Real Estate Commissions (Ontario)** 💼\n\nFully negotiable in Canada.\n\n| Role | Typical Rate |\n|---|---|\n| Listing Agent | ~2% – 2.5% |\n| Buyer's Agent | ~2% – 2.5% |\n| **Total** | **4% – 5%** |\n\nOn a **$1.2M home** at 5% = **$60,000** (split between agents).\n\nWhat else would you like to know?",
      options: [
        { icon: '🤝', label: 'Negotiating Commission',  value: 'negotiating commission',  description: 'When and how to negotiate' },
        { icon: '📦', label: "What's Included",         value: 'what is included in commission', description: 'Marketing, MLS, photography' },
        { icon: '⚖️', label: 'Dual Agency Rules',       value: 'dual agency rules',       description: 'Ontario regulations' },
        { icon: '🔙', label: 'Back to Main Menu',       value: 'help menu',               description: 'See all topics' },
      ],
    }),
  },

  /* ── Help / Menu ── */
  {
    patterns: [/help|menu|option|what.*can.*you|capabilities|support|assist|back.*menu|main menu/i],
    handler: () => ({
      content: "I'm **Nova**, your NuVista real estate AI. What can I help you with?",
      options: MAIN_MENU_OPTIONS,
    }),
  },

  /* ── Thank you ── */
  {
    patterns: [/thank(s| you)|thx|appreciate|great|awesome|perfect|helpful|nothing/i],
    handler: () => ({
      content: "You're welcome! Here whenever you need real estate guidance. 😊\n\nAnything else I can help with?",
      options: MAIN_MENU_OPTIONS,
    }),
  },
];

/* ─────────────────────── Attachment-aware handler ───────────────────── */

function handleAttachmentOnly(attachments: ChatAttachment[]): BotResponse {
  const hasImages = attachments.some((a) => a.type === 'image');
  const hasDocs = attachments.some((a) => a.type !== 'image');

  if (hasImages && hasDocs) {
    return {
      content: "I've received your **photos and documents**! 📎\n\nWhich would you like me to focus on?",
      options: [
        { icon: '📸', label: 'Advise on the Photos',     value: 'photo tips',          description: 'Staging, angles, MLS rules' },
        { icon: '📄', label: 'Explain the Documents',    value: 'document help',       description: 'Contracts, clauses, offers' },
        { icon: '🔙', label: 'Back to Main Menu',        value: 'help menu',           description: 'See all topics' },
      ],
    };
  }
  if (hasImages) {
    return {
      content: `I've received **${attachments.length} photo${attachments.length > 1 ? 's' : ''}**! 📸\n\nWhat would you like help with?`,
      options: [
        { icon: '🛋️', label: 'Staging Advice',          value: 'staging tips',        description: 'Improve presentation' },
        { icon: '📸', label: 'Photography Guide',        value: 'photography guide',   description: 'Angles, lighting, MLS rules' },
        { icon: '🖥️', label: 'Virtual Staging',         value: 'virtual staging',     description: 'AI-rendered room views' },
        { icon: '🔙', label: 'Back to Main Menu',        value: 'help menu',           description: 'See all topics' },
      ],
    };
  }
  return {
    content: `I've received **${attachments[0].name}**. 📄\n\nWhat would you like to know about this document?`,
    options: [
      { icon: '📝', label: 'Explain Key Clauses',    value: 'explain key clauses',  description: 'Plain-English breakdown' },
      { icon: '⚠️', label: 'Common Conditions',      value: 'common conditions',    description: 'Financing, inspection, title' },
      { icon: '🤝', label: 'Offer Strategy',         value: 'offer strategy',       description: 'Negotiate effectively' },
      { icon: '🔙', label: 'Back to Main Menu',      value: 'help menu',            description: 'See all topics' },
    ],
  };
}

/* ─────────────────────── Dynamic keyword extractor ─────────────────── */

/**
 * Generates a contextual option list by scanning the user's free-text
 * for real estate keywords and surfacing the most relevant sub-topics.
 */
function dynamicOptions(input: string): BotResponse {
  const t = input.toLowerCase();

  // Accumulate the most relevant options based on word presence
  const opts: ChatOption[] = [];

  if (/price|cost|worth|value|expensive|cheap|afford/.test(t))
    opts.push({ icon: '💰', label: 'Property Pricing & Valuation', value: 'Property pricing tips', description: 'CMA strategy & best practices' });

  if (/buy|purchase|looking|search|find.*home|want.*house/.test(t))
    opts.push({ icon: '🔑', label: 'Buyer\'s Guide', value: 'Buying guide', description: 'Step-by-step purchase process' });

  if (/sell|list|put.*market|get.*offer/.test(t))
    opts.push({ icon: '🏷️', label: 'Selling Tips & Checklist', value: 'Selling tips', description: 'Prep, pricing & timing' });

  if (/lead|client|crm|contact|prospect/.test(t))
    opts.push({ icon: '👥', label: 'Lead & CRM Management', value: 'Tell me about leads', description: 'Pipeline, scoring & follow-ups' });

  if (/mortgage|loan|financ|rate|down.*pay|payment/.test(t))
    opts.push({ icon: '🏦', label: 'Mortgage & Financing', value: 'Mortgage info', description: 'Rates, qualifications & programs' });

  if (/neighbourhood|area|location|toronto|oakville|markham|mississauga/.test(t))
    opts.push({ icon: '🗺️', label: 'Neighbourhood Guide', value: 'Best neighbourhoods', description: 'GTA area breakdown & prices' });

  if (/open.*house|showing|tour|viewing/.test(t))
    opts.push({ icon: '🚪', label: 'Open House Tips', value: 'open house tips', description: 'Maximise foot traffic & leads' });

  if (/commission|fee|percent|agent.*cost/.test(t))
    opts.push({ icon: '💼', label: 'Commission & Fees', value: 'commission info', description: 'Ontario realtor fee breakdown' });

  if (/photo|image|picture|staging|virtual/.test(t))
    opts.push({ icon: '📸', label: 'Property Photography', value: 'photography guide', description: 'MLS photos & virtual staging' });

  if (/contract|document|agreement|offer|form|pdf/.test(t))
    opts.push({ icon: '📄', label: 'Real Estate Documents', value: 'document help', description: 'Contracts, APS, disclosure forms' });

  if (/new|latest|recent|just.*listed|fresh/.test(t))
    opts.push({ icon: '🆕', label: 'New Listings', value: 'Tell me about properties', description: 'Recently listed properties' });

  if (/market|trend|stat|data|report|inventory/.test(t))
    opts.push({ icon: '📊', label: 'Market Statistics', value: 'Show market stats', description: 'GTA prices & trends' });

  // Always add main menu as last resort
  opts.push({ icon: '🔙', label: 'See All Topics', value: 'help menu', description: 'Full topic menu' });

  // Deduplicate and cap at 6 options
  const seen = new Set<string>();
  const unique = opts.filter((o) => {
    if (seen.has(o.value)) return false;
    seen.add(o.value);
    return true;
  }).slice(0, 6);

  return {
    content: `Here's what I found related to **"${input.slice(0, 60)}${input.length > 60 ? '…' : ''}"** — select an option to dive deeper:`,
    options: unique,
  };
}

/* ─────────────────────────── Fallback ───────────────────────────────── */

function fallback(input = ''): BotResponse {
  if (input.trim().length > 3) {
    return dynamicOptions(input);
  }
  return {
    content: "I didn't quite catch that. Here are the topics I can help with:",
    options: MAIN_MENU_OPTIONS,
  };
}

/* ─────────────────────────── Main Export ────────────────────────────── */

export async function getBotResponse(
  userText: string,
  attachments?: ChatAttachment[]
): Promise<ChatMessage> {
  // Simulate network latency (400–900ms)
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 500));

  let response: BotResponse;

  // If there's text, try intent matching
  if (userText.trim()) {
    const matched = intentRules.find((rule) =>
      rule.patterns.some((p) => p.test(userText))
    );
    response = matched
      ? matched.handler(userText, attachments)
      : fallback(userText);
  } else if (attachments && attachments.length > 0) {
    // Attachment only
    response = handleAttachmentOnly(attachments);
  } else {
    response = fallback();
  }

  return {
    id: uuid(),
    role: 'assistant',
    content: response.content,
    timestamp: Date.now(),
    quickReplies: response.quickReplies,
    options: response.options,
    listings: response.listings,
    metadata: response.metadata,
  };
}
