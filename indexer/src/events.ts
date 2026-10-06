// Claimed fires after the payout wallet withdraws. The copy must describe
// funds that already left the contract, not a claim that is still available.
export function claimedNotification(repoId: string, amountLabel: string | null): { title: string; body: string } {
  return {
    title: "Tips paid out",
    body: amountLabel
      ? `${amountLabel} was withdrawn from ${repoId}`
      : `Tips were withdrawn from ${repoId}`,
  };
}

// Payout rotation from either the owner (updatePayoutAddress) or an admin
// reassignment. Both events carry the new address as `newAddress`.
export function payoutUpdateFromEvent(
  eventName: string,
  args: { repoId?: string; newAddress?: string },
): { repoId: string; payoutAddress: string } | null {
  if (eventName !== "PayoutAddressUpdated" && eventName !== "AdminPayoutReassigned") return null;
  if (!args.repoId || !args.newAddress) return null;
  return { repoId: args.repoId, payoutAddress: args.newAddress.toLowerCase() };
}
