import { NextRequest } from "next/server";
import { handleAdminRequest } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { createPublicClient, http } from "viem";
import { opentipV2Abi } from "@/lib/contract";
import { VIEM_CHAIN, CONTRACT_ADDRESS, TOKEN_CONFIG, ETH_ADDRESS } from "@/lib/chain";

export async function GET(req: NextRequest) {
  return handleAdminRequest(req, "read", async () => {
    const [totalTipCount, totalRepos, totalUsers, recentTips] = await Promise.all([
      prisma.tip.count(),
      prisma.repo.count(),
      prisma.user.count(),
      prisma.tip.findMany({
        orderBy: { timestamp: "desc" },
        take: 20,
        select: {
          tipper_address: true,
          repo_id: true,
          amount: true,
          token: true,
          fee_amount: true,
          timestamp: true,
          tx_hash: true,
        },
      }),
    ]);

    // Per-token totals from DB
    const tokenRows: any[] = await prisma.$queryRaw`
      SELECT token, SUM(amount)::text as total, SUM(fee_amount)::text as fees
      FROM "Tip"
      GROUP BY token
    `;

    // Per-token treasury balances + contract state from contract
    let treasuryBalances: Record<string, string> = {};
    let strayEth = "0";
    let migrationDeadline = 0;
    if (CONTRACT_ADDRESS) {
      try {
        const client = createPublicClient({ chain: VIEM_CHAIN, transport: http(process.env.RPC_URL || undefined) });
        const tokenAddrs = [ETH_ADDRESS, ...Object.keys(TOKEN_CONFIG).filter(a => a !== ETH_ADDRESS)] as `0x${string}`[];
        for (const addr of tokenAddrs) {
          const bal = await client.readContract({
            address: CONTRACT_ADDRESS,
            abi: opentipV2Abi,
            functionName: "treasuryBalances",
            args: [addr],
          });
          treasuryBalances[addr.toLowerCase()] = bal.toString();
        }
        const [stray, deadline] = await Promise.all([
          client.readContract({ address: CONTRACT_ADDRESS, abi: opentipV2Abi, functionName: "strayEth" }),
          client.readContract({ address: CONTRACT_ADDRESS, abi: opentipV2Abi, functionName: "migrationDeadline" }),
        ]);
        strayEth = stray.toString();
        migrationDeadline = Number(deadline);
      } catch {}
    }

    return {
      totalTipsAmount: tokenRows.reduce((sum, r) => sum + Number(r.total || 0), 0),
      totalFeesAmount: tokenRows.reduce((sum, r) => sum + Number(r.fees || 0), 0),
      totalTipCount,
      totalRepos,
      totalUsers,
      tokenTotals: tokenRows.map((r: any) => ({ token: r.token, total: r.total, fees: r.fees })),
      treasuryBalances,
      strayEth,
      migrationDeadline,
      recentTips: recentTips.map((t) => ({
        ...t,
        amount: Number(t.amount),
        token: t.token,
        fee_amount: Number(t.fee_amount),
      })),
    };
  });
}
