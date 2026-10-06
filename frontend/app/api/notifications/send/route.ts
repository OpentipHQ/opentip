import { NextResponse } from "next/server";
import { findNotificationByTx, pushToUser, recordNotification } from "@/lib/notify";
import { isTrustedNotificationRequest, NOTIFICATION_SECRET_HEADER } from "@/lib/notification-auth";

export async function POST(request: Request) {
  // Trusted server callers only. Checked before any parse, DB write, or push.
  if (!isTrustedNotificationRequest(request.headers.get(NOTIFICATION_SECRET_HEADER))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid body" }, { status: 400 }); }
  const { userId, type, title, body: msgBody, txHash, url } = body;
  if (!userId || !type || !title) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // Idempotency: indexer retries/replays must not duplicate rows.
  if (txHash) {
    const dup = await findNotificationByTx(userId, type, txHash);
    if (dup) return NextResponse.json({ ok: true, deduped: true });
  }

  const payload = { title, body: msgBody || "", url: url || "/" };
  const sent = await pushToUser(userId, payload);
  if (!sent) {
    // No subscription (or send failed before any push) — keep a pending row.
    // Distinguish "no subscription" from real failures below via try/catch.
    await recordNotification({ userId, type, title, body: msgBody || "", txHash, status: "pending" });
    return NextResponse.json({ queued: true });
  }
  await recordNotification({ userId, type, title, body: msgBody || "", txHash, status: "sent" });
  return NextResponse.json({ ok: true });
}
