"use client";
import { CDPHooksProvider } from "@coinbase/cdp-hooks";

export default function CdpProvider({ children }: { children: React.ReactNode }) {
  const projectId = process.env.NEXT_PUBLIC_CDP_PROJECT_ID;
  if (!projectId) return <>{children}</>;
  return (
    <CDPHooksProvider
      config={{
        projectId,
        // Opt out of SDK telemetry — adblockers block the analytics endpoint,
        // which otherwise spams console errors on every page load.
        disableAnalytics: true as any,
        // Route CDP API traffic through our server (allowed region) so users
        // on geoblocked networks work without VPN. See app/api/cdp/[...path].
        // Absolute URL required: the SDK builds request URLs with new URL(),
        // which throws on a relative base (broke project/MFA config fetches).
        basePath:
          typeof window !== "undefined" ? `${window.location.origin}/api/cdp` : "/api/cdp",
        customAuth: {
          getJwt: async () => {
            const r = await fetch("/api/auth/cdp-jwt");
            if (!r.ok) throw new Error("not authenticated");
            const j = await r.json();
            return j.token;
          },
        },
        ethereum: { createOnLogin: "smart" as any },
      }}
    >
      {children}
    </CDPHooksProvider>
  );
}
