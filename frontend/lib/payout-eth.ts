import { createPublicClient, http } from "viem";
import { CONTRACT_ADDRESS, RPC_URL, VIEM_CHAIN } from "./chain";

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

// EOA addresses can receive ETH. Contracts are probed with a 1-wei call from
// the Opentip contract (state override supplies the balance) so a recipient
// that reverts cannot be registered as the payout address.
export async function checkPayoutCanReceiveEth(
  address: `0x${string}`,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!RPC_URL) return { ok: false, reason: PAYOUT_ETH_UNVERIFIED };
  const client = createPublicClient({ chain: VIEM_CHAIN, transport: http(RPC_URL) });
  let bytecode: string | undefined;
  try {
    bytecode = await client.getBytecode({ address });
  } catch {
    return { ok: false, reason: PAYOUT_ETH_UNVERIFIED };
  }
  if (!bytecode || bytecode === "0x") return { ok: true };

  const sender = (CONTRACT_ADDRESS ?? "0x0000000000000000000000000000000000000001") as `0x${string}`;
  try {
    await client.call({
      account: sender,
      to: address,
      value: 1n,
      data: "0x",
      stateOverride: [{ address: sender, balance: 10n ** 18n }],
    });
    return interpretEthReceiveProbe({ bytecode, probe: "success" });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e ?? "");
    return interpretEthReceiveProbe({ bytecode, probe: classifyProbeFailure(message) });
  }
}
