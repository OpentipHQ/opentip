import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  SPONSOR_CAP_PER_DAY,
  isPaymasterHealthy,
  sponsoredToday,
} from "@/lib/paymaster";

// Single source of truth for "will my next action be sponsored?" —
// consumed by the Send review Gas row, the wallet gas meter, and send().
// Sponsored unless the user hit the daily cap or the circuit breaker
// tripped (CDP exposes no credits-balance API, so consecutive-failure
// detection is the honest health signal).
export async function GET() {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }
  const userId = session.user.id as string;
  const usedToday = await sponsoredToday(userId);
  const healthy = isPaymasterHealthy();
  const capped = usedToday >= SPONSOR_CAP_PER_DAY;

  return NextResponse.json({
    sponsored: !capped && healthy,
    usedToday,
    cap: SPONSOR_CAP_PER_DAY,
    reason: capped ? "daily-limit" : healthy ? null : "paymaster-unhealthy",
  });
}
