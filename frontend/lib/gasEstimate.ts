import { createPublicClient, formatUnits, http } from "viem";
import { RPC_URL, VIEM_CHAIN } from "./chain";

// Conservative gas-unit budgets per smart-wallet action (Base mainnet).
// Used only for pre-send USD estimates — always labeled approximate.
const GAS_UNITS: Record<string, bigint> = {
  send: 120_000n,
  tip: 250_000n,
  claim: 200_000n,
  register: 150_000n,
};

export async function estimateGasUsd(
  kind: string,
  ethPriceUsd: number,
): Promise<string | null> {
  if (!ethPriceUsd || ethPriceUsd <= 0) return null;
  try {
    const client = createPublicClient({
      chain: VIEM_CHAIN,
      transport: http(RPC_URL || undefined),
    });
    const fees = await client.estimateFeesPerGas();
    const perGas = fees.maxFeePerGas ?? fees.gasPrice;
    if (!perGas) return null;
    const wei = perGas * (GAS_UNITS[kind] ?? 150_000n);
    const usd = Number(formatUnits(wei, 18)) * ethPriceUsd;
    if (!isFinite(usd) || usd < 0) return null;
    return usd < 0.01 ? "<$0.01" : `$${usd.toFixed(2)}`;
  } catch {
    return null;
  }
}
