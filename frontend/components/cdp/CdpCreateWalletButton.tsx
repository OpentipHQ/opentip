"use client";
import { useEffect, useState } from "react";
import { useAuthenticateWithJWT, useCurrentUser, useEvmAddress, useCreateEvmSmartAccount, useGetAccessToken } from "@coinbase/cdp-hooks";
import { Button } from "@/components/motion/button";
import { useToast } from "@/app/providers";

function truncate(a: string) { return a.slice(0, 6) + "..." + a.slice(-4); }

export default function CdpCreateWalletButton({ onCreated }: { onCreated?: (addr: string) => void }) {
  const { authenticateWithJWT } = useAuthenticateWithJWT();
  const { currentUser } = useCurrentUser();
  const { evmAddress } = useEvmAddress();
  const { getAccessToken } = useGetAccessToken();
  const smartHook: any = useCreateEvmSmartAccount();
  const { showToast } = useToast();
  const [creating, setCreating] = useState(false);
  // One smart wallet per user — if one is already linked, this button
  // must never offer to create a second (funds would strand with no
  // recovery). While checking, stay disabled so no click slips through.
  const [hasSmart, setHasSmart] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/wallet/link")
      .then((r) => r.json())
      .then((j) => setHasSmart(Array.isArray(j) && j.some((w: any) => w.walletType === "smart")))
      .catch(() => setHasSmart(false));
  }, []);

  async function handle() {
    setCreating(true);
    try {
      // 1. Authenticate Opentip user (sub=user.id) with CDP — get-or-create end user
      let result: any = null;
      let lastErr: any = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          result = await authenticateWithJWT();
          lastErr = null;
          break;
        } catch (e: any) {
          lastErr = e;
          const msg = e?.message || "";
          if (msg.includes("Bad gateway") || msg.includes("502") || msg.includes("Failed to fetch")) {
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          throw e;
        }
      }
      if (!result && lastErr) throw lastErr;
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

      // CDP access token for server-side ownership proof. The server
      // validates it with CDP directly, so no app-id/CDP-id mapping is
      // assumed anywhere.
      let cdpAccessToken: string | null = null;
      try {
        cdpAccessToken = await getAccessToken();
      } catch {}

      // Link wallet with retry for transient 502s (and one re-auth on 401)
      let linkRes: any = null;
      let linkErr: any = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch("/api/wallet/link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: addr, signature: "0x", nonce: "cdp", walletType: "smart", isPrimary: true, cdpAccessToken }),
          });
          const data = await res.json().catch(() => ({}));
          if (!data.ok) {
            if (res.status === 401 && attempt === 0) {
              // Token may have expired between authenticate and link —
              // re-authenticate once and retry with a fresh token.
              try {
                await authenticateWithJWT();
                cdpAccessToken = await getAccessToken();
              } catch {}
              continue;
            }
            throw new Error(data.error || "Failed to save");
          }
          linkRes = data;
          break;
        } catch (e: any) {
          linkErr = e;
          const msg = e?.message || "";
          if (msg.includes("Bad gateway") || msg.includes("502") || msg.includes("Failed to fetch")) {
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          throw e;
        }
      }
      if (!linkRes && linkErr) throw linkErr;
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
      if (low.includes("upstreambody") || low.includes("upstreamstatus")) {
        try {
          const parsed = JSON.parse(msg);
          hint = `CDP upstream ${parsed.upstreamStatus}: ${parsed.upstreamBody}`;
        } catch {}
      }
      showToast({ status: "error", title: "Could not create wallet", description: hint });
    }
    setCreating(false);
  }

  if (hasSmart) {
    return (
      <Button size="sm" disabled>
        Smart wallet created
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={handle} disabled={creating || hasSmart === null}>
      {creating ? "Creating..." : hasSmart === null ? "Checking..." : "Create"}
    </Button>
  );
}
