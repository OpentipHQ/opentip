"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/motion/input";
import { Button, StatefulButton } from "@/components/motion/button";
import { useToast } from "@/app/providers";
import Link from "next/link";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/onboarding";
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|undefined>(undefined);

  const onGithub = () => signIn("github", { callbackUrl: "/onboarding" });
  const onEmail = async () => {
    setError(undefined);
    if (mode==="signup" && password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (mode==="signup") {
      setLoading(true);
      const res = await fetch("/api/auth/signup", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ email, password, name })});
      const j = await res.json();
      if (!res.ok) { setError(j.error); setLoading(false); showToast({ status:"error", title: j.error }); return; }
      showToast({ status:"success", title:"Account created, signing in..." });
    }
    setLoading(true);
    const r = await signIn("credentials", { email, password, redirect: false, callbackUrl });
    setLoading(false);
    if (r?.error) { setError("Invalid email or password"); showToast({ status:"error", title:"Login failed" }); }
    else if (r?.ok) router.push(callbackUrl);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center">
      <div className="max-w-sm w-full mx-auto space-y-10">
        <h1 className="serif text-5xl md:text-6xl font-semibold tracking-tight leading-[0.9]">Sign in</h1>

        <div className="space-y-3">
          <Button onClick={onGithub} size="lg" className="w-full px-6">
            <GithubIcon className="h-5 w-5" /> Continue with GitHub
          </Button>
        </div>

        <div className="border-t rule" />

        <div className="space-y-4">
          <div className="space-y-3">
            {mode === "signup" && <Input label="Name" value={name} onChange={setName} placeholder="Ada Lovelace" />}
            <Input label="Email" value={email} onChange={setEmail} placeholder="ada@example.com" type="email" />
            <Input label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" error={error} reserveErrorLine />
          </div>

          <StatefulButton state={loading ? "loading" : "idle"} onClick={onEmail} className="px-6">
            {mode === "signup" ? "Create account" : "Sign in"}
          </StatefulButton>

          <p className="text-xs text-zinc-500">
            {mode === "login" ? (
              <>Don&apos;t have an account? <button onClick={() => setMode("signup")} className="underline underline-offset-4 text-zinc-700 hover:text-zinc-900">Create one</button></>
            ) : (
              <>Already have an account? <button onClick={() => setMode("login")} className="underline underline-offset-4 text-zinc-700 hover:text-zinc-900">Sign in</button></>
            )}
          </p>
        </div>

        <div className="border-t rule pt-6">
          <Link href="/" className="text-sm text-zinc-600 underline underline-offset-4">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
