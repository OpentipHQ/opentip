import { NextRequest } from "next/server";
import { handleAdminRequest, auditLog } from "@/lib/admin-api";
import { getOwnerWallet } from "@/lib/admin-wallet";
import { opentipV2Abi } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/chain";

export async function POST(req: NextRequest) {
  return handleAdminRequest(req, "critical", async (admin) => {
    if (!CONTRACT_ADDRESS) throw new Error("contract not configured");

    const wallet = getOwnerWallet();
    const hash = await wallet.writeContract({
      address: CONTRACT_ADDRESS!,
      abi: opentipV2Abi,
      functionName: "unpause",
    });

    await auditLog(admin.address, "unpause", {}, hash);
    return { ok: true, txHash: hash };
  });
}
