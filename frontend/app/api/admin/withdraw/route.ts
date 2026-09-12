import { NextRequest } from "next/server";
import { handleAdminRequest, auditLog } from "@/lib/admin-api";
import { createWalletClient, http, parseUnits } from "viem";
import { baseSepolia, base } from "viem/chains";
import { opentipAbi, getContractAddress } from "@/lib/contract";
import { validate, withdrawSchema } from "@/lib/validations";

const chain = process.env.NEXT_PUBLIC_CHAIN === "base" ? base : baseSepolia;

function getOwnerWallet() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY not set");
  return createWalletClient({ account: pk as `0x${string}`, chain, transport: http() });
}

export async function POST(req: NextRequest) {
  return handleAdminRequest(req, "critical", async (admin) => {
    const body = await req.json();
    const data = validate(withdrawSchema, body);
    const contract = getContractAddress();
    if (!contract) throw new Error("contract not configured");

    const amount = parseUnits(data.amount, 6);
    const wallet = getOwnerWallet();
    const hash = await wallet.writeContract({
      address: contract,
      abi: opentipAbi,
      functionName: "withdrawTreasury",
      args: [amount],
    });

    await auditLog(admin.address, "withdraw", { amount: data.amount }, hash);
    return { ok: true, txHash: hash };
  });
}
