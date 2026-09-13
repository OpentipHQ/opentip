import "./globals.css";
import { headers } from "next/headers";
import Providers from "./providers";
import HeaderShell from "@/components/HeaderShell";
import Footer from "@/components/Footer";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const plexMono = IBM_Plex_Mono({ weight: ["400","500"], subsets: ["latin"], variable: "--font-plex-mono", display: "swap" });

export const metadata = {
  metadataBase: new URL("https://opentip.tech"),
  title: {
    default: "Opentip | Tip any GitHub repo in crypto",
    template: "%s | Opentip",
  },
  description: "The open-source tip jar. Send crypto to the developers who build the tools you use.",
  icons: { icon: "/Opentip.png" },
  openGraph: {
    title: "Opentip | Tip any GitHub repo in crypto",
    description: "The open-source tip jar. Send crypto to the developers who build the tools you use.",
    url: "https://opentip.tech",
    siteName: "Opentip",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Opentip | Tip any GitHub repo in crypto",
    description: "The open-source tip jar. Send crypto to the developers who build the tools you use.",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="min-h-screen bg-[#c1c0b6] text-zinc-900 antialiased">
        <Providers cookies={cookies}>
          <div className="flex flex-col min-h-screen">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded">
              Skip to content
            </a>
            <HeaderShell />
            <main id="main-content" className="w-full fluid-page flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
