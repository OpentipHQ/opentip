"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const HIDDEN_PREFIXES = [
  "/dashboard",
  "/admin",
  "/docs",
  "/signin",
  "/onboarding",
  "/forgot-password",
  "/reset-password",
  "/activity",
  "/repos",
  "/leaderboard",
  "/dev",
];

export default function Footer() {
  const pathname = usePathname();

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 2) return null;

  return (
    <footer className="w-full bg-accent text-white">
      <div className="fluid-page pt-12 pb-6">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Image src="/Opentip.png" alt="Opentip" width={28} height={28} />
              <span className="serif text-2xl font-semibold tracking-tight">Opentip</span>
            </div>
            <p className="text-sm opacity-70 max-w-xs">Open-source tip jar on Base. Send crypto to the developers who built the tools you use every day.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
            <div>
              <p className="font-medium uppercase tracking-wider text-[0.65rem] opacity-60 mb-3">Products</p>
              <div className="space-y-2 opacity-80">
                <Link href="/repos" className="block hover:opacity-100 transition-opacity">Repos</Link>
                <Link href="/activity" className="block hover:opacity-100 transition-opacity">Activity</Link>
                <Link href="/leaderboard" className="block hover:opacity-100 transition-opacity">Leaderboard</Link>
                <Link href="/dashboard" className="block hover:opacity-100 transition-opacity">Dashboard</Link>
              </div>
            </div>
            <div>
              <p className="font-medium uppercase tracking-wider text-[0.65rem] opacity-60 mb-3">Resources</p>
              <div className="space-y-2 opacity-80">
                <Link href="/docs" className="block hover:opacity-100 transition-opacity">Documentation</Link>
                <a href="https://github.com/opentip" target="_blank" rel="noopener noreferrer" className="block hover:opacity-100 transition-opacity">GitHub</a>
                <a href="https://twitter.com/opentip" target="_blank" rel="noopener noreferrer" className="block hover:opacity-100 transition-opacity">Twitter</a>
              </div>
            </div>
            <div>
              <p className="font-medium uppercase tracking-wider text-[0.65rem] opacity-60 mb-3">Legal</p>
              <div className="space-y-2 opacity-80">
                <Link href="/legal/terms" className="block hover:opacity-100 transition-opacity">Terms</Link>
                <Link href="/legal/privacy" className="block hover:opacity-100 transition-opacity">Privacy</Link>
              </div>
            </div>
            <div>
              <p className="font-medium uppercase tracking-wider text-[0.65rem] opacity-60 mb-3">Contact</p>
              <div className="space-y-2 opacity-80">
                <a href="mailto:support@opentip.tech" className="block hover:opacity-100 transition-opacity">support@opentip.tech</a>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/20 text-xs opacity-60">
          <p>© 2026 Opentip</p>
        </div>
      </div>
      <div className="text-center pb-4">
        <div className="serif text-[5rem] md:text-[8rem] font-bold tracking-tight opacity-20 leading-none select-none">opentip.</div>
      </div>
    </footer>
  );
}
