import { NextRequest } from "next/server";
import { handleAdminRequest, auditLog } from "@/lib/admin-api";
import { getOwnerWallet } from "@/lib/admin-wallet";
import { opentipAbi, getContractAddress } from "@/lib/contract";

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
