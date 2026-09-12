import "./globals.css";
import { headers } from "next/headers";
import Link from "next/link";
import Providers from "./providers";
import HeaderAuth from "@/components/HeaderAuth";
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
          <header className="border-b rule sticky top-0 bg-[#c1c0b6]/80 backdrop-blur z-10">
            <nav className="w-full px-6 md:px-10 py-5 flex items-center justify-between relative">
              <Link href="/" className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Opentip.png" alt="" className="w-7 h-7" />
                <span className="serif font-semibold text-2xl tracking-tight">Opentip</span>
              </Link>
              <div className="hidden md:flex gap-x-8 text-sm items-center text-zinc-700 absolute left-1/2 -translate-x-1/2">
                {[
                  { href: "/repos", label: "Repos" },
                  { href: "/activity", label: "Activity" },
                  { href: "/leaderboard", label: "Leaderboard" },
                  { href: "/dashboard", label: "Dashboard" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="relative px-3 py-1.5 hover:text-zinc-900 transition-colors before:content-[''] before:absolute before:top-0 before:left-0 before:w-3 before:h-3 before:border-t-[1.5px] before:border-l-[1.5px] before:border-zinc-400 before:-translate-x-1.5 before:-translate-y-1.5 after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-3 after:h-3 after:border-b-[1.5px] after:border-r-[1.5px] after:border-zinc-400 after:translate-x-1.5 after:translate-y-1.5"
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <HeaderAuth />
            </nav>
          </header>
          <main className="w-full px-16 md:px-40">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
