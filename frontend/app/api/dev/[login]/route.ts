import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ login: string }> }
) {
  const { login } = await params;

  const user = await prisma.user.findUnique({
    where: { login },
    select: {
      id: true,
      login: true,
      name: true,
      image: true,
      pfp: true,
      header: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  let profile = null;
  try {
    profile = await prisma.developerProfile.findUnique({
      where: { userId: user.id },
      select: {
        bio: true,
        website: true,
        twitter: true,
        discord: true,
        telegram: true,
        farcaster: true,
        github: true,
      },
    });
  } catch {
    // profile table may not exist yet
  }

  return NextResponse.json({
    login: user.login,
    name: user.name,
    image: user.image,
    pfp: user.pfp,
    header: user.header,
    bio: profile?.bio ?? null,
    social: {
      website: profile?.website ?? null,
      twitter: profile?.twitter ?? null,
      discord: profile?.discord ?? null,
      telegram: profile?.telegram ?? null,
      farcaster: profile?.farcaster ?? null,
      github: profile?.github ?? null,
    },
  });
}
