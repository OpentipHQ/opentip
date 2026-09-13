import { NextRequest } from "next/server";
import { handleAdminRequest, auditLog } from "@/lib/admin-api";
import { parseUnits } from "viem";
import { getOwnerWallet } from "@/lib/admin-wallet";
import { opentipAbi } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/chain";
import { validate, withdrawSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  return handleAdminRequest(req, "critical", async (admin) => {
    const body = await req.json();
    const data = validate(withdrawSchema, body);
    if (!CONTRACT_ADDRESS) throw new Error("contract not configured");

    const amount = parseUnits(data.amount, 6);
    const wallet = getOwnerWallet();
    const hash = await wallet.writeContract({
      address: CONTRACT_ADDRESS!,
      abi: opentipAbi,
      functionName: "withdrawTreasury",
      args: [amount],
    });

    await auditLog(admin.address, "withdraw", { amount: data.amount }, hash);
    return { ok: true, txHash: hash };
  });
}
