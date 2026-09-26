import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { z } from "zod";
import { evaluatePolicy, type CallInput } from "@/lib/policy";

export const dynamic = "force-dynamic";

const callSchema = z.object({
  to: z.string().regex(/^0x[0-9a-fA-F]{40}$/, "invalid destination"),
  value: z.string().max(100).optional(),
  data: z
    .string()
    .regex(/^0x([0-9a-fA-F]*)$/, "invalid calldata")
    .max(20000)
    .optional(),
});

const checkSchema = z.object({
  calls: z.array(callSchema).min(1).max(20),
});

// Authoritative policy gate for Smart Wallet signing. useOpentipSend calls
// this before sendUserOperation. Always 200 with { allowed, reason? } so the
// client has a single success path (a throw here would be ambiguous).
export async function POST(req: NextRequest) {
  try { rateLimit(rateLimitKey(req, "wallet-policy-check"), "write"); } catch (e: any) {
    return NextResponse.json({ allowed: false, reason: "Too many checks — try again shortly." }, { status: 200 });
  }
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ allowed: false, reason: "Not signed in." }, { status: 200 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ allowed: false, reason: "Invalid request." }, { status: 200 });
  }
  const parsed = checkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ allowed: false, reason: "Invalid calls." }, { status: 200 });
  }
  try {
    const result = await evaluatePolicy(
      userId,
      parsed.data.calls as CallInput[]
    );
    return NextResponse.json(result);
  } catch (e) {
    console.error("policy check failed", e);
    // Fail closed: an unevaluable request does not sign.
    return NextResponse.json({ allowed: false, reason: "Could not evaluate policy — try again." }, { status: 200 });
  }
}
