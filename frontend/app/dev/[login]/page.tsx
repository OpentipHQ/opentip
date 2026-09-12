import { notFound } from "next/navigation";
import { createPublicClient, http } from "viem";
import { baseSepolia, base } from "viem/chains";
import { opentipAbi, getContractAddress } from "@/lib/contract";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";

const chain = process.env.NEXT_PUBLIC_CHAIN === "base" ? base : baseSepolia;
const rpcUrl = process.env.NEXT_PUBLIC_CHAIN === "base"
  ? "https://mainnet.base.org"
  : "https://sepolia.base.org";

const client = createPublicClient({ chain, transport: http(rpcUrl) });

async function fetchContributions(login: string) {
  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${login}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.contributions || [];
  } catch {
    return [];
  }
}

export default async function DevProfilePage({
  params,
}: {
  params: Promise<{ login: string }>;
}) {
  const { login } = await params;

  const user = await prisma.user.findUnique({
    where: { login },
    select: {
      id: true,
      login: true,
      name: true,
      image: true,
      pfp: true,
      header: true,
      wallets: {
        select: { address: true },
      },
    },
  });

  if (!user) notFound();

  let profile = null;
  try {
    profile = await prisma.developerProfile.findUnique({
      where: { userId: user.id },
      select: {
        bio: true,
        website: true,
        twitter: true,
        discord: true,
        telegram: true,
        farcaster: true,
        github: true,
      },
    });
  } catch {
    // profile table may not exist yet
  }

  const walletAddresses = user.wallets.map((w) => w.address);

  const repos = walletAddresses.length > 0
    ? await prisma.repo.findMany({
        where: { payout_address: { in: walletAddresses } },
        select: {
          repo_id: true,
          registered_at: true,
        },
      })
    : [];

  const repoIds = repos.map((r) => r.repo_id);
  const tips = repoIds.length > 0
    ? await prisma.tip.groupBy({
        by: ["repo_id"],
        where: { repo_id: { in: repoIds } },
        _sum: { usdc_amount: true },
        _count: true,
      })
    : [];

  const tipMap = new Map(
    tips.map((t) => [t.repo_id, {
      total: t._sum.usdc_amount?.toString() ?? "0",
      count: t._count,
    }])
  );

  const contractAddress = getContractAddress();

  let totalTippedOnChain = 0n;
  let totalPendingOnChain = 0n;
  let feeBps = 500n;

  if (contractAddress && repos.length > 0) {
    const calls = repos.flatMap((r) => [
      { address: contractAddress, abi: opentipAbi, functionName: "getTotalTipped" as const, args: [r.repo_id] },
      { address: contractAddress, abi: opentipAbi, functionName: "getPendingBalance" as const, args: [r.repo_id] },
    ]);
    calls.push({ address: contractAddress, abi: opentipAbi, functionName: "getFeeBps" as const, args: [] });

    const results = await client.multicall({ contracts: calls });

    for (let i = 0; i < repos.length; i++) {
      const totalResult = results[i * 2];
      const pendingResult = results[i * 2 + 1];
      if (totalResult.status === "success") totalTippedOnChain += totalResult.result as bigint;
      if (pendingResult.status === "success") totalPendingOnChain += pendingResult.result as bigint;
    }
    const feeResult = results[repos.length * 2];
    if (feeResult.status === "success") feeBps = feeResult.result as bigint;
  }

  // Developer's share = 95% of totalTipped minus what's still pending
  const developerShare = totalTippedOnChain * (10000n - feeBps) / 10000n;
  const totalClaimed = developerShare > totalPendingOnChain ? developerShare - totalPendingOnChain : 0n;

  const enrichedRepos = repos.map((r) => ({
    repo_id: r.repo_id,
    total_tipped: tipMap.get(r.repo_id)?.total ?? "0",
    tip_count: tipMap.get(r.repo_id)?.count ?? 0,
  }));

  const totalTippedFromDb = enrichedRepos.reduce(
    (sum, r) => sum + Number(r.total_tipped) / 1e6,
    0
  );
  const totalTips = enrichedRepos.reduce((sum, r) => sum + r.tip_count, 0);

  const contributions = await fetchContributions(login);

  const profileData = {
    login: user.login,
    name: user.name,
    image: user.image,
    pfp: user.pfp,
    header: user.header,
    bio: profile?.bio ?? null,
    social: {
      website: profile?.website ?? null,
      twitter: profile?.twitter ?? null,
      discord: profile?.discord ?? null,
      telegram: profile?.telegram ?? null,
      farcaster: profile?.farcaster ?? null,
      github: profile?.github ?? user.login,
    },
    repos: enrichedRepos,
    stats: {
      total_tipped: totalTippedFromDb.toFixed(2),
      total_tips: totalTips,
      tips_claimed: Number(totalClaimed) / 1e6,
      repo_count: enrichedRepos.length,
    },
  };

  return <ProfileClient data={profileData} contributions={contributions} />;
}
