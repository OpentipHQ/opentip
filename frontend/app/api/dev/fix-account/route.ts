import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

  const userId = (session.user as any).id;
  const login = (session.user as any).login;
  const githubId = (session.user as any).githubId;

  if (!userId) return NextResponse.json({ error: "no userId" }, { status: 400 });

  const updates: any = {};
  if (login) updates.login = login;
  if (githubId) updates.githubId = githubId;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no login or githubId in session" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: updates,
  });

  return NextResponse.json({ ok: true, updated: updates });
}
