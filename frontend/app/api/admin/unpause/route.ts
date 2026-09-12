import { NextRequest } from "next/server";
import { handleAdminRequest, auditLog } from "@/lib/admin-api";
import { createWalletClient, http } from "viem";
import { baseSepolia, base } from "viem/chains";
import { opentipAbi, getContractAddress } from "@/lib/contract";

const chain = process.env.NEXT_PUBLIC_CHAIN === "base" ? base : baseSepolia;

function getOwnerWallet() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY not set");
  return createWalletClient({ account: pk as `0x${string}`, chain, transport: http() });
}

export async function POST(req: NextRequest) {
  return handleAdminRequest(req, "critical", async (admin) => {
    const contract = getContractAddress();
    if (!contract) throw new Error("contract not configured");

    const wallet = getOwnerWallet();
    const hash = await wallet.writeContract({
      address: contract,
      abi: opentipAbi,
      functionName: "unpause",
    });

    await auditLog(admin.address, "unpause", {}, hash);
    return { ok: true, txHash: hash };
  });
}
