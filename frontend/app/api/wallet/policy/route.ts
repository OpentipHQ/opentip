import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { z } from "zod";
import { spentTodayUsd, DEFAULT_POLICY } from "@/lib/policy";

export const dynamic = "force-dynamic";

const recipientSchema = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, "invalid address"),
  label: z.string().max(32).optional(),
});

const policySchema = z.object({
  pauseAll: z.boolean(),
  allowArbitraryCalls: z.boolean(),
  dailyLimitUsd: z.number().min(0).max(1000000),
  dailyLimitEnabled: z.boolean(),
  perTxLimitUsd: z.number().min(0).max(1000000),
  perTxLimitEnabled: z.boolean(),
  permittedRecipientsEnabled: z.boolean(),
  permittedRecipients: z.array(recipientSchema).max(50),
});

function serialize(row: any) {
  return {
    pauseAll: !!row.pauseAll,
    allowArbitraryCalls: row.allowArbitraryCalls !== false,
    dailyLimitUsd: Number(row.dailyLimitUsd ?? DEFAULT_POLICY.dailyLimitUsd),
    dailyLimitEnabled: row.dailyLimitEnabled !== false,
    perTxLimitUsd: Number(row.perTxLimitUsd ?? DEFAULT_POLICY.perTxLimitUsd),
    perTxLimitEnabled: row.perTxLimitEnabled !== false,
    permittedRecipientsEnabled: !!row.permittedRecipientsEnabled,
    permittedRecipients: Array.isArray(row.permittedRecipients) ? row.permittedRecipients : [],
    walletAddress: row.walletAddress || null,
    updatedAt: row.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  try { rateLimit(rateLimitKey(req, "wallet-policy"), "read"); } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 429, headers: { "Retry-After": String(e.retryAfter) } });
  }
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

  const [row, spent] = await Promise.all([
    prisma.userPolicy.findUnique({ where: { userId } }).catch(() => null),
    spentTodayUsd(userId).catch(() => 0),
  ]);
  return NextResponse.json({
    policy: row ? serialize(row) : { ...DEFAULT_POLICY, updatedAt: null },
    spentTodayUsd: spent,
  });
}

export async function PUT(req: NextRequest) {
  try { rateLimit(rateLimitKey(req, "wallet-policy"), "write"); } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 429, headers: { "Retry-After": String(e.retryAfter) } });
  }
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const parsed = policySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "invalid policy" }, { status: 400 });
  }
  const p = parsed.data;
  const recipients = p.permittedRecipients.map((r) => ({
    address: r.address.toLowerCase(),
    ...(r.label ? { label: r.label } : {}),
  }));

  const row = await prisma.userPolicy.upsert({
    where: { userId },
    create: {
      userId,
      pauseAll: p.pauseAll,
      allowArbitraryCalls: p.allowArbitraryCalls,
      dailyLimitUsd: p.dailyLimitUsd,
      dailyLimitEnabled: p.dailyLimitEnabled,
      perTxLimitUsd: p.perTxLimitUsd,
      perTxLimitEnabled: p.perTxLimitEnabled,
      permittedRecipientsEnabled: p.permittedRecipientsEnabled,
      permittedRecipients: recipients,
    },
    update: {
      pauseAll: p.pauseAll,
      allowArbitraryCalls: p.allowArbitraryCalls,
      dailyLimitUsd: p.dailyLimitUsd,
      dailyLimitEnabled: p.dailyLimitEnabled,
      perTxLimitUsd: p.perTxLimitUsd,
      perTxLimitEnabled: p.perTxLimitEnabled,
      permittedRecipientsEnabled: p.permittedRecipientsEnabled,
      permittedRecipients: recipients,
    },
  });
  const spent = await spentTodayUsd(userId).catch(() => 0);
  return NextResponse.json({ ok: true, policy: serialize(row), spentTodayUsd: spent });
}
