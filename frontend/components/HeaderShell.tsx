"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Search, Sun, X } from "lucide-react";
import HeaderAuth from "@/components/HeaderAuth";
import NotificationBell from "@/components/NotificationBell";
import { Logo } from "@/components/ledger/Logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/repos", label: "Repos" },
  { href: "/activity", label: "Activity" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/docs", label: "Docs" },
];

const RESERVED = new Set([
  "docs", "repos", "leaderboard", "activity", "signin", "dashboard", "wallet",
  "notifications", "onboarding", "admin", "legal", "install", "dev",
  "forgot-password", "reset-password", "verify-email", "receipt",
]);

export default function HeaderShell() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const parts = pathname.split("/").filter(Boolean);
  const center = parts.length === 2 && !RESERVED.has(parts[0])
    ? `opentip.tech/${parts[0]}/${parts[1]}`
    : null;
  const chainLabel = process.env.NEXT_PUBLIC_CHAIN === "base" ? "Base" : "Base Sepolia";

  return (
    <>
      <header className="sticky top-0 z-header border-b border-border bg-background/90 backdrop-blur-md">
        <nav className="mx-auto flex h-16 w-full max-w-[1120px] items-center gap-3 px-4">
          <button
            className="p-1 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/" className="shrink-0" aria-label="Opentip home">
            <Logo />
          </Link>
          {center ? (
            <p className="hidden min-w-0 flex-1 truncate text-center font-mono text-xs text-muted-foreground sm:block">
              {center}
            </p>
          ) : (
            <div className="ml-4 hidden items-center gap-5 md:flex" aria-label="Primary">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "text-sm text-muted-foreground transition-colors hover:text-foreground",
                    pathname === href && "text-foreground",
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Search repositories"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => window.dispatchEvent(new Event("opentip-search"))}
            >
              <Search className="h-4 w-4" />
            </button>
            <span className="hidden items-center rounded-full border border-border px-2.5 py-1 text-xs sm:inline-flex">
              {chainLabel}
            </span>
            <button
              type="button"
              aria-label="Toggle color theme"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <NotificationBell />
            <HeaderAuth />
          </div>
        </nav>
      </header>
      {mobileOpen && (
        <div className="border-b border-border bg-background px-6 py-4 md:hidden">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
