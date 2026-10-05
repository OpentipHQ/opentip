"use client";

import { usePathname } from "next/navigation";
import HeaderShell from "@/components/HeaderShell";
import ConditionalFooter from "@/components/ConditionalFooter";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;
  return (
    <>
      <HeaderShell />
      <main id="main-content" className="w-full fluid-page flex-1">
        {children}
      </main>
      <ConditionalFooter />
    </>
  );
}
