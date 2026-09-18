import { NextRequest } from "next/server";
import { handleAdminRequest, auditLog } from "@/lib/admin-api";
import { createPublicClient, http, parseUnits } from "viem";
import { getOwnerWallet } from "@/lib/admin-wallet";
import { opentipV2Abi } from "@/lib/contract";
import { VIEM_CHAIN, CONTRACT_ADDRESS, TOKEN_CONFIG, ETH_ADDRESS, getTokenDecimals } from "@/lib/chain";

export async function POST(req: NextRequest) {
  return handleAdminRequest(req, "critical", async (admin) => {
    if (!CONTRACT_ADDRESS) throw new Error("contract not configured");

    const client = createPublicClient({ chain: VIEM_CHAIN, transport: http() });
    const wallet = getOwnerWallet();
    const tokenAddrs = [ETH_ADDRESS, ...Object.keys(TOKEN_CONFIG).filter(a => a !== ETH_ADDRESS)] as `0x${string}`[];

    const results: { token: string; amount: string; txHash: string }[] = [];

    for (const addr of tokenAddrs) {
      const bal = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: opentipV2Abi,
        functionName: "treasuryBalances",
        args: [addr],
      });

      if (bal > 0n) {
        const hash = await wallet.writeContract({
          address: CONTRACT_ADDRESS,
          abi: opentipV2Abi,
          functionName: "withdrawTreasury",
          args: [addr, bal],
        });

        const decimals = getTokenDecimals(addr);
        const amount = (Number(bal) / 10 ** decimals).toFixed(decimals === 6 ? 2 : 6);
        results.push({ token: addr, amount, txHash: hash });
      }
    }

    await auditLog(admin.address, "withdraw_all", { tokens: results.map(r => r.token) }, results[0]?.txHash);
    return { ok: true, results };
  });
}
