import { decodeFunctionData } from "viem";
import { prisma } from "@/lib/prisma";
import { CONTRACT_ADDRESS, USDC_ADDRESS, OAR_ADDRESS, ETH_ADDRESS } from "@/lib/chain";
import { opentipV2Abi, erc20Abi } from "@/lib/contract";
import { getTokenPrices } from "@/lib/prices";
import { addPricedSpend, emptyTally, type UsdTally } from "@/lib/spend-usd";

export interface PolicyState {
  pauseAll: boolean;
  allowArbitraryCalls: boolean;
  dailyLimitUsd: number;
  dailyLimitEnabled: boolean;
  perTxLimitUsd: number;
  perTxLimitEnabled: boolean;
  permittedRecipientsEnabled: boolean;
  permittedRecipients: { address: string; label?: string }[];
  walletAddress: string | null;
}

export const DEFAULT_POLICY: PolicyState = {
  pauseAll: false,
  allowArbitraryCalls: true,
  dailyLimitUsd: 1000,
  dailyLimitEnabled: true,
  perTxLimitUsd: 500,
  perTxLimitEnabled: true,
  permittedRecipientsEnabled: false,
  permittedRecipients: [],
  walletAddress: null,
};

// Contracts the Smart Wallet may always talk to when arbitrary calls are OFF.
function allowlistedTargets(): Set<string> {
  const addrs = [CONTRACT_ADDRESS, USDC_ADDRESS, OAR_ADDRESS].filter(Boolean) as string[];
  return new Set(addrs.map((a) => a.toLowerCase()));
}

export async function getPolicy(userId: string): Promise<PolicyState> {
  const row: any = await prisma.userPolicy.findUnique({ where: { userId } }).catch(() => null);
  if (!row) return { ...DEFAULT_POLICY };
  let recipients: PolicyState["permittedRecipients"] = [];
  try {
    const raw = Array.isArray(row.permittedRecipients) ? row.permittedRecipients : [];
    recipients = raw
      .filter((r: any) => r && typeof r.address === "string" && /^0x[0-9a-fA-F]{40}$/.test(r.address))
      .slice(0, 50)
      .map((r: any) => ({ address: r.address.toLowerCase(), label: typeof r.label === "string" ? r.label.slice(0, 32) : undefined }));
  } catch {}
  return {
    pauseAll: !!row.pauseAll,
    allowArbitraryCalls: row.allowArbitraryCalls !== false,
    dailyLimitUsd: Number(row.dailyLimitUsd ?? 1000),
    dailyLimitEnabled: row.dailyLimitEnabled !== false,
    perTxLimitUsd: Number(row.perTxLimitUsd ?? 500),
    perTxLimitEnabled: row.perTxLimitEnabled !== false,
    permittedRecipientsEnabled: !!row.permittedRecipientsEnabled,
    permittedRecipients: recipients,
    walletAddress: row.walletAddress || null,
  };
}

export interface CallInput {
  to: string;
  value?: string;
  data?: string;
}

export interface DerivedSpend {
  token: string | null;
  raw: string;
}

// Server-derived spend per call — never trusts client-provided amounts.
export function deriveSpends(calls: CallInput[]): DerivedSpend[] {
  const contract = (CONTRACT_ADDRESS || "").toLowerCase();
  return calls.map((c) => {
    const to = (c.to || "").toLowerCase();
    const value = (() => {
      try {
        return BigInt(c.value ?? "0").toString();
      } catch {
        return "0";
      }
    })();
    const data = typeof c.data === "string" ? c.data : "0x";
    // 1. Plain ETH movement (incl. receiveTipEth-style value calls)
    if (to === contract) {
      try {
        const decoded: any = decodeFunctionData({ abi: opentipV2Abi, data: data as `0x${string}` });
        if (decoded.functionName === "receiveTip") {
          const [, token, amount] = decoded.args as [string, string, bigint];
          return { token: String(token), raw: BigInt(amount).toString() };
        }
        // receiveTipEth / claimAll / registerRepo / updatePayoutAddress:
        // value, if any, is ETH. Claims/registers move no user funds.
        if (value !== "0") return { token: ETH_ADDRESS, raw: value };
        return { token: null, raw: "0" };
      } catch {
        if (value !== "0") return { token: ETH_ADDRESS, raw: value };
        return { token: null, raw: "0" };
      }
    }
    // 2. Token contract calls — decode transfer destination/amount
    try {
      const decoded: any = decodeFunctionData({ abi: erc20Abi, data: data as `0x${string}` });
      if (decoded.functionName === "transfer") {
        const [, amount] = decoded.args as [string, bigint];
        return { token: to, raw: BigInt(amount).toString() };
      }
      // approve and anything else moves no funds by itself
      return { token: null, raw: "0" };
    } catch {
      // 3. Unknown calldata: only native value (if any) can be priced
      if (value !== "0") return { token: ETH_ADDRESS, raw: value };
      return { token: null, raw: "0" };
    }
  });
}

