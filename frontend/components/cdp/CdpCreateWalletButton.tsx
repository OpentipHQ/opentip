"use client";
import { useState } from "react";
import { useAuthenticateWithJWT, useCurrentUser, useEvmAddress, useCreateEvmSmartAccount } from "@coinbase/cdp-hooks";
import { Button } from "@/components/motion/button";
import { useToast } from "@/app/providers";

function truncate(a: string) { return a.slice(0, 6) + "..." + a.slice(-4); }

export default function CdpCreateWalletButton({ onCreated }: { onCreated?: (addr: string) => void }) {
  const { authenticateWithJWT } = useAuthenticateWithJWT();
  const { currentUser } = useCurrentUser();
  const { evmAddress } = useEvmAddress();
  const smartHook: any = useCreateEvmSmartAccount();
  const { showToast } = useToast();
  const [creating, setCreating] = useState(false);

  async function handle() {
    setCreating(true);
    try {
      // 1. Authenticate Opentip user (sub=user.id) with CDP — get-or-create end user
      const result: any = await authenticateWithJWT();
      let addr: string | null =
        result?.user?.evmSmartAccountObjects?.[0]?.address ||
        result?.user?.evmSmartAccounts?.[0] ||
        result?.user?.evmAccountObjects?.[0]?.address ||
        null;

      // 2. If no smart account yet, create one
      if (!addr) {
        const createFn = smartHook?.createSmartAccount || smartHook?.createEvmSmartAccount;
        if (typeof createFn === "function") {
          try {
            const created: any = await createFn({ enableSpendPermissions: true });
            addr = typeof created === "string" ? created : created?.address || created?.smartAccountAddress || null;
          } catch (e: any) {
            // Already has one — fall back to currentUser
            const cu: any = currentUser as any;
            addr = cu?.evmSmartAccountObjects?.[0]?.address || cu?.evmSmartAccounts?.[0] || null;
            if (!addr) throw e;
          }
        }
      }

      // 3. Fallback to evmAddress hook (smart first)
      if (!addr && evmAddress) addr = evmAddress as string;

      if (!addr) throw new Error("CDP returned no address — check portal Custom auth JWKS + allowlist http://localhost:3000");

      const res = await fetch("/api/wallet/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr, signature: "0x", nonce: "cdp", walletType: "smart", isPrimary: true }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to save");
      showToast({ status: "success", title: "Smart wallet created", description: truncate(addr) });
      onCreated?.(addr);
    } catch (e: any) {
      console.error("CDP create failed (full):", e);
      const msg = e?.message || e?.toString?.() || "Failed";
      if (e instanceof TypeError && msg.includes("Failed to fetch")) {
        showToast({ status: "error", title: "Could not create wallet", description: "Couldn't reach Coinbase CDP — an adblocker or privacy extension is likely blocking it. Disable extensions for this site (or try incognito without extensions) and try again." });
        setCreating(false);
        return;
      }
      let hint = msg.slice(0, 300);
      const low = msg.toLowerCase();
      if (low.includes("cors") || low.includes("origin") || low.includes("allowlist")) {
        hint += " — add http://localhost:3000 + https://opentip.tech in CDP Portal → Embedded Wallets → CORS";
      }
      if (low.includes("jwks") || low.includes("parse jwks") || low.includes("jwt") || low.includes("custom auth") || low.includes("unauthorized") || low.includes("issuer") || low.includes("audience")) {
        hint += " — CDP fetches https://opentip.tech/.well-known/jwks.json (not localhost). Deploy JWKS to prod + set same JWT_PRIVATE_KEY in Vercel. Check both URLs return {keys:[...]} with matching kid.";
      }
      showToast({ status: "error", title: "Could not create wallet", description: hint });
    }
    setCreating(false);
  }

  return (
    <Button size="sm" onClick={handle} disabled={creating}>
      {creating ? "Creating..." : "Create"}
    </Button>
  );
}
