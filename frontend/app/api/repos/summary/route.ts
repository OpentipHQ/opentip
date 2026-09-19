import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRepoSummary } from "@/lib/ai";

export async function GET(req: NextRequest) {
  const repoId = req.nextUrl.searchParams.get("repoId");
  if (!repoId) return NextResponse.json({ error: "repoId required" }, { status: 400 });

  const repo = await prisma.repo.findUnique({
    where: { repo_id: repoId.toLowerCase() },
    select: { summary: true, summary_generated_at: true },
  });

  // Return cached if exists and < 7 days old
  if (repo?.summary && repo.summary_generated_at) {
    const age = Date.now() - repo.summary_generated_at.getTime();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    if (age < SEVEN_DAYS) {
      return NextResponse.json({ summary: JSON.parse(repo.summary), cached: true });
    }
  }

  // Generate new summary
  const [owner, repoName] = repoId.split("/");
  if (!owner || !repoName) return NextResponse.json({ error: "invalid repoId format" }, { status: 400 });

  const summary = await generateRepoSummary(owner, repoName);

  // Store in DB (only update — never create phantom repos)
  try {
    const exists = await prisma.repo.findUnique({
      where: { repo_id: repoId.toLowerCase() },
      select: { repo_id: true },
    });
    if (exists) {
      await prisma.repo.update({
        where: { repo_id: repoId.toLowerCase() },
        data: {
          summary: JSON.stringify(summary),
          summary_generated_at: new Date(),
        },
      });
    }
  } catch (e) {
    console.error("Failed to store summary:", e);
  }

  return NextResponse.json({ summary, cached: false });
}
