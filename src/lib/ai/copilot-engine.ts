import { BRAND_NAME } from "@/lib/brand";
import type { MarketSnapshot } from "@/lib/ai/market-context";
import { formatSnapshotForPrompt } from "@/lib/ai/market-context";

export type CopilotMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are the ${BRAND_NAME} Intel copilot — an expert on crypto, DeFi, memecoins, and AI-driven finance.

Rules:
- Educational and analytical only. Never tell users to buy or sell specific tokens.
- Emphasize risks: rugs, volatility, smart contract risk, self-custody responsibility.
- ${BRAND_NAME} is self-custodial; you cannot execute trades — users trade via the terminal UI.
- Be concise but substantive. Use bullet points for clarity when helpful.
- Reference live market context when provided.
- Discuss AI agents, DeFi composability, memecoin culture, and the future of programmable finance when relevant.`;

function matchTopic(input: string): string | null {
  const q = input.toLowerCase();
  if (/meme|pump|solana token|pulse|degen|bonk|wif/i.test(q)) return "memecoins";
  if (/defi|swap|liquidity|lend|yield|uniswap|jupiter|composab/i.test(q)) return "defi";
  if (/ai|agent|llm|automat|machine|future/i.test(q)) return "ai";
  if (/risk|rug|scam|safe|security|custod/i.test(q)) return "risk";
  if (/pulse|discover|migrat|bonding/i.test(q)) return "pulse";
  return null;
}

function fallbackReply(question: string, snapshot: MarketSnapshot): string {
  const topic = matchTopic(question);
  const ctx = formatSnapshotForPrompt(snapshot);

  const blocks: Record<string, string> = {
    memecoins: `**Memecoins are culture markets on-chain.**

They trade narrative velocity more than cash flows. On Solana, low fees and fast finality turned memecoins into a real-time attention economy — launches, bonding curves, migrations, and liquidity cycles that can complete in hours.

**What makes them different:**
- Reflexive pricing: social momentum → buys → more momentum
- Extreme dispersion: most tokens die; a few create outsized returns
- On-chain transparency: wallets, snipers, and dev holdings are visible — if you know where to look

**How to use ${BRAND_NAME}:** Pulse tracks new → final stretch → migrated stages. Treat memecoins as high-entropy experiments, not investments.

*Not financial advice.*`,

    defi: `**DeFi is programmable finance — money as Lego blocks.**

Instead of asking a bank for a loan, you interact with a smart contract. Swaps, lending, perps, and yield all compose: borrow on one protocol, swap on another, hedge on a third — often in one transaction.

**Core primitives:**
- DEXs (Jupiter on Solana, aggregators on EVM) — 24/7 liquidity
- Lending markets — collateralized credit without credit scores
- Stablecoins — on-chain dollars bridging TradFi and crypto rails

**The tradeoff:** you custody your keys, you own the outcome. Smart contract bugs, oracle failures, and liquidation risk are real.

${BRAND_NAME} routes swaps through Jupiter/LI.FI while keeping keys encrypted locally.`,

    ai: `**AI + crypto is converging into agentic finance.**

Blockchains are machine-readable money: addresses, allowances, and contract calls that bots can act on without human bank APIs.

**What's emerging:**
- Agents that rebalance, hunt yield, and monitor risk 24/7
- LLMs synthesizing on-chain data, governance, and news at scale
- Natural language → structured trade intents (with human confirmation)

**The risks:** correlated bot crashes, MEV extraction, prompt injection on trading agents, and regulatory ambiguity around autonomous execution.

The future isn't AI replacing traders — it's operators supervising swarms of specialized agents, with crypto as the settlement layer.`,

    risk: `**Risk framework for on-chain markets**

1. **Self-custody** — lost seed = lost funds forever. ${BRAND_NAME} cannot recover phrases.
2. **Smart contracts** — audits help; they don't eliminate exploit risk.
3. **Memecoins** — assume extreme loss probability; watch dev %, snipers, liquidity.
4. **DeFi** — liquidation, depeg, and oracle risk during volatility.
5. **AI tools** — verify outputs; never auto-sign without understanding the transaction.

