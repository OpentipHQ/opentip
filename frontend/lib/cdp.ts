"use client";
// CDP Embedded helpers — real implementation.
// Creation itself must use React hooks (useAuthenticateWithJWT) via <CdpCreateWalletButton />,
// because hooks cannot run in a plain async function. This file provides address helpers.

export async function getCdpSmartWalletAddress(): Promise<string | null> {
  try {
    const r = await fetch("/api/wallet/link");
    const j = await r.json();
    if (Array.isArray(j)) {
      const smart = j.find((w: any) => w.walletType === "smart")?.address;
      if (smart) return smart;
      return j.find((w: any) => w.isPrimary)?.address || null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function createCdpSmartWallet(): Promise<string> {
  // Deprecated path — use <CdpCreateWalletButton /> which calls authenticateWithJWT() hook.
  // Kept to avoid breaking old imports; guides to correct usage.
  throw new Error("Use <CdpCreateWalletButton /> — createCdpSmartWallet() cannot call hooks. Missing NEXT_PUBLIC_CDP_PROJECT_ID or JWKS? Check /.well-known/jwks.json + /api/auth/cdp-jwt");
}
