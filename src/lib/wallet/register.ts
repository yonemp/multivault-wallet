export type RegisterWalletPayload = {
  address: string;
  chain: "ethereum" | "solana" | "polygon" | "bsc";
  walletType: "created" | "imported" | "metamask" | "phantom" | "trust";
  message: string;
  signature: string;
};

export async function registerWallet(payload: RegisterWalletPayload) {
  const response = await fetch("/api/wallet/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? "Failed to register wallet");
  }

  return response.json();
}