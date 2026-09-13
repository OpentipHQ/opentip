import { cookieStorage, createStorage } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base, baseSepolia } from "@reown/appkit/networks";

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || process.env.NEXT_PUBLIC_PROJECT_ID || "";

if (!projectId) {
  console.warn("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (or NEXT_PUBLIC_PROJECT_ID) not set — Reown AppKit will not connect");
}

const baseSepoliaCustom = {
  ...baseSepolia,
  rpcUrls: {
    default: {
      http: [
        "https://base-sepolia-rpc.publicnode.com",
        "https://base-sepolia.drpc.org",
        "https://sepolia.base.org",
      ],
    },
    public: {
      http: [
        "https://base-sepolia-rpc.publicnode.com",
        "https://base-sepolia.drpc.org",
        "https://sepolia.base.org",
      ],
    },
  },
} as any;

const baseCustom = {
  ...base,
  rpcUrls: {
    default: {
      http: [
        "https://base-rpc.publicnode.com",
        "https://base.drpc.org",
        "https://mainnet.base.org",
      ],
    },
    public: {
      http: [
        "https://base-rpc.publicnode.com",
        "https://base.drpc.org",
        "https://mainnet.base.org",
      ],
    },
  },
} as any;

export const networks = [baseCustom, baseSepoliaCustom] as any;

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId: projectId || "demo",
  networks,
});

export const config = wagmiAdapter.wagmiConfig;
