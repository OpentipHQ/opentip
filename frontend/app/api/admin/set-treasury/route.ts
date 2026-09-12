import { NextRequest } from "next/server";
import { handleAdminRequest, auditLog } from "@/lib/admin-api";
import { getOwnerWallet } from "@/lib/admin-wallet";
import { opentipAbi, getContractAddress } from "@/lib/contract";
import { validate, setTreasurySchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  return handleAdminRequest(req, "write", async (admin) => {
    const body = await req.json();
    const data = validate(setTreasurySchema, body);
    const contract = getContractAddress();
    if (!contract) throw new Error("contract not configured");

    const wallet = getOwnerWallet();
    const hash = await wallet.writeContract({
      address: contract,
      abi: opentipAbi,
      functionName: "setTreasuryAddress",
      args: [data.address as `0x${string}`],
    });

    await auditLog(admin.address, "set_treasury", { address: data.address }, hash);
    return { ok: true, txHash: hash };
  });
}
