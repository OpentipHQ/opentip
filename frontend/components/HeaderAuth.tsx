"use client";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/motion/button";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function HeaderAuth() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [pfp, setPfp] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/account/status")
        .then((r) => r.json())
        .then((j) => {
          if (j.pfp) setPfp(j.pfp);
        })
        .catch(() => {});
      fetch("/api/admin/me")
        .then((r) => r.json())
        .then((j) => setAdminRole(j.role || null))
        .catch(() => setAdminRole(null));
    }
  }, [status]);

  if (status === "authenticated") {
    const login = (session.user as any)?.login || session.user?.name || session.user?.email;
    const image = pfp || session.user?.image;
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {image ? (
            <Image src={image} alt={login || "Profile"} width={32} height={32} className="w-8 h-8 rounded-sm object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-sm bg-zinc-300 flex items-center justify-center text-xs font-medium text-zinc-700">
              {login?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <span className="text-sm text-zinc-700 hover:text-zinc-900 hidden sm:inline">{login}</span>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 border rule rounded-sm bg-[#c1c0b6] shadow-sm z-50">
            <div className="py-1">
              <Link
                href={`/dev/${login}`}
                className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-900/5 transition-colors"
                onClick={() => setOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/dashboard"
                className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-900/5 transition-colors"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/account"
                className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-900/5 transition-colors"
                onClick={() => setOpen(false)}
              >
                Account
              </Link>
              {adminRole && (
                <Link
                  href="/admin"
                  className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-900/5 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => { setOpen(false); signOut(); }}
                className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-900/5 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
  return <Link href="/signin"><Button size="sm" className="px-4">Sign in</Button></Link>;
}
