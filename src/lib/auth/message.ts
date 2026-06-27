import { BRAND_NAME } from "@/lib/brand";

export function buildSignInMessage(address: string, chain: string) {
  const timestamp = new Date().toISOString();
  return `Sign in to ${BRAND_NAME}

Address: ${address}
Chain: ${chain}
Timestamp: ${timestamp}

This request will not trigger a blockchain transaction or cost any gas fees.`;
}