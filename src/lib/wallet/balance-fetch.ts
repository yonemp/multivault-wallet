import { JsonRpcProvider, formatEther } from "ethers";
import { Connection, PublicKey } from "@solana/web3.js";
import { ChainId } from "./chains";
import { EVM_CHAINS } from "./evm";
import { getSolanaRpcEndpoints } from "./solana";

export type ChainBalances = Partial<Record<ChainId, string>>;

async function fetchBtcBalance(address: string) {
  const res = await fetch(`https://blockstream.info/api/address/${address}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) return "0";
  const data = (await res.json()) as {
    chain_stats: { funded_txo_sum: number; spent_txo_sum: number };
  };
  const sats =
    data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
  return (sats / 1e8).toFixed(8);
}

async function fetchLtcBalance(address: string) {
  const res = await fetch(
    `https://api.blockcypher.com/v1/ltc/main/addrs/${address}/balance`,
    { next: { revalidate: 30 } },
  );
  if (!res.ok) return "0";
  const data = (await res.json()) as { balance: number };
  return (data.balance / 1e8).toFixed(8);
}

async function fetchTonBalance(address: string) {
  const res = await fetch(
    `https://toncenter.com/api/v2/getAddressBalance?address=${encodeURIComponent(address)}`,
    { next: { revalidate: 30 } },
  );
  if (!res.ok) return "0";
  const data = (await res.json()) as { result?: string };
  return data.result ? (Number(data.result) / 1e9).toFixed(4) : "0";
}

async function fetchXrpBalance(address: string) {
  const res = await fetch("https://xrplcluster.com/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "account_info",
      params: [{ account: address, ledger_index: "validated" }],
    }),
    next: { revalidate: 30 },
  });
  if (!res.ok) return "0";
  const data = (await res.json()) as {
    result?: { account_data?: { Balance?: string } };
  };
  const drops = data.result?.account_data?.Balance;
  return drops ? (Number(drops) / 1e6).toFixed(4) : "0";
}

async function fetchSolanaBalance(address: string): Promise<string> {
  const endpoints = getSolanaRpcEndpoints();
  let lastError: unknown;

  for (const rpc of endpoints) {
    try {
      const connection = new Connection(rpc, "confirmed");
      const lamports = await connection.getBalance(new PublicKey(address));
      return (lamports / 1e9).toFixed(4);
    } catch (err) {
      lastError = err;
    }
  }

  console.error("All Solana RPC endpoints failed:", lastError);
  throw new Error("Unable to fetch Solana balance");
}

export async function fetchChainBalances(
  addresses: Partial<Record<ChainId, string>>,
): Promise<ChainBalances> {
  const balances: ChainBalances = {};
  const tasks: Promise<void>[] = [];

  if (addresses.bitcoin) {
    tasks.push(
      fetchBtcBalance(addresses.bitcoin)
        .then((v) => {
          balances.bitcoin = v;
        })
        .catch(() => {
          balances.bitcoin = "0";
        }),
    );
  }

  if (addresses.litecoin) {
    tasks.push(
      fetchLtcBalance(addresses.litecoin)
        .then((v) => {
          balances.litecoin = v;
        })
        .catch(() => {
          balances.litecoin = "0";
        }),
    );
  }

  if (addresses.ethereum) {
    tasks.push(
      (async () => {
        const provider = new JsonRpcProvider(EVM_CHAINS.ethereum.rpc);
        const raw = await provider.getBalance(addresses.ethereum!);
        balances.ethereum = formatEther(raw);
      })().catch(() => {
        balances.ethereum = "0";
      }),
    );
  }

  if (addresses.solana) {
    tasks.push(
      fetchSolanaBalance(addresses.solana)
        .then((v) => {
          balances.solana = v;
        })
        .catch(() => {
          balances.solana = "0";
        }),
    );
  }

  if (addresses.ton) {
    tasks.push(
      fetchTonBalance(addresses.ton)
        .then((v) => {
          balances.ton = v;
        })
        .catch(() => {
          balances.ton = "0";
        }),
    );
  }

  if (addresses.xrp) {
    tasks.push(
      fetchXrpBalance(addresses.xrp)
        .then((v) => {
          balances.xrp = v;
        })
        .catch(() => {
          balances.xrp = "0";
        }),
    );
  }

  await Promise.all(tasks);
  return balances;
}