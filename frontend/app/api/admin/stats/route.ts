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

    // Per-token treasury balances + contract state from contract.
    // Each read is independent: one flaky RPC call must not wipe the rest.
    // (Sequential reads under a single try/catch returned partial/empty
    // balances on any hiccup — the overview section flashed then vanished.)
    let treasuryBalances: Record<string, string> = {};
    let strayEth = "0";
    let migrationDeadline = 0;
    if (CONTRACT_ADDRESS) {
      const client = createPublicClient({ chain: VIEM_CHAIN, transport: http(process.env.RPC_URL || undefined) });
      const contract = CONTRACT_ADDRESS as `0x${string}`;
      const tokenAddrs = [ETH_ADDRESS, ...Object.keys(TOKEN_CONFIG).filter(a => a !== ETH_ADDRESS)] as `0x${string}`[];
      const results = await Promise.allSettled([
        ...tokenAddrs.map((addr) =>
          client.readContract({
            address: contract,
            abi: opentipV2Abi,
            functionName: "treasuryBalances",
            args: [addr],
          }).then((bal) => ({ addr, bal: bal.toString() }))
        ),
        client.readContract({ address: contract, abi: opentipV2Abi, functionName: "strayEth" }).then((v) => ({ stray: v.toString() })),
        client.readContract({ address: contract, abi: opentipV2Abi, functionName: "migrationDeadline" }).then((v) => ({ deadline: Number(v) })),
      ]);
      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        const v: any = r.value;
        if (v.addr) treasuryBalances[v.addr.toLowerCase()] = v.bal;
        else if (v.stray !== undefined) strayEth = v.stray;
        else if (v.deadline !== undefined) migrationDeadline = v.deadline;
      }
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
