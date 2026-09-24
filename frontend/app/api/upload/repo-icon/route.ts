import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/azure";

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const repoId = formData.get("repoId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }

  if (!repoId || !/^[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+$/.test(repoId)) {
    return NextResponse.json({ error: "invalid repoId" }, { status: 400 });
  }

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "invalid file type" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "file too large (max 2MB)" }, { status: 400 });
  }

  const repo = await prisma.repo.findUnique({ where: { repo_id: repoId } });
  if (!repo) {
    return NextResponse.json({ error: "repo not found" }, { status: 404 });
  }

  const user: any = session.user;
  const login = user.login || user.name;
  const [owner] = repoId.split("/");
  if (login?.toLowerCase() !== owner.toLowerCase()) {
    return NextResponse.json({ error: "not authorized" }, { status: 403 });
  }

  try {
    const url = await uploadImage(file, "repo-icon");

    await prisma.repo.update({
      where: { repo_id: repoId },
      data: { icon: url },
    });

    return NextResponse.json({ ok: true, url });
  } catch (e: any) {
    console.error("repo-icon upload error:", e.message);
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }
}
