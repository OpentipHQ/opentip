import { createPublicClient, decodeEventLog, http, type Hex } from "viem";
import { prisma } from "@/lib/prisma";
import { CONTRACT_ADDRESS, RPC_URL, VIEM_CHAIN, getTokenDecimals, getTokenSymbol, capitalize } from "@/lib/chain";
import { opentipV2Abi } from "@/lib/contract";

export type ReceiptLeg = {
  token: string;
  symbol: string;
  decimals: number;
  /** Gross funded amount, or the amount transferred on a claim. Base units. */
  amount: string;
  /** Fee taken on this leg. Zero on a claim, which transfers the net balance. */
  fee: string;
  maintainer: string;
};

export type LoadedReceipt = {
  status: "ready" | "pending" | "unknown" | "unrelated";
  kind?: "fund" | "claim";
  hash: string;
  /** On-chain transaction hash when it differs from the URL (user operation hash). */
  canonicalHash?: string;
  repoId?: string;
  project?: string;
  from?: string;
  timestamp?: string;
  legs: ReceiptLeg[];
  note?: string;
};

const HASH_RE = /^0x[0-9a-fA-F]{64}$/;

function projectOf(repoId: string) {
  return capitalize(repoId.split("/").pop() || repoId);
}

function toBig(value: { toString(): string } | string | bigint): bigint {
  if (typeof value === "bigint") return value;
  const whole = String(value).split(".")[0]?.replace(/[^0-9-]/g, "") || "0";
  try {
    return BigInt(whole);
  } catch {
    return 0n;
  }
}

function leg(token: string, amount: bigint, fee: bigint): ReceiptLeg {
  const maintainer = amount > fee ? amount - fee : 0n;
  const normalized = token.toLowerCase();
  return {
    token: normalized,
    symbol: getTokenSymbol(normalized),
    decimals: getTokenDecimals(normalized),
    amount: amount.toString(),
    fee: fee.toString(),
    maintainer: maintainer.toString(),
  };
}

function ready(hash: string, kind: "fund" | "claim", repoId: string, from: string, timestamp: Date, legs: ReceiptLeg[]): LoadedReceipt {
  return {
    status: "ready",
    kind,
    hash,
    repoId,
    project: projectOf(repoId),
    from,
    timestamp: timestamp.toISOString(),
    legs,
  };
}

async function fromDatabase(hash: string): Promise<LoadedReceipt | null> {
  const where = { equals: hash, mode: "insensitive" as const };
  const [tips, claims] = await Promise.all([
    prisma.tip.findMany({ where: { tx_hash: where }, orderBy: { timestamp: "asc" } }),
    prisma.claim.findMany({ where: { tx_hash: where }, orderBy: { timestamp: "asc" } }),
  ]);
  if (tips.length > 0) {
    const first = tips[0];
    return ready(
      hash,
      "fund",
      first.repo_id,
      first.tipper_address,
      first.timestamp,
      tips.map((tip) => leg(tip.token, toBig(tip.amount), toBig(tip.fee_amount))),
    );
  }
  if (claims.length > 0) {
    const first = claims[0];
    return ready(
      hash,
      "claim",
      first.repo_id,
      first.payout_address,
      first.timestamp,
      claims.map((claim) => {
        const amount = toBig(claim.amount);
        return leg(claim.token, amount, 0n);
      }),
    );
  }
  return null;
}

