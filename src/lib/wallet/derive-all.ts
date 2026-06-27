import { HDKey } from "@scure/bip32";
import * as bitcoin from "bitcoinjs-lib";
import { mnemonicToSeedSync } from "bip39";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { WalletContractV4 } from "@ton/ton";
import { Wallet as XrpWallet } from "xrpl";
import { deriveEvmWallet } from "./evm";
import { deriveSolanaKeypair } from "./solana";
import { ChainId } from "./chains";

const LITECOIN_NETWORK: bitcoin.Network = {
  messagePrefix: "\x19Litecoin Signed Message:\n",
  bech32: "ltc",
  bip32: { public: 0x019da462, private: 0x019d9cfe },
  pubKeyHash: 0x30,
  scriptHash: 0x32,
  wif: 0xb0,
};

function deriveUtxoAddress(
  mnemonic: string,
  coinType: 0 | 2,
): string {
  const seed = mnemonicToSeedSync(mnemonic.trim().toLowerCase());
  const hd = HDKey.fromMasterSeed(seed);
  const child = hd.derive(`m/84'/${coinType}'/0'/0/0`);

  if (!child.publicKey) {
    throw new Error("Failed to derive UTXO key");
  }

  const network =
    coinType === 0 ? bitcoin.networks.bitcoin : LITECOIN_NETWORK;

  const { address } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(child.publicKey),
    network,
  });

  if (!address) {
    throw new Error("Failed to build UTXO address");
  }

  return address;
}

async function deriveTonAddress(mnemonic: string): Promise<string> {
  const words = mnemonic.trim().toLowerCase().split(/\s+/);
  const keys = await mnemonicToPrivateKey(words);
  const wallet = WalletContractV4.create({
    publicKey: keys.publicKey,
    workchain: 0,
  });
  return wallet.address.toString({ bounceable: false });
}

function deriveXrpAddress(mnemonic: string): string {
  const wallet = XrpWallet.fromMnemonic(mnemonic.trim().toLowerCase());
  return wallet.classicAddress;
}

export async function deriveAllAddresses(
  mnemonic: string,
): Promise<Partial<Record<ChainId, string>>> {
  const evm = deriveEvmWallet(mnemonic);
  const solana = deriveSolanaKeypair(mnemonic);

  return {
    bitcoin: deriveUtxoAddress(mnemonic, 0),
    litecoin: deriveUtxoAddress(mnemonic, 2),
    ethereum: evm.address,
    solana: solana.publicKey.toBase58(),
    ton: await deriveTonAddress(mnemonic),
    xrp: deriveXrpAddress(mnemonic),
    monero: undefined,
  };
}

export function getExternalAddresses(input: {
  evmAddress?: string;
  solanaAddress?: string;
}): Partial<Record<ChainId, string>> {
  const addresses: Partial<Record<ChainId, string>> = {};
  if (input.evmAddress) {
    addresses.ethereum = input.evmAddress;
  }
  if (input.solanaAddress) {
    addresses.solana = input.solanaAddress;
  }
  return addresses;
}