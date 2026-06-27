import { Connection, VersionedTransaction } from "@solana/web3.js";
import { JsonRpcProvider } from "ethers";
import { deriveEvmWallet, EVM_CHAINS, EvmChainKey } from "./evm";
import { deriveSolanaKeypair, SOLANA_RPC } from "./solana";
import { EvmTokenId, SolanaTokenId } from "./tokens";

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

type EvmQuote = {
  transactionRequest: {
    to: string;
    data: string;
    value: string;
    gasLimit?: string;
    chainId: number;
  };
  estimate: {
    toAmount: string;
    toAmountMin: string;
  };
  action: {
    toToken: { symbol: string; decimals: number };
  };
};

export async function fetchEvmSwapQuote(input: {
  chain: EvmChainKey;
  fromToken: EvmTokenId;
  toToken: EvmTokenId;
  amount: string;
  fromAddress: string;
}) {
  const response = await fetch("/api/swap/evm/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? "Failed to fetch EVM quote");
  }

  const data = await response.json();
  return data.quote as EvmQuote;
}

export async function executeEvmSwapLocal(
  mnemonic: string,
  chain: EvmChainKey,
  quote: EvmQuote,
) {
  const config = EVM_CHAINS[chain];
  const provider = new JsonRpcProvider(config.rpc);
  const wallet = deriveEvmWallet(mnemonic).connect(provider);
  const { transactionRequest } = quote;

  const tx = await wallet.sendTransaction({
    to: transactionRequest.to,
    data: transactionRequest.data,
    value: BigInt(transactionRequest.value || "0"),
    gasLimit: transactionRequest.gasLimit
      ? BigInt(transactionRequest.gasLimit)
      : undefined,
  });

  await tx.wait();
  return tx.hash;
}

export async function executeEvmSwapExternal(
  chain: EvmChainKey,
  from: string,
  quote: EvmQuote,
) {
  if (!window.ethereum) {
    throw new Error("No EVM wallet found");
  }

  const config = EVM_CHAINS[chain];
  await window.ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: `0x${config.chainId.toString(16)}` }],
  }).catch(() => null);

  const { transactionRequest } = quote;
  const hash = (await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: transactionRequest.to,
        data: transactionRequest.data,
        value: transactionRequest.value,
        gas: transactionRequest.gasLimit,
      },
    ],
  })) as string;

  return hash;
}

export async function fetchSolanaSwapQuote(input: {
  fromToken: SolanaTokenId;
  toToken: SolanaTokenId;
  amount: string;
}) {
  const response = await fetch("/api/swap/solana/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? "Failed to fetch Solana quote");
  }

  const data = await response.json();
  return data.quote;
}

export async function executeSolanaSwapLocal(
  mnemonic: string,
  quote: unknown,
) {
  const keypair = deriveSolanaKeypair(mnemonic);
  const swapRes = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: keypair.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
    }),
  });

  if (!swapRes.ok) {
    throw new Error("Failed to build Solana swap transaction");
  }

  const { swapTransaction } = (await swapRes.json()) as {
    swapTransaction: string;
  };

  const tx = VersionedTransaction.deserialize(base64ToBytes(swapTransaction));
  tx.sign([keypair]);

  const connection = new Connection(SOLANA_RPC, "confirmed");

  const signature = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(signature, "confirmed");
  return signature;
}

export async function executeSolanaSwapExternal(
  quote: unknown,
  publicKey: string,
) {
  const phantom = window.phantom?.solana as {
    signAndSendTransaction: (
      tx: VersionedTransaction,
    ) => Promise<{ signature: string }>;
  } | undefined;

  if (!phantom) {
    throw new Error("Phantom is not connected");
  }

  const swapRes = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: publicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
    }),
  });

  if (!swapRes.ok) {
    throw new Error("Failed to build Solana swap transaction");
  }

  const { swapTransaction } = (await swapRes.json()) as {
    swapTransaction: string;
  };

  const tx = VersionedTransaction.deserialize(base64ToBytes(swapTransaction));

  const { signature } = await phantom.signAndSendTransaction(tx);
  return signature;
}

export function formatOutputAmount(raw: string, decimals: number) {
  return (Number(raw) / 10 ** decimals).toFixed(6);
}