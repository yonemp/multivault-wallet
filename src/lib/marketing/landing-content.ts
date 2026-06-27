import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export type LandingFeature = {
  title: string;
  tag: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LandingChapter = {
  id: string;
  kicker: string;
  title: string;
  lead: string;
  paragraphs: string[];
  bullets?: string[];
};

export const LANDING_HERO_EXTENDED = {
  sublead: `${BRAND_NAME} is a multi-chain trading terminal and self-custody vault — built for operators who live on-chain. Not another custodial exchange. Not another read-only dashboard. A full workspace where discovery, execution, portfolio, and intelligence live in one encrypted, browser-native environment.`,
  secondLead: `From memecoin pulse feeds to Jupiter swaps, from wallet tracking to AI-driven market thesis — ${BRAND_NAME} is designed for the era where finance is programmable, global, and never offline.`,
};

export const PLATFORM_FEATURES: LandingFeature[] = [
  {
    title: "Pulse",
    tag: "Live discovery",
    paragraphs: [
      "Pulse is the heartbeat of on-chain attention. It streams new token launches across bonding curves and migration stages — New, Final Stretch, and Migrated — so you're not refreshing Twitter hoping someone posts a contract address.",
      "Every card surfaces what operators actually need: market cap, volume, age, holder concentration, sniper activity, social links, and bonding progress. This is memecoin discovery as infrastructure, not a side feature bolted onto a wallet.",
      "The market moved from 'check Discord for alpha' to 'watch the feed in real time.' Pulse is built for that shift. When narrative velocity is the asset, speed and clarity are the product.",
    ],
    bullets: [
      "Three-column migration pipeline with draggable widths",
      "Live pump.fun data with Axiom-style coin cards",
      "Recent memecoins bar in the header for instant recall",
      "One click from discovery into Trade charts",
    ],
  },
  {
    title: "Trade",
    tag: "Execution layer",
    paragraphs: [
      "Discovery without execution is just entertainment. Trade turns conviction into action — charts, pair data, live trades, bubble maps, instant buy/sell controls, and swap routing through Jupiter on Solana and LI.FI on EVM chains.",
      "The terminal layout mirrors how professional operators work: information density on the left, execution on the right, context always visible. Floating instant trade follows you across views when speed matters more than ceremony.",
      "Limit orders and sniper staging live locally until you're ready to sign. Your keys, your transaction, your responsibility — the way on-chain finance was always meant to work.",
    ],
    bullets: [
      "Multi-asset charts with lightweight live data",
      "Instant trade panel with draggable position",
      "Swap quotes from Jupiter and LI.FI",
      "Sniper and limit order staging",
    ],
  },
  {
    title: "Intel",
    tag: "AI × market thesis",
    paragraphs: [
      "Markets are noisy. Memecoins are louder. DeFi is complex. AI is accelerating everything. Intel is where context lives — live SOL and Pulse statistics, long-form thesis on the culture/protocol/compute stack, and an AI copilot that explains without shilling.",
      "Ask about memecoin dynamics, DeFi composability, agentic finance, or how to read Pulse data. The copilot pulls live market context into every answer. With an OpenAI key configured, you get full LLM depth; without it, local intelligence still delivers substantive guidance.",
      "Intel is not financial advice. It's the operating manual for a world where programmable money meets programmable intelligence — and you still hold the keys.",
    ],
    bullets: [
      "Live SOL price and Pulse stage counts",
      "Memecoin, DeFi, and AI thesis library",
      "AI copilot with guardrails — no auto-trading",
      "Top movers and refreshable market snapshot",
    ],
  },
  {
    title: "Trackers",
    tag: "Wallet intelligence",
    paragraphs: [
      "Alpha isn't only what you hold — it's what smart wallets are doing. Trackers lets you watch any public address: friends, KOLs, suspected insiders, or your own sub-wallets across Solana and Ethereum.",
      "Wallet Manager handles labels and organization. Friends syncs social graph to watched wallets. Live Trades, Monitor, and KOL views are staged for the next wave of copy-trade and signal infrastructure.",
      "The vision: one pane of glass for every wallet that matters to your thesis, with alerts and PnL context before the crowd notices on-chain.",
    ],
    bullets: [
      "Import/export watched wallet lists",
      "Friend-to-tracker sync",
      "Manual and social wallet sources",
      "Multi-chain address support",
    ],
  },
  {
    title: "Vault",
    tag: "Self-custody core",
    paragraphs: [
      "Everything in Tackers sits on self-custody. Your seed phrase is generated and encrypted in the browser. Password-derived keys protect local storage. Public addresses register via signature — never your private material.",
      "Multi-wallet vault supports created and imported wallets with color labels, active wallet switching, and legacy migration from single-wallet storage. Connect MetaMask, Phantom, or Trust for external signing per chain.",
      "This is the foundation. No infrastructure provider can freeze your phrase. No support ticket recovers a lost backup. You are the bank — Tackers is the terminal on your desk.",
    ],
    bullets: [
      "AES-GCM encrypted mnemonic storage",
      "Multi-wallet vault with active session",
      "External wallet connect per chain",
      "Password-gated seed reveal and exports",
    ],
  },
  {
    title: "Portfolio & Rewards",
    tag: "Operator account",
    paragraphs: [
      "Portfolio aggregates balances across chains — SOL, EVM assets, custom tokens — with performance snapshots over time. Wallets panel handles send, receive, swap entry points, and vault management without leaving the terminal.",
      "Rewards gamifies engagement: points per trade, referral multipliers, rank progression from Bronze to Diamond. It's early infrastructure for community growth in a product that lives and dies by operator retention.",
      "Together, Portfolio and Rewards turn anonymous on-chain activity into a persistent operator identity — username, profile, friends, tickets, and a reason to come back every session.",
    ],
    bullets: [
      "Cross-chain balance aggregation",
      "Daily portfolio snapshots and PnL",
      "Referral codes and rank multipliers",
      "Public username and profile system",
    ],
  },
];

export const MEMECOIN_CHAPTER: LandingChapter = {
  id: "memecoins",
  kicker: "Culture markets",
  title: "Why memecoins changed everything",
  lead: "They look irrational from the outside. From the inside, they're the purest expression of internet-native finance.",
  paragraphs: [
    "For decades, markets pretended to be about discounted cash flows. Memecoins stripped the pretense. Price follows story, story follows attention, attention follows velocity — and on Solana, velocity is measured in seconds, not quarters.",
    "A memecoin launch is a cultural event: a ticker, a meme, a community, a bonding curve, a migration, a liquidity pool, a legend or a graveyard. Thousands launch daily. Almost all die. The survivors rewrite what retail believes is possible in a weekend.",
    "Low fees matter. Fast finality matters. Fair-launch tooling matters. When it costs pennies and takes milliseconds to trade, speculation becomes a sport — and sports have leagues, stars, rituals, and infrastructure. Pulse is that infrastructure.",
    "Serious operators don't dismiss memecoins. They study them — holder maps, sniper %, dev wallets, volume fakeouts, migration timing. The skill is reading reflexivity before the reflex reverses. That's not gambling literacy. That's a new financial literacy.",
    "Memecoins are also onboarding. Millions of people learned what a wallet is, what slippage means, what 'liquidity' implies, because a frog coin went vertical. The culture layer pulls users in; the protocol layer keeps them when they discover DeFi.",
  ],
  bullets: [
    "Attention as the primary asset",
    "Bonding curves → migration → AMM lifecycle",
    "On-chain transparency for snipers, devs, insiders",
    "Solana speed as the enabling substrate",
    "Narrative half-lives measured in hours",
  ],
};

export const DEFI_CHAPTER: LandingChapter = {
  id: "defi",
  kicker: "Protocol markets",
  title: "DeFi is finance with the API keys exposed",
  lead: "Banks hide their ledgers. DeFi publishes them.",
  paragraphs: [
    "Decentralized finance isn't a brand. It's a design pattern: financial rules encoded in smart contracts, liquidity contributed by participants, settlement guaranteed by consensus instead of corporate promise.",
    "Swap on a DEX and you're interacting with a pool contract, not a market maker's desk. Lend on a protocol and your collateral ratio is math, not a credit committee. Perps, options, structured products — increasingly composable, increasingly on-chain.",
    "Composability is the superpower. In TradFi, integrating two institutions takes lawyers and quarters. In DeFi, integrating two protocols can take one transaction bundle. Borrow, swap, stake, hedge — atomic, programmable, global.",
    "The tradeoffs are real. Smart contract exploits drain treasuries. Oracles lie or lag. Liquidations cascade. Governance gets captured. DeFi doesn't remove risk — it makes risk transparent and puts it in your hands.",
    "Tackers routes through battle-tested aggregators — Jupiter for Solana, LI.FI for EVM — while keeping custody local. The goal isn't to rebuild every DeFi primitive. It's to be the best surface for using them.",
    "The next wave is real-world assets: treasuries, credit, commodities tokenized on-chain. DeFi collateral mixes volatile crypto with stable yield. Institutional capital enters through RWAs, not memes — but both live in the same composable stack.",
  ],
  bullets: [
    "Open liquidity and lending markets",
    "Atomic composability across protocols",
    "Self-custody and transparent risk",
    "Aggregator routing for best execution",
    "RWAs bridging TradFi and on-chain yield",
  ],
};

export const AI_CHAPTER: LandingChapter = {
  id: "ai",
  kicker: "Compute markets",
  title: "AI and the machine-native money stack",
  lead: "Fiat banking was built for humans filling forms. Crypto was built for machines signing transactions.",
  paragraphs: [
    "Artificial intelligence changes finance on two axes: speed of understanding, and speed of action. LLMs digest governance forums, earnings, on-chain flows, and social signals faster than any research desk. Agents turn that synthesis into structured intents — swaps, rebalances, alerts, hedges.",
    "Crypto is uniquely compatible with AI because money itself is an API. Addresses, allowances, contract calls, mempools — machine-readable by design. An agent doesn't need a human to approve a wire transfer form. It needs a signed transaction and clear guardrails.",
    "The emerging model isn't 'AI replaces traders.' It's operators supervising specialized agents: one watches liquidation risk, one monitors whale wallets, one scans Pulse for migration setups, one drafts the thesis you actually read before clicking confirm.",
    "Risks scale too. Correlated bot behavior amplifies crashes. MEV bots extract from slower participants. Prompt injection becomes an attack on trading agents. Model monoculture creates herding. Regulation lags autonomous execution.",
    "Tackers Intel is the first layer: education, context, live data, copilot guidance — never auto-signing on your behalf. The roadmap points toward deeper agent integration with hard human-in-the-loop signing. The future is augmented operators, not reckless automation.",
    "Payments for compute, data, and inference will increasingly settle on-chain. Micropayments, x402-style machine commerce, agent treasuries — all require programmable money. AI and crypto aren't adjacent trends. They're converging infrastructure.",
  ],
  bullets: [
    "On-chain data as LLM fuel",
    "Agents with wallets and allowances",
    "Human-in-the-loop execution guardrails",
    "MEV, herding, and adversarial prompt risks",
    "Machine commerce settling on-chain",
  ],
};

export const POTENTIAL_CHAPTER: LandingChapter = {
  id: "potential",
  kicker: "Where this goes",
  title: `The potential of ${BRAND_NAME}`,
  lead: `${BRAND_NAME} is early. The terminal works. The vision is much larger than today's feature set.`,
  paragraphs: [
    "Short term, the product is a polished operator workspace: Pulse discovery, Trade execution, Intel context, Trackers surveillance, Portfolio clarity, Rewards retention — all self-custodial, all in the browser, all live on tackers.xyz.",
    "Medium term, Tackers becomes the default surface for Solana-native operators and multi-chain degens who refuse to juggle twelve tabs. Unified alerts when watched wallets move. Copy-trade signals with explicit consent. Deeper Pulse filters by protocol, liquidity, and safety heuristics. Intel agents that summarize your session, not just the market.",
    "Long term, the bet is bigger: finance fragments into personal stacks — wallet, DEX, perps, yield, data, AI — and winners own the shell that composes them. Tackers aims to be that shell. Not a bank. Not an exchange. An operating system for on-chain capital.",
    "Imagine chain abstraction where users don't think about Solana vs Base — solvers route underneath. Imagine RWAs in portfolio alongside memecoins and LP positions. Imagine agent marketplace plugins with audited guardrails. Imagine social trading where reputation is on-chain and copy-trade is opt-in, not opaque.",
    "The total addressable market isn't 'crypto users.' It's everyone whose financial life becomes programmable — freelancers paid in stablecoins, creators tokenizing communities, funds automating treasuries, retail chasing narrative on Pulse. The interface layer for that economy is wide open.",
    "We're building in public. Ship, measure, iterate. Premium UX without custodial compromise. Real data without simulated alpha. Intelligence without shill. That's the standard — and the potential if execution continues to match ambition.",
  ],
  bullets: [
    "Near: alerts, filters, social copy-trade signals",
    "Mid: chain abstraction, deeper Intel agents",
    "Long: OS for personal financial stacks",
    "RWAs + memecoins in one portfolio view",
    "Agent plugins with human-approved signing",
    "Global, 24/7, self-custodial by default",
  ],
};

export const WEBSITE_CHAPTER: LandingChapter = {
  id: "website",
  kicker: "The platform",
  title: `What ${BRAND_NAME} is — and what it isn't`,
  lead: `${BRAND_TAGLINE} isn't a tagline for decoration. It describes the category we're building.`,
  paragraphs: [
    `${BRAND_NAME} is a website, yes — but more precisely it's infrastructure you run in your browser. Create or import a wallet. Encrypt your phrase locally. Register public addresses after signature verification. Open the terminal. Operate.`,
    "It is not a custodial exchange. We never hold your seed. We cannot recover your password. We cannot reverse your trades. That limitation is the feature.",
    "It is not a data theater. Pulse pulls live feeds. Prices hit CoinGecko. Swaps quote real aggregators. Tweet monitors stay empty rather than fake social alpha — because fake alpha costs real money.",
    "It is not finished. Trackers sub-tabs, perpetuals, predictions, and vision panels exist in codebase staging. Support tickets, friends, verification, admin health logs — operational bones for a growing platform.",
    "The website is the product. tackers.xyz is the front door. The terminal is the room you work in. Every design choice — 25% denser UI, draggable Pulse columns, recent memecoin pills in the header, premium landing, sign-in replaced by import-wallet clarity — serves operators who spend hours inside, not tourists who bounce.",
    "You can use Tackers without understanding the entire crypto-AI-DeFi thesis. But if you do understand it, you'll see why the pieces fit: culture discovery, protocol execution, compute intelligence, self-custody vault, social graph — one stack.",
  ],
};

export const ROADMAP_ITEMS = [
  { phase: "Live now", items: ["Pulse live feed", "Trade & swap", "Intel copilot", "Multi-wallet vault", "Trackers & friends", "Rewards & profiles", "Premium landing"] },
  { phase: "Building toward", items: ["Wallet move alerts", "Pulse safety heuristics", "Copy-trade signals", "Perpetuals panel", "Tweet monitor integration", "Mobile-optimized terminal"] },
  { phase: "Horizon", items: ["Agent marketplace", "Chain abstraction", "RWA portfolio slots", "DAO treasury tools", "Institutional read-only seats", "Cross-terminal API"] },
];

export const PULL_QUOTES = [
  {
    quote: "Finance used to be a institution you visited. Now it's a terminal you inhabit.",
    attr: `${BRAND_NAME} thesis`,
  },
  {
    quote: "Memecoins taught millions what a wallet is. DeFi teaches them what a market is. AI will teach machines what both mean.",
    attr: "Intel",
  },
  {
    quote: "Self-custody isn't a setting. It's the contract between you and the protocol.",
    attr: "Vault",
  },
];

export const FINAL_CTA = {
  title: "Open the terminal",
  lead: `Create a wallet in minutes. Import an existing phrase. Connect external wallets. The market doesn't wait — neither should your workspace.`,
};