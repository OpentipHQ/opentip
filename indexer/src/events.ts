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
