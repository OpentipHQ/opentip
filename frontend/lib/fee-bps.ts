import { createPublicClient, http } from "viem";
import { CONTRACT_ADDRESS, RPC_URL, VIEM_CHAIN } from "@/lib/chain";
import { opentipV2Abi } from "@/lib/contract";

/** Live platform fee in basis points. Null when the chain read does not answer. */
export async function readFeeBps(): Promise<number | null> {
  if (!CONTRACT_ADDRESS || !RPC_URL) return null;
  try {
    const client = createPublicClient({
      chain: VIEM_CHAIN,
      transport: http(RPC_URL, { timeout: 2500 }),
    });
    const fee = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: opentipV2Abi,
      functionName: "feeBps",
    });
    const n = Number(fee);
    if (!Number.isFinite(n) || n < 0 || n > 10000) return null;
    return n;
  } catch {
    return null;
  }
}

export function bpsLabel(bps: number) {
  const n = bps / 100;
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}
