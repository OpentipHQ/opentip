"use client";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/motion/button";
import Link from "next/link";
export default function HeaderAuth() {
  const { data: session, status } = useSession();
  if (status === "authenticated") {
    const login = (session.user as any)?.login || session.user?.name || session.user?.email;
    return (
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="text-sm text-zinc-700 hover:text-zinc-900 underline">{login}</Link>
        <Button variant="ghost" size="sm" onClick={()=>signOut()}>Sign out</Button>
      </div>
    );
  }
  return <Link href="/signin"><Button size="sm" className="px-4">Sign in</Button></Link>;
}
