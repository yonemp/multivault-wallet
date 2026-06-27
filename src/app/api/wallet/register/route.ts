import { verifyMessage } from "ethers";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { upsertWallet } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RegisterBody = {
  address: string;
  chain: "ethereum" | "solana" | "polygon" | "bsc";
  walletType: "created" | "imported" | "metamask" | "phantom" | "trust";
  message: string;
  signature: string;
};

function verifyEvmSignature(address: string, message: string, signature: string) {
  const recovered = verifyMessage(message, signature);
  return recovered.toLowerCase() === address.toLowerCase();
}

function verifySolanaSignature(
  address: string,
  message: string,
  signatureBase64: string,
) {
  const publicKey = new PublicKey(address);
  const messageBytes = new TextEncoder().encode(message);
  const signature = Buffer.from(signatureBase64, "base64");

  return nacl.sign.detached.verify(
    messageBytes,
    signature,
    publicKey.toBytes(),
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const { address, chain, walletType, message, signature } = body;

    if (!address || !chain || !walletType || !message || !signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!message.includes("Sign in to MultiVault")) {
      return NextResponse.json({ error: "Invalid sign-in message" }, { status: 400 });
    }

    let valid = false;

    if (chain === "solana") {
      valid = verifySolanaSignature(address, message, signature);
    } else {
      valid = verifyEvmSignature(address, message, signature);
    }

    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    upsertWallet({ address, chain, walletType });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}