// All effective destinations: call targets + decoded ERC-20 transfer/approve parties.
export function destinationsOf(calls: CallInput[]): string[] {
  const out = new Set<string>();
  for (const c of calls) {
    const to = (c.to || "").toLowerCase();
    if (/^0x[0-9a-f]{40}$/.test(to)) out.add(to);
    const data = typeof c.data === "string" ? c.data : "0x";
    if (data && data !== "0x") {
      try {
        const decoded: any = decodeFunctionData({ abi: erc20Abi, data: data as `0x${string}` });
        if (decoded.functionName === "transfer") {
          const [dest] = decoded.args as [string, bigint];
          if (/^0x[0-9a-fA-F]{40}$/.test(dest)) out.add(dest.toLowerCase());
        } else if (decoded.functionName === "approve") {
          const [spender] = decoded.args as [string, bigint];
          if (/^0x[0-9a-fA-F]{40}$/.test(spender)) out.add(spender.toLowerCase());
        }
      } catch {}
    }
  }
  return [...out];
}

// USD value of derived spends. A token with no positive price is unpriced,
// never $0, so a spending cap cannot be bypassed by an unknown asset.
export async function spendsUsd(spends: DerivedSpend[]): Promise<UsdTally> {
  const prices = await getTokenPrices().catch(() => ({} as Record<string, number>));
  return spends.reduce((tally, s) => addPricedSpend(tally, s.raw, s.token, prices), emptyTally());
}

// Rolling-24h outbound USD across the user's linked wallets (pending +
// confirmed — conservative: a stuck userOp still counts until replaced).
export async function spentTodayTally(userId: string): Promise<UsdTally> {
  const wallets = await prisma.userWallet
    .findMany({ where: { userId }, select: { address: true } })
    .catch(() => []);
  const addrs = wallets.map((w: any) => String(w.address).toLowerCase());
  if (addrs.length === 0) return emptyTally();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows: any[] = await prisma.walletTx
    .findMany({ where: { wallet: { in: addrs }, kind: { in: ["send", "tip"] }, createdAt: { gt: since } } })
    .catch(() => []);
  if (rows.length === 0) return emptyTally();
  const prices = await getTokenPrices().catch(() => ({} as Record<string, number>));
  return rows.reduce((tally, r) => {
    if (!r.token || !r.amount) return tally;
    return addPricedSpend(tally, String(r.amount), String(r.token), prices);
  }, emptyTally());
}

export async function spentTodayUsd(userId: string): Promise<number> {
  return (await spentTodayTally(userId)).usd;
}

export interface CheckResult {
  allowed: boolean;
  reason?: string;
}

// Authoritative evaluation. Returns a reason when blocked.
export async function evaluatePolicy(userId: string, calls: CallInput[]): Promise<CheckResult> {
  const policy = await getPolicy(userId);
  if (policy.pauseAll) {
    return { allowed: false, reason: "All transactions are paused. Turn off Pause to continue." };
  }
  for (const c of calls) {
    if (!c.to || !/^0x[0-9a-fA-F]{40}$/.test(c.to)) {
      return { allowed: false, reason: "Invalid destination address." };
    }
  }
  if (!policy.allowArbitraryCalls) {
    const allowed = allowlistedTargets();
    for (const c of calls) {
      if (!allowed.has(c.to.toLowerCase())) {
        return {
          allowed: false,
          reason: `Arbitrary contract calls are off. ${c.to.slice(0, 6)}…${c.to.slice(-4)} is not an approved contract.`,
        };
      }
    }
  }
  if (policy.permittedRecipientsEnabled) {
    const list = new Set(policy.permittedRecipients.map((r) => r.address.toLowerCase()));
    for (const dest of destinationsOf(calls)) {
      if (!list.has(dest)) {
        return {
          allowed: false,
          reason: `Recipient ${dest.slice(0, 6)}…${dest.slice(-4)} is not on your permitted list.`,
        };
      }
    }
  }
  const needsUsd = policy.perTxLimitEnabled || policy.dailyLimitEnabled;
  if (needsUsd) {
    const op = await spendsUsd(deriveSpends(calls));
    if (op.unpriced) {
      return {
        allowed: false,
        reason: "This transaction includes a token with no USD price, so it can't be checked against your spending limits.",
      };
    }
    if (policy.perTxLimitEnabled && op.usd > policy.perTxLimitUsd) {
      return {
        allowed: false,
        reason: `This transaction (~$${op.usd.toFixed(2)}) exceeds your per-transaction limit of $${policy.perTxLimitUsd.toFixed(2)}.`,
      };
    }
    if (policy.dailyLimitEnabled) {
      const spent = await spentTodayTally(userId);
      if (spent.unpriced) {
        return {
          allowed: false,
          reason: "Recent wallet activity includes a token with no USD price, so your daily limit can't be checked. This transaction is blocked.",
        };
      }
      if (spent.usd + op.usd > policy.dailyLimitUsd) {
        return {
          allowed: false,
          reason: `Daily limit exceeded (spent $${spent.usd.toFixed(2)} of $${policy.dailyLimitUsd.toFixed(2)} in the last 24h).`,
        };
      }
    }
  }
  return { allowed: true };
}