Size positions so a total loss doesn't matter. Survival > hero trades.`,

    pulse: `**Pulse is ${BRAND_NAME}'s live memecoin discovery feed.**

Tokens move through stages:
- **New** — recently launched on bonding curve
- **Final Stretch** — approaching migration threshold (~80%+ bonding)
- **Migrated** — graduated to AMM liquidity (higher stakes, different dynamics)

Watch volume, holder concentration, sniper %, and social links — but remember: visible data doesn't mean safe.

Use Trade tab for charts and execution after you've done your own research.`,
  };

  if (topic && blocks[topic]) {
    return `${blocks[topic]}\n\n---\n*Live context:*\n${ctx}`;
  }

  return `**${BRAND_NAME} Intel**

I can help you understand memecoins, DeFi, AI-driven finance, Pulse discovery, and risk management. I don't execute trades or give buy/sell calls.

Try asking:
- "What's the memecoin landscape right now?"
- "How does DeFi composability work?"
- "How will AI change trading?"
- "What should I watch on Pulse?"

---\n*Live context:*\n${ctx}`;
}

async function callOpenAI(
  messages: CopilotMessage[],
  snapshot: MarketSnapshot,
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const contextMessage = formatSnapshotForPrompt(snapshot);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.6,
      max_tokens: 900,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: contextMessage },
        ...messages,
      ],
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

export async function generateCopilotReply(
  messages: CopilotMessage[],
  snapshot: MarketSnapshot,
): Promise<{ reply: string; mode: "ai" | "local" }> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return {
      reply: `Ask me about memecoins, DeFi, AI × finance, or how to use ${BRAND_NAME}.`,
      mode: "local",
    };
  }

  const aiReply = await callOpenAI(messages, snapshot);
  if (aiReply) return { reply: aiReply, mode: "ai" };

  return { reply: fallbackReply(lastUser.content, snapshot), mode: "local" };
}

export const SUGGESTED_PROMPTS = [
  "What's happening in memecoins right now?",
  "Explain DeFi composability",
  "How does AI change the future of finance?",
  "What should I watch on Pulse?",
  "How do I manage risk in degen markets?",
] as const;

export const INSIGHT_SECTIONS = [
  {
    id: "website",
    title: "The Tackers platform",
    tag: "What this is",
    body: "A browser-native trading terminal and self-custody vault — not a custodial exchange. Pulse for memecoin discovery, Trade for execution, Intel for AI-assisted context, Trackers for wallet surveillance, Portfolio for cross-chain balances, Rewards for operator retention. Keys encrypted locally; only public addresses register server-side after signature verification.",
  },
  {
    id: "memecoins",
    title: "Memecoins",
    tag: "Culture layer",
    body: "Attention markets on-chain. Price follows narrative velocity, community energy, and liquidity cycles — not earnings. Solana's speed made memecoins a real-time sport: launch, bond, migrate, repeat. Pulse tracks all three stages. Most tokens die; the culture and infrastructure persist. Reading sniper %, dev holdings, and migration timing is the new financial literacy.",
  },
  {
    id: "defi",
    title: "DeFi",
    tag: "Protocol layer",
    body: "Financial primitives as open software — swaps, lending, derivatives, and yield that compose like APIs. Borrow on A, swap on B, hedge on C in one transaction. Tackers routes through Jupiter (Solana) and LI.FI (EVM). Self-custody means self-responsibility: smart contract risk, liquidation, and oracle failure are yours to manage.",
  },
  {
    id: "ai",
    title: "AI × Finance",
    tag: "Compute layer",
    body: "Agents with wallets. LLMs digest on-chain data at scale. Natural language becomes trade intent — with human confirmation before signing. Crypto rails are machine-native: addresses, allowances, contract calls. The copilot educates; it never auto-trades. The roadmap: deeper agents, alerts, and session summaries under hard guardrails.",
  },
  {
    id: "potential",
    title: "Potential",
    tag: "Where it goes",
    body: "Near term: wallet alerts, Pulse safety heuristics, copy-trade signals. Medium: chain abstraction, perpetuals, social alpha feeds. Long: an operating system for personal financial stacks — memecoins, RWAs, DeFi, and AI agents in one self-custodial shell. The TAM isn't just crypto natives; it's everyone whose money becomes programmable.",
  },
  {
    id: "future",
    title: "The stack",
    tag: "Three layers",
    body: "Culture (memecoins, attention) → Protocol (DeFi composability) → Compute (AI agents). Hybrid money bridges fiat and stablecoins. Personal stacks replace single bank apps. Finance becomes global, social, automated — with humans setting the guardrails. Tackers is the terminal you inhabit while it happens.",
  },
] as const;