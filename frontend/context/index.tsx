"use client";

import { wagmiAdapter, projectId, networks } from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { base, baseSepolia } from "@reown/appkit/networks";
import { type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";

const queryClient = new QueryClient();

const metadata = {
  name: "Opentip",
  description: "Open-source tip jar on Base — tip any GitHub repo in crypto",
  url: "https://opentip.tech",
  icons: ["https://opentip.tech/Opentip.png"],
};

createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId || "demo",
  networks,
  defaultNetwork: process.env.NEXT_PUBLIC_CHAIN === "base" ? base : baseSepolia,
  metadata,
  features: { analytics: true },
});

export default function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
