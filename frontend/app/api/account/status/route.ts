import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      emailVerified: true,
      passwordHash: true,
      githubId: true,
      login: true,
      pfp: true,
      header: true,
      accounts: {
        select: { provider: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const hasGithub = !!user.githubId || user.accounts.some((a) => a.provider === "github");
  const hasEmail = !!user.email;
  const hasPassword = !!user.passwordHash;

  return NextResponse.json({
    hasGithub,
    hasEmail,
    hasPassword,
    email: user.email,
    emailVerified: !!user.emailVerified,
    githubLogin: hasGithub ? user.login : null,
    pfp: user.pfp,
    header: user.header,
  });
}
