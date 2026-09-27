import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWebPush } from "@/lib/vapid";

export async function POST() {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  const sub = await prisma.notificationSubscription.findFirst({
    where: { userId },
  });
  if (!sub) return NextResponse.json({ error: "not subscribed" }, { status: 400 });

  const payload = { title: "Opentip Test", body: "Push notifications are working!", url: "/" };
  try {
    await sendWebPush(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256Key, auth: sub.auth } },
      payload,
    );
    await prisma.notification.create({
      data: { userId, type: "test", title: payload.title, body: payload.body, status: "sent" },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    await prisma.notification.create({
      data: { userId, type: "test", title: payload.title, body: payload.body, status: "failed", txHash: e?.message },
    });
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
