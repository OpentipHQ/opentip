import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;
  const { bio, website, twitter, discord, telegram, farcaster, github } = await req.json();

  try {
    const existing = await prisma.developerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (existing) {
      await prisma.developerProfile.update({
        where: { userId },
        data: {
          bio: bio || null,
          website: website || null,
          twitter: twitter || null,
          discord: discord || null,
          telegram: telegram || null,
          farcaster: farcaster || null,
          github: github || null,
        },
      });
    } else {
      await prisma.developerProfile.create({
        data: {
          userId,
          bio: bio || null,
          website: website || null,
          twitter: twitter || null,
          discord: discord || null,
          telegram: telegram || null,
          farcaster: farcaster || null,
          github: github || null,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "failed to save" }, { status: 500 });
  }
}
