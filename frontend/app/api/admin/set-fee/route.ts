import { NextRequest } from "next/server";
import { handleAdminRequest, auditLog } from "@/lib/admin-api";
import { getOwnerWallet } from "@/lib/admin-wallet";
import { opentipV2Abi } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/chain";
import { validate, setFeeSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  return handleAdminRequest(req, "write", async (admin) => {
    const body = await req.json();
    const data = validate(setFeeSchema, body);
    if (!CONTRACT_ADDRESS) throw new Error("contract not configured");

    const wallet = getOwnerWallet();
    const hash = await wallet.writeContract({
      address: CONTRACT_ADDRESS!,
      abi: opentipV2Abi,
      functionName: "setFeeBps",
      args: [BigInt(data.feeBps)],
    });

    await auditLog(admin.address, "set_fee", { feeBps: data.feeBps }, hash);
    return { ok: true, txHash: hash };
  });
}
