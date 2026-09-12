import "./globals.css";
import { headers } from "next/headers";
import Providers from "./providers";
import HeaderShell from "@/components/HeaderShell";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const plexMono = IBM_Plex_Mono({ weight: ["400","500"], subsets: ["latin"], variable: "--font-plex-mono", display: "swap" });

export const metadata = {
  title: "Opentip — tip any GitHub repo in crypto",
  description: "Open-source tip jar on Base. ETH/USDC → USDC pull payments.",
  icons: { icon: "/Opentip.png" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="min-h-screen bg-[#c1c0b6] text-zinc-900 antialiased">
        <Providers cookies={cookies}>
          <HeaderShell />
          <main className="w-full px-16 md:px-40">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
