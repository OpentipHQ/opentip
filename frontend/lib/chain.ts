import { base, baseSepolia } from "viem/chains";

const isMainnet = process.env.NEXT_PUBLIC_CHAIN === "base";

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "";

export const CHAIN_ID = isMainnet ? 8453 : 84532;
export const VIEM_CHAIN = isMainnet ? base : baseSepolia;

export const CONTRACT_ADDRESS = (isMainnet
  ? process.env.NEXT_PUBLIC_BASE_CONTRACT
  : process.env.NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT) as `0x${string}` | undefined;

export const USDC_ADDRESS = (isMainnet
  ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  : "0x036CbD53842c5426634e7929541eC2318f3dCF7e") as `0x${string}`;

export const OAR_ADDRESS = (isMainnet
  ? "0x6F19171963b7095d039372d0962512259187E4e6"
  : "0x5EF2370E0FB0444cC06A18476101D18aDc933b3D") as `0x${string}`;

export const ETH_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export const TOKEN_CONFIG = {
  [ETH_ADDRESS]: { symbol: "ETH", decimals: 18, name: "Ethereum" },
  [USDC_ADDRESS]: { symbol: "USDC", decimals: 6, name: "USD Coin" },
  [OAR_ADDRESS]: { symbol: "OAR", decimals: 18, name: "Oarcoin" },
} as const;

export type TokenAddress = keyof typeof TOKEN_CONFIG;

// Lowercase-keyed lookup map for case-insensitive matching
const TOKEN_LOOKUP: Record<string, { symbol: string; decimals: number; name: string }> = {};
for (const [addr, config] of Object.entries(TOKEN_CONFIG)) {
  TOKEN_LOOKUP[addr.toLowerCase()] = config;
}

export function getTokenSymbol(token: string | null | undefined): string {
  if (!token) return "USDC";
  const config = TOKEN_LOOKUP[token.toLowerCase()];
  return config?.symbol ?? "TOKEN";
}

export function getTokenDecimals(token: string | null | undefined): number {
  if (!token) return 6;
  const config = TOKEN_LOOKUP[token.toLowerCase()];
  return config?.decimals ?? 18;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
