import { NextRequest } from "next/server";
import { handleAdminRequest, auditLog } from "@/lib/admin-api";
import { getOwnerWallet } from "@/lib/admin-wallet";
import { opentipV2Abi } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/chain";
import { validate } from "@/lib/validations";
import { z } from "zod";

const deadlineSchema = z.object({
  deadline: z.number().int().min(0, "deadline must be non-negative"),
});

export async function POST(req: NextRequest) {
  return handleAdminRequest(req, "critical", async (admin) => {
    const body = await req.json();
    const data = validate(deadlineSchema, body);
    if (!CONTRACT_ADDRESS) throw new Error("contract not configured");

    const wallet = getOwnerWallet();
    const hash = await wallet.writeContract({
      address: CONTRACT_ADDRESS,
      abi: opentipV2Abi,
      functionName: "setMigrationDeadline",
      args: [BigInt(data.deadline)],
    });

    await auditLog(admin.address, "set_migration_deadline", { deadline: data.deadline }, hash);
    return { ok: true, txHash: hash };
  });
}
