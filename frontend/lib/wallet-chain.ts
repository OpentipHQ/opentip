// Wallet writes are only announced when the connected wallet is on the
// chain the app is configured for. A receipt waited on another chain must
// not surface as a successful tip.
export function mayAnnounceTipSent(
  walletChainId: number | undefined,
  configuredChainId: number,
): boolean {
  return walletChainId === configuredChainId;
}
