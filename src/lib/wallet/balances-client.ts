import { ChainId } from "./chains";

export type ChainBalances = Partial<Record<ChainId, string>>;

export async function fetchChainBalances(
  addresses: Partial<Record<ChainId, string>>,
): Promise<ChainBalances> {
  const res = await fetch("/api/balances", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addresses }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch balances");
  }

  const data = (await res.json()) as { balances: ChainBalances };
  return data.balances;
}