async function fromChain(hash: Hex): Promise<LoadedReceipt | null> {
  if (!RPC_URL) return null;
  const client = createPublicClient({ chain: VIEM_CHAIN, transport: http(RPC_URL) });
  let tx: Awaited<ReturnType<typeof client.getTransaction>> | null = null;
  try {
    tx = await client.getTransaction({ hash });
  } catch {
    tx = null;
  }
  if (!tx) return null;

  let mined: Awaited<ReturnType<typeof client.getTransactionReceipt>> | null = null;
  try {
    mined = await client.getTransactionReceipt({ hash });
  } catch {
    mined = null;
  }
  if (!mined) {
    return {
      status: "pending",
      hash,
      from: tx.from,
      legs: [],
      note: "This transaction is not confirmed yet.",
    };
  }

  const contract = CONTRACT_ADDRESS?.toLowerCase();
  const funds: ReceiptLeg[] = [];
  const claims: ReceiptLeg[] = [];
  let repoId = "";
  let from: string = tx.from;
  let timestampSec = 0;
  let kind: "fund" | "claim" | null = null;

  for (const log of mined.logs) {
    if (contract && log.address.toLowerCase() !== contract) continue;
    try {
      const decoded = decodeEventLog({ abi: opentipV2Abi, data: log.data, topics: log.topics });
      if (decoded.eventName === "TipReceived") {
        const args = decoded.args as { tipper: string; repoId: string; token: string; amount: bigint; feeAmount: bigint; timestamp: bigint };
        kind = kind ?? "fund";
        repoId = repoId || args.repoId;
        from = args.tipper;
        timestampSec = Number(args.timestamp);
        funds.push(leg(args.token, args.amount, args.feeAmount));
      } else if (decoded.eventName === "Claimed") {
        const args = decoded.args as { repoId: string; payoutAddress: string; token: string; amount: bigint; timestamp: bigint };
        if (kind !== "fund") kind = "claim";
        repoId = repoId || args.repoId;
        if (kind === "claim") from = args.payoutAddress;
        timestampSec = Number(args.timestamp);
        claims.push(leg(args.token, args.amount, 0n));
      }
    } catch {
      // Not an Opentip event.
    }
  }

  if (!kind || !repoId) {
    return {
      status: mined.status === "reverted" ? "unrelated" : "unrelated",
      hash,
      from: tx.from,
      legs: [],
      note: mined.status === "reverted"
        ? "This transaction reverted. Nothing was funded or claimed."
        : "This transaction is not an Opentip funding or claim.",
    };
  }

  const when = timestampSec > 0 ? new Date(timestampSec * 1000) : new Date();
  return ready(hash, kind, repoId, from, when, kind === "fund" ? funds : claims);
}

async function fromWalletLog(hash: string): Promise<LoadedReceipt | null> {
  if (!HASH_RE.test(hash)) return null;
  const row = await prisma.walletTx.findFirst({
    where: {
      OR: [
        { tx_hash: { equals: hash, mode: "insensitive" } },
        { user_op_hash: { equals: hash, mode: "insensitive" } },
      ],
    },
  });
  if (!row) return null;
  if (row.tx_hash && row.tx_hash.toLowerCase() !== hash.toLowerCase()) {
    return { status: "pending", hash, canonicalHash: row.tx_hash, legs: [], note: "Resolved to the on-chain transaction." };
  }
  if (row.kind !== "tip" && row.kind !== "claim") {
    return {
      status: "unrelated",
      hash,
      repoId: row.repo_id ?? undefined,
      project: row.repo_id ? projectOf(row.repo_id) : undefined,
      legs: [],
      note: "This transaction is not an Opentip funding or claim.",
    };
  }
  const legs: ReceiptLeg[] = [];
  if (row.token && row.amount && /^\d+$/.test(row.amount)) {
    const amount = BigInt(row.amount);
    legs.push(leg(row.token, amount, 0n));
  }
  return {
    status: row.status === "confirmed" && row.tx_hash ? "pending" : "pending",
    kind: row.kind === "claim" ? "claim" : "fund",
    hash,
    repoId: row.repo_id ?? undefined,
    project: row.repo_id ? projectOf(row.repo_id) : undefined,
    from: row.wallet,
    timestamp: row.createdAt.toISOString(),
    legs,
    note: "Waiting for confirmation. Amounts update from the chain once the transaction is indexed.",
  };
}

export async function loadReceipt(rawHash: string): Promise<LoadedReceipt> {
  const hash = decodeURIComponent(rawHash).trim();
  if (!hash.startsWith("0x") || hash.length < 4 || hash.length > 80) {
    return { status: "unknown", hash, legs: [], note: "That is not a transaction hash." };
  }
  try {
    const indexed = await fromDatabase(hash);
    if (indexed) return indexed;
    if (HASH_RE.test(hash)) {
      const chained = await fromChain(hash as Hex);
      if (chained) return chained;
    }
    const logged = await fromWalletLog(hash);
    if (logged) {
      if (logged.canonicalHash) {
        const indexedCanonical = await fromDatabase(logged.canonicalHash);
        if (indexedCanonical) return { ...indexedCanonical, hash: logged.canonicalHash, canonicalHash: logged.canonicalHash };
        if (HASH_RE.test(logged.canonicalHash)) {
          const chained = await fromChain(logged.canonicalHash as Hex);
          if (chained && chained.status === "ready") return { ...chained, canonicalHash: logged.canonicalHash };
        }
      }
      return logged;
    }
    return { status: "unknown", hash, legs: [], note: "No funding or claim was found for this hash." };
  } catch {
    return { status: "unknown", hash, legs: [], note: "The receipt could not be loaded. Try again in a moment." };
  }
}
