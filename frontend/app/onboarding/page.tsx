"use client";
import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAccount, useSignMessage } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { useToast } from "@/app/providers";
import { Button, StatefulButton } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [linkState, setLinkState] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [_linkedWallets, setLinkedWallets] = useState<string[]>([]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/wallet/link").then(r => r.json()).then(j => {
        if (Array.isArray(j) && j.length > 0) {
          setLinkedWallets(j.map((w: any) => w.address.toLowerCase()));
          setStep(3);
        } else {
          setStep(2);
        }
      }).catch(() => setStep(2)).finally(() => setChecking(false));
    }
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") setChecking(false);
  }, [status]);

  const linkWallet = async () => {
    if (!address) { showToast({ status: "error", title: "Connect wallet first" }); return; }
    const login = (session?.user as any)?.login || session?.user?.name || "user";
    const nonce = Math.random().toString(36).slice(2, 10);
    const message = `Link wallet ${address} to ${login} ${nonce}`;
    setLinkState("loading");
    try {
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/wallet/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address, signature, nonce }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setLinkState("success");
      setLinkedWallets(prev => [...prev, address.toLowerCase()]);
      showToast({ status: "success", title: "Wallet linked", description: address.slice(0, 6) + "..." + address.slice(-4) });
      setTimeout(() => setStep(3), 1500);
    } catch (e: any) { setLinkState("error"); showToast({ status: "error", title: "Link failed", description: e.message?.slice(0, 100) }); setTimeout(() => setLinkState("idle"), 2000); }
  };

  if (status === "loading" || checking) return <div className="min-h-[60vh] flex items-center justify-center"><Loader variant="spinner" size={24} /></div>;

  return (
    <div className="max-w-sm mx-auto space-y-0">
      <section className="py-16 md:py-24 border-b rule space-y-6">
        <h1 className="serif fluid-page-title font-semibold tracking-tight leading-[0.9]">Set up Opentip</h1>
        <div className="flex gap-1.5">
          {[1, 2].map(n => (
            <div key={n} className="flex-1 flex flex-col gap-2">
              <div className={`h-1 rounded-sm ${step >= n ? "bg-zinc-900" : "bg-zinc-300"}`} />
              <span className={`text-[0.6rem] uppercase tracking-[0.15em] ${step >= n ? "text-zinc-700" : "text-zinc-400"}`}>{n === 1 ? "Account" : "Wallet"}</span>
            </div>
          ))}
        </div>
      </section>

      {step === 1 && (
        <section className="py-10 border-b rule space-y-4">
          <h2 className="serif text-xl font-semibold">Create your account</h2>
          <p className="text-sm text-zinc-600">Sign in with GitHub or email. Tippers don&apos;t need an account — just connect a wallet on any tip page.</p>
          <div className="flex gap-3">
            <Button onClick={() => signIn("github", { callbackUrl: "/onboarding" })}>Sign in with GitHub</Button>
            <Button variant="ghost" onClick={() => router.push("/signin")}>Use email</Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="py-10 border-b rule space-y-6">
          <h2 className="serif text-xl font-semibold">Link your wallet</h2>
          <p className="text-sm text-zinc-600">This wallet receives USDC. Signing proves ownership — no gas.</p>
          {isConnected ? (
            <div className="flex items-center gap-3">
              <span className="stats text-xs text-zinc-700 border rule rounded-sm px-2 py-1">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            </div>
          ) : (
            <Button onClick={() => open()}>Connect wallet</Button>
          )}
          <div>
            <StatefulButton state={linkState === "loading" ? "loading" : linkState === "success" ? "success" : linkState === "error" ? "error" : "idle"} onClick={linkWallet} disabled={!isConnected}>
              Link wallet
            </StatefulButton>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="py-10 border-b rule space-y-4">
          <h2 className="serif text-xl font-semibold">You&apos;re set up</h2>
          <p className="text-sm text-zinc-600">Account and wallet are linked. Go to any repo page to register it and start receiving tips.</p>
          <div className="flex gap-3">
            <Button onClick={() => router.push("/")}>Go home</Button>
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>Dashboard</Button>
          </div>
        </section>
      )}
    </div>
  );
}
