import { z } from "zod";

const ETH_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const REPO_ID = /^[a-z0-9._-]+\/[a-z0-9._-]+$/;

export const addressSchema = z
  .string()
  .regex(ETH_ADDRESS, "invalid Ethereum address")
  .refine((addr) => addr !== "0x0000000000000000000000000000000000000000", "address cannot be zero");

export const repoIdSchema = z
  .string()
  .regex(REPO_ID, "repoId must be lowercase owner/repo format")
  .max(200, "repoId too long");

export const feeBpsSchema = z
  .number()
  .int()
  .min(0, "fee cannot be negative")
  .max(1000, "fee cannot exceed 10%");

export const withdrawAmountSchema = z
  .number()
  .positive("amount must be positive");

export const setFeeSchema = z.object({
  feeBps: feeBpsSchema,
});

export const setTreasurySchema = z.object({
  address: addressSchema,
});

export const setRegistrarSchema = z.object({
  address: addressSchema,
});

export const reassignPayoutSchema = z.object({
  repoId: repoIdSchema,
  address: addressSchema,
});

export const addAdminSchema = z.object({
  address: addressSchema,
  role: z.enum(["admin", "viewer"]).default("admin"),
});

export const removeAdminSchema = z.object({
  address: addressSchema,
});

export const withdrawSchema = z.object({
  amount: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
  }, "amount must be a positive number"),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(", ");
    throw new ValidationError(message);
  }
  return result.data;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
