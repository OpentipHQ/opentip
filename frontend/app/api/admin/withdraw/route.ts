import { NextRequest } from "next/server";
import { handleAdminRequest, auditLog } from "@/lib/admin-api";
import { parseUnits } from "viem";
import { getOwnerWallet } from "@/lib/admin-wallet";
import { opentipV2Abi } from "@/lib/contract";
import { CONTRACT_ADDRESS, getTokenDecimals } from "@/lib/chain";
import { validate } from "@/lib/validations";
import { z } from "zod";

const withdrawSchema = z.object({
  token: z.string().regex(/^0x[0-9a-fA-F]{40}$/, "invalid token address"),
  amount: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
  }, "amount must be a positive number"),
});

export async function POST(req: NextRequest) {
  return handleAdminRequest(req, "critical", async (admin) => {
    const body = await req.json();
    const data = validate(withdrawSchema, body);
    if (!CONTRACT_ADDRESS) throw new Error("contract not configured");

    const decimals = getTokenDecimals(data.token);
    const amount = parseUnits(data.amount, decimals);
    const wallet = getOwnerWallet();
    const hash = await (wallet.writeContract as any)({
      address: CONTRACT_ADDRESS,
      abi: opentipV2Abi,
      functionName: "withdrawTreasury",
      args: [data.token as `0x${string}`, amount],
    });

    await auditLog(admin.address, "withdraw", { token: data.token, amount: data.amount }, hash);
    return { ok: true, txHash: hash };
  });
}
