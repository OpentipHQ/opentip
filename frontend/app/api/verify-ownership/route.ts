import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { signTypedData } from "viem/accounts";
import { randomBytes } from "crypto";
import { CONTRACT_ADDRESS, CHAIN_ID } from "@/lib/chain";
import { prisma } from "@/lib/prisma";
import { generateRepoSummary } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoId: repoIdRaw, payoutAddress } = body;
    const repoId = repoIdRaw.toLowerCase();

    if (!repoId || !repoId.includes("/")) {
      return NextResponse.json({ error: "repoId required as owner/repo" }, { status: 400 });
    }
    const [owner, repo] = repoId.split("/");
    if (!owner || !repo || !/^[a-zA-Z0-9._-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(repo)) {
      return NextResponse.json({ error: "invalid repoId format" }, { status: 400 });
    }
    if (!payoutAddress || payoutAddress === "0x0000000000000000000000000000000000000000") {
      return NextResponse.json({ error: "payoutAddress required" }, { status: 400 });
    }

    const session: any = await getServerSession(authOptions);
    const login = session?.user?.login;
    if (!login) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

    // Verify ownership via GitHub API
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (!repoRes.ok) return NextResponse.json({ error: "repo not found" }, { status: 404 });
    const repoJson: any = await repoRes.json();

    let owns = false;

    // owner check
    if (repoJson.owner?.login?.toLowerCase() === login.toLowerCase()) {
      owns = true;
    }

    // collaborator check
    if (!owns) {
      const accessToken = (session as any)?.accessToken;
      const token = process.env.GITHUB_TOKEN || accessToken;
      if (token) {
        const collabRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/collaborators/${login}/permission`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
        });
        if (collabRes.ok) {
          const j: any = await collabRes.json();
          if (["admin", "write"].includes(j.permission)) owns = true;
        }
      }
    }

    if (!owns) return NextResponse.json({ error: "not repo owner or collaborator" }, { status: 403 });

    // Generate nonce and expiry
    const nonce = randomBytes(16).readBigUInt64BE(0);
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 minutes

    // Sign EIP-712 locally with registrar key (no RPC needed)
    const pk = process.env.REGISTRAR_PRIVATE_KEY;
    if (!pk) throw new Error("REGISTRAR_PRIVATE_KEY env var not set");

    if (!CONTRACT_ADDRESS) throw new Error("Contract address not configured");

    const signature = await signTypedData({
      privateKey: pk as `0x${string}`,
      domain: {
        name: "Opentip",
        version: "2",
        chainId: BigInt(CHAIN_ID),
        verifyingContract: CONTRACT_ADDRESS!,
      },
      types: {
        Register: [
          { name: "repoId", type: "string" },
          { name: "payoutAddress", type: "address" },
          { name: "expiry", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      },
      primaryType: "Register",
      message: {
        repoId,
        payoutAddress: payoutAddress as `0x${string}`,
        expiry,
        nonce,
      },
    });

    // Derive signer address from private key
    const { privateKeyToAccount } = await import("viem/accounts");
    const account = privateKeyToAccount(pk as `0x${string}`);

    // Generate AI summary in background (non-blocking)
    generateRepoSummary(owner, repo).then(async (summary) => {
      try {
        await prisma.repo.upsert({
          where: { repo_id: repoId },
          update: {
            summary: JSON.stringify(summary),
            summary_generated_at: new Date(),
          },
          create: {
            repo_id: repoId,
            payout_address: payoutAddress,
            registered_at: new Date(),
            summary: JSON.stringify(summary),
            summary_generated_at: new Date(),
          },
        });
      } catch (e) {
        console.error("Failed to store summary after registration:", e);
      }
    }).catch((e) => {
      console.error("Summary generation failed:", e);
    });

    return NextResponse.json({
      ok: true,
      signature,
      expiry: expiry.toString(),
      nonce: nonce.toString(),
      signer: account.address,
    });
  } catch (e: any) {
    console.error("verify-ownership error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
