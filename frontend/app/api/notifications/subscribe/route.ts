import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid body" }, { status: 400 }); }
  const { endpoint, p256Key, auth, types } = body;
  if (!endpoint || !p256Key || !auth) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const toBase64Url = (s: string) => s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  await prisma.notificationSubscription.upsert({
    where: { userId_endpoint: { userId, endpoint } },
    create: { userId, endpoint, p256Key: toBase64Url(p256Key), auth: toBase64Url(auth), types: types || [] },
    update: { p256Key: toBase64Url(p256Key), auth: toBase64Url(auth), types: types || [], updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;
  const { endpoint } = await request.json().catch(() => ({}));
  if (!endpoint) return NextResponse.json({ error: "missing endpoint" }, { status: 400 });

  await prisma.notificationSubscription.deleteMany({
    where: { userId, endpoint },
  });

  return NextResponse.json({ ok: true });
}
