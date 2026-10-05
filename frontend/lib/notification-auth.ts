import { createHash, timingSafeEqual } from "node:crypto";

// Shared with the indexer. Requests without this header are rejected.
export const NOTIFICATION_SECRET_HEADER = "x-notification-secret";

// Hash both sides so the comparison is constant-time and independent of length.
export function notificationSecretsMatch(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!provided || !expected) return false;
  const a = createHash("sha256").update(provided, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export function isTrustedNotificationRequest(
  headerValue: string | null,
  secret: string | null | undefined = process.env.NOTIFICATION_SECRET,
): boolean {
  return notificationSecretsMatch(headerValue, secret);
}
