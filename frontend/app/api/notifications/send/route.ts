import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWebPush } from "@/lib/vapid";

export async function POST(request: Request) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid body" }, { status: 400 }); }
  const { userId, type, title, body: msgBody, txHash, url } = body;
  if (!userId || !type || !title) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const sub = await prisma.notificationSubscription.findFirst({ where: { userId } });
  if (!sub || !sub.endpoint) {
    await prisma.notification.create({
      data: { userId, type, title, body: msgBody || "", status: "pending", txHash },
    });
    return NextResponse.json({ queued: true });
  }

  const payload = { title, body: msgBody || "", url: url || "/" };
  try {
    await sendWebPush(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256Key, auth: sub.auth } },
      payload,
    );
    await prisma.notification.create({
      data: { userId, type, title, body: msgBody || "", status: "sent", txHash },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    await prisma.notification.create({
      data: { userId, type, title, body: msgBody || "", status: "failed", txHash },
    });
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
