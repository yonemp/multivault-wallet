import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { isAddress, JsonRpcProvider, parseEther } from "ethers";
import { deriveEvmWallet, EVM_CHAINS, EvmChainKey } from "./evm";
import { deriveSolanaKeypair, SOLANA_RPC } from "./solana";

export async function sendEvmNativeLocal(
  mnemonic: string,
  chain: EvmChainKey,
  to: string,
  amount: string,
) {
  const config = EVM_CHAINS[chain];
  const provider = new JsonRpcProvider(config.rpc);
  const wallet = deriveEvmWallet(mnemonic).connect(provider);
  const tx = await wallet.sendTransaction({
    to,
    value: parseEther(amount),
  });
  await tx.wait();
  return tx.hash;
}

export async function sendEvmNativeExternal(
  chain: EvmChainKey,
  from: string,
  to: string,
  amount: string,
) {
  if (!window.ethereum) {
    throw new Error("No EVM wallet found");
  }

  const config = EVM_CHAINS[chain];
  await window.ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: `0x${config.chainId.toString(16)}` }],
  }).catch(() => null);

  const value = `0x${BigInt(parseEther(amount).toString()).toString(16)}`;
  const hash = (await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [{ from, to, value }],
  })) as string;

  return hash;
}

export async function sendSolanaLocal(
  mnemonic: string,
  to: string,
  amount: string,
) {
  const connection = new Connection(SOLANA_RPC, "confirmed");
  const from = deriveSolanaKeypair(mnemonic);
  const lamports = Math.round(parseFloat(amount) * 1e9);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: new PublicKey(to),
      lamports,
    }),
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [from]);
  return signature;
}

export async function sendSolanaExternal(to: string, amount: string) {
  const phantom = window.phantom?.solana;

  if (!phantom?.publicKey) {
    throw new Error("Phantom is not connected");
  }

  const connection = new Connection(SOLANA_RPC, "confirmed");
  const lamports = Math.round(parseFloat(amount) * 1e9);
  const from = new PublicKey(phantom.publicKey.toString());

  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction({
    recentBlockhash: blockhash,
    feePayer: from,
  }).add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: new PublicKey(to),
      lamports,
    }),
  );

  const { signature } = await phantom.signAndSendTransaction(tx);
  return signature;
}

export function isValidEvmAddress(address: string) {
  return isAddress(address);
}

export function isValidSolanaAddress(address: string) {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}