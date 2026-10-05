import { prisma } from "@/lib/prisma";

// Gas sponsorship policy (CDP paymaster). One SponsoredTx row per
// sponsored user operation doubles as the daily-cap counter.
export const SPONSOR_CAP_PER_DAY = 10;
const CIRCUIT_TRIP_FAILURES = 5;

// In-memory circuit breaker (accepted pattern — see rate-limit).
// Trips when the CDP paymaster endpoint fails repeatedly; the status
// endpoint reports it so clients show real gas costs instead of
// promising sponsorship we can't deliver.
let consecutiveFailures = 0;

export function recordPaymasterSuccess(): void {
  consecutiveFailures = 0;
}

export function recordPaymasterFailure(): void {
  consecutiveFailures += 1;
}

export function isPaymasterHealthy(): boolean {
  return consecutiveFailures < CIRCUIT_TRIP_FAILURES;
}

export function startOfTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function sponsoredToday(userId: string): Promise<number> {
  return prisma.sponsoredTx.count({
    where: { userId, createdAt: { gte: startOfTodayUTC() } },
  });
}
