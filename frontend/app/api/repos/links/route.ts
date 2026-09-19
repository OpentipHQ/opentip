import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Link = { title: string; url: string };

export async function GET(req: NextRequest) {
  const repoId = req.nextUrl.searchParams.get("repoId");
  if (!repoId) return NextResponse.json({ error: "repoId required" }, { status: 400 });

  const repo = await prisma.repo.findUnique({
    where: { repo_id: repoId.toLowerCase() },
    select: { links: true },
  });

  if (!repo) return NextResponse.json({ error: "repo not found" }, { status: 404 });

  const links: Link[] = repo.links ? JSON.parse(repo.links) : [];
  return NextResponse.json({ links });
}

export async function PUT(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

  const body = await req.json();
  const { repoId, links } = body as { repoId: string; links: Link[] };

  if (!repoId) return NextResponse.json({ error: "repoId required" }, { status: 400 });
  if (!Array.isArray(links)) return NextResponse.json({ error: "links must be an array" }, { status: 400 });
  if (links.length > 10) return NextResponse.json({ error: "max 10 links" }, { status: 400 });

  // Validate links
  for (const link of links) {
    if (!link.title || !link.url) return NextResponse.json({ error: "each link needs title and url" }, { status: 400 });
    if (link.title.length > 64) return NextResponse.json({ error: "title max 64 chars" }, { status: 400 });
    if (link.url.length > 512) return NextResponse.json({ error: "url max 512 chars" }, { status: 400 });
    try {
      const u = new URL(link.url);
      if (!["https:", "http:"].includes(u.protocol)) throw new Error();
    } catch {
      return NextResponse.json({ error: `invalid url: ${link.url}` }, { status: 400 });
    }
  }

  // Verify ownership
  const repo = await prisma.repo.findUnique({ where: { repo_id: repoId.toLowerCase() } });
  if (!repo) return NextResponse.json({ error: "repo not found" }, { status: 404 });

  const userId = session.user.id as string;
  const wallet = await prisma.userWallet.findUnique({
    where: { address: repo.payout_address },
    select: { userId: true },
  });
  if (!wallet || wallet.userId !== userId) {
    return NextResponse.json({ error: "not repo owner" }, { status: 403 });
  }

  const sanitized = links.map(l => ({
    title: l.title.trim().slice(0, 64),
    url: l.url.trim().slice(0, 512),
  }));

  await prisma.repo.update({
    where: { repo_id: repoId.toLowerCase() },
    data: { links: JSON.stringify(sanitized) },
  });

  return NextResponse.json({ ok: true, links: sanitized });
}
