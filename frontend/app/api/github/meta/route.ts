import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const owner = req.nextUrl.searchParams.get("owner");
  const repo = req.nextUrl.searchParams.get("repo");
  if (!owner || !repo) return NextResponse.json({ error: "owner and repo required" }, { status: 400 });

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {},
    next: { revalidate: 300 },
  });

  if (!res.ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  const data = await res.json();
  return NextResponse.json(data);
}
