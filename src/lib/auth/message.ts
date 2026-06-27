export function buildSignInMessage(address: string, chain: string) {
  const timestamp = new Date().toISOString();
  return `Sign in to MultiVault

Address: ${address}
Chain: ${chain}
Timestamp: ${timestamp}

This request will not trigger a blockchain transaction or cost any gas fees.`;
}