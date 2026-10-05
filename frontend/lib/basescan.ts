export function getBasescanTxUrl(txHash: string): string {
  const chain = process.env.NEXT_PUBLIC_CHAIN;
  const base = chain === "base" ? "https://basescan.org" : "https://sepolia.basescan.org";
  return `${base}/tx/${txHash}`;
}
