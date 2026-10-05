import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { VIEM_CHAIN } from "@/lib/chain";

let _wallet: ReturnType<typeof createWalletClient> | null = null;

export function getOwnerWallet() {
  if (_wallet) return _wallet;
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY not set");
  const account = privateKeyToAccount(pk as `0x${string}`);
  _wallet = createWalletClient({ account, chain: VIEM_CHAIN, transport: http(process.env.RPC_URL || undefined) });
  return _wallet;
}
