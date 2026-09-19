import { NextRequest } from "next/server";
import { handleAdminRequest, auditLog } from "@/lib/admin-api";
import { getOwnerWallet } from "@/lib/admin-wallet";
import { opentipV2Abi } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/chain";
import { validate, setRegistrarSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  return handleAdminRequest(req, "critical", async (admin) => {
    const body = await req.json();
    const data = validate(setRegistrarSchema, body);
    if (!CONTRACT_ADDRESS) throw new Error("contract not configured");

    const wallet = getOwnerWallet();
    const hash = await (wallet.writeContract as any)({
      address: CONTRACT_ADDRESS!,
      abi: opentipV2Abi,
      functionName: "setRegistrarSigner",
      args: [data.address as `0x${string}`],
    });

    await auditLog(admin.address, "set_registrar", { address: data.address }, hash);
    return { ok: true, txHash: hash };
  });
}
