import "dotenv/config";
import { createPublicClient, http, parseAbi } from "viem";
import { base, baseSepolia } from "viem/chains";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["warn", "error"] });

const abi = parseAbi([
  "event RepoRegistered(string repoId, address indexed payoutAddress, uint256 timestamp)",
  "event PayoutAddressUpdated(string repoId, address oldAddress, address indexed newAddress)",
  "event TipReceived(address indexed tipper, string repoId, uint256 usdcAmount, uint256 feeAmount, uint256 timestamp)",
  "event Claimed(string repoId, address indexed payoutAddress, uint256 amount, uint256 timestamp)",
  "event TreasuryWithdrawn(address indexed to, uint256 amount, uint256 timestamp)",
]);

const chain = process.env.NEXT_PUBLIC_CHAIN === "base" ? base : baseSepolia;
const rpcUrl = process.env.RPC_URL || (chain.id === 8453 ? "https://mainnet.base.org" : "https://sepolia.base.org");
const contractAddress = process.env.CONTRACT_ADDRESS as `0x${string}`;
const pollMs = Number(process.env.POLL_MS || 12000);
const startBlockEnv = process.env.START_BLOCK ? BigInt(process.env.START_BLOCK) : undefined;

if (!contractAddress) throw new Error("CONTRACT_ADDRESS env required");

const client = createPublicClient({ chain, transport: http(rpcUrl) });

async function getFromBlock(): Promise<bigint> {
  const state = await prisma.indexerState.findUnique({ where: { id: "singleton" } });
  if (state) return state.last_block + 1n;
  if (startBlockEnv !== undefined) return startBlockEnv;
  // fallback: last 10k blocks
  const latest = await client.getBlockNumber();
  return latest > 10000n ? latest - 10000n : 0n;
}

const MAX_RANGE = 2000n; // Base mainnet RPC limits eth_getLogs to 2k blocks

async function getLogsBatched(fromBlock: bigint, toBlock: bigint) {
  const all: any[] = [];
  let cur = fromBlock;
  while (cur <= toBlock) {
    const end = cur + MAX_RANGE - 1n > toBlock ? toBlock : cur + MAX_RANGE - 1n;
    const chunk = await client.getLogs({
      address: contractAddress,
      events: abi,
      fromBlock: cur,
      toBlock: end,
    });
    all.push(...chunk);
    cur = end + 1n;
  }
  return all;
}

async function withDbRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      const isP1001 = e?.code === "P1001" || String(e?.message || "").includes("Can't reach database server");
      if (isP1001 && i < retries - 1) {
        console.warn(`[indexer] DB unreachable, retry ${i + 1}/${retries} in 2s...`);
        try { await prisma.$disconnect(); } catch {}
        await new Promise((r) => setTimeout(r, 2000));
        try { await prisma.$connect(); } catch {}
        continue;
      }
      throw e;
    }
  }
  throw new Error("unreachable");
}

async function tick() {
  const fromBlock = await withDbRetry(() => getFromBlock());
  const toBlock = await client.getBlockNumber();
  if (fromBlock > toBlock) return;

  const logs = await getLogsBatched(fromBlock, toBlock);

  for (const log of logs) {
    // @ts-ignore viem union
    const eventName = log.eventName as string;
    const args: any = log.args;
    if (eventName === "TipReceived") {
      // deterministic id = tx_hash + logIndex to make replays idempotent (cuid would duplicate on retry after P1001)
      const id = `${log.transactionHash}_${log.logIndex ?? 0}`;
      await withDbRetry(() =>
        prisma.tip.upsert({
          where: { id },
          create: {
            id,
            tipper_address: args.tipper.toLowerCase(),
            repo_id: args.repoId,
            usdc_amount: BigInt(args.usdcAmount.toString()),
            fee_amount: BigInt(args.feeAmount.toString()),
            timestamp: new Date(Number(args.timestamp) * 1000),
            tx_hash: log.transactionHash!,
            block_number: log.blockNumber!,
          },
          update: {},
        })
      );
    } else if (eventName === "RepoRegistered") {
      await withDbRetry(() =>
        prisma.repo.upsert({
          where: { repo_id: args.repoId },
          create: { repo_id: args.repoId, payout_address: args.payoutAddress.toLowerCase(), registered_at: new Date(Number(args.timestamp) * 1000) },
          update: { payout_address: args.payoutAddress.toLowerCase() },
        })
      );
    } else if (eventName === "PayoutAddressUpdated") {
      await withDbRetry(() => prisma.repo.update({ where: { repo_id: args.repoId }, data: { payout_address: args.newAddress.toLowerCase() } }).catch(() => null as any));
    }
    // Claimed / TreasuryWithdrawn only need checkpoint
  }

  await withDbRetry(() =>
    prisma.indexerState.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", last_block: toBlock },
      update: { last_block: toBlock },
    })
  );

  if (logs.length) console.log(`[indexer] ${logs.length} events [${fromBlock}..${toBlock}]`);
}

async function main() {
  console.log(`[indexer] chain ${chain.id} contract ${contractAddress} rpc ${rpcUrl}`);
  // ensure state row exists
  while (true) {
    try { await tick(); } catch (e) { console.error("[indexer] tick error", e); }
    await new Promise((r) => setTimeout(r, pollMs));
  }
}

main();
