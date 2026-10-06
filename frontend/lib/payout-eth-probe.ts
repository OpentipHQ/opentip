export const PAYOUT_ETH_REJECTED =
  "This contract cannot receive ETH. claimAll reverts the whole claim if the ETH transfer fails, which also blocks token withdrawals.";

export const PAYOUT_ETH_UNVERIFIED =
  "Could not verify that this payout address can receive ETH. Try again.";

export function interpretEthReceiveProbe(input: {
  bytecode?: string | null;
  probe: "success" | "reverted" | "unavailable";
}): { ok: true } | { ok: false; reason: string } {
  const code = (input.bytecode ?? "").toLowerCase();
  if (!code || code === "0x") return { ok: true };
  if (input.probe === "success") return { ok: true };
  if (input.probe === "reverted") return { ok: false, reason: PAYOUT_ETH_REJECTED };
  return { ok: false, reason: PAYOUT_ETH_UNVERIFIED };
}

export function classifyProbeFailure(message: string): "reverted" | "unavailable" {
  return message.toLowerCase().includes("revert") ? "reverted" : "unavailable";
}
