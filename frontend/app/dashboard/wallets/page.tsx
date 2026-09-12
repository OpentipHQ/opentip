"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { useAppKit } from "@reown/appkit/react";

function truncate(addr: string) { return addr.slice(0, 6) + "..." + addr.slice(-4); }

export default function DashboardWallets() {
  const { data: session, status } = useSession();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { open } = useAppKit();
  const { signMessageAsync } = useSignMessage();
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/wallet/link").then(r => r.json()).then(j => Array.isArray(j) ? setWallets(j) : setWallets([])).catch(() => {}).finally(() => setLoading(false));
  }, [status]);

  async function linkWallet() {
    if (!address) { open(); return; }
    setLinking(true);
    setMessage("");
    try {
      const login = (session?.user as any)?.login || session?.user?.name || "user";
      const nonce = Math.random().toString(36).slice(2);
      const msg = `Link wallet ${address} to ${login} ${nonce}`;
      const sig = await signMessageAsync({ message: msg });
      const res = await fetch("/api/wallet/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature: sig, nonce }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("Wallet linked!");
        setWallets((prev) => [...prev.filter((w: any) => w.address !== address.toLowerCase()), { address: address.toLowerCase() }]);
      } else {
        setMessage(data.error || "Failed to link");
      }
    } catch (e: any) {
      setMessage(e.message || "Failed to link");
    }
    setLinking(false);
  }

  if (status === "loading") return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;

  return (
    <div className="space-y-6">
      <h1 className="serif text-2xl font-semibold">Wallets</h1>

      <div className="space-y-3">
        <p className="text-sm text-zinc-600">Link wallets to register repos and claim tips.</p>

        {isConnected && address && (
          <div className="flex items-center gap-3">
            <span className="stats text-xs text-zinc-700 border rule rounded-sm px-2 py-1">{truncate(address)}</span>
            <Button size="sm" onClick={linkWallet} disabled={linking}>
              {linking ? "Linking..." : "Link current wallet"}
            </Button>
          </div>
        )}

        {!isConnected && (
          <Button size="sm" variant="secondary" onClick={() => open()}>Connect wallet to link</Button>
        )}

        {message && <p className="text-xs text-zinc-600">{message}</p>}
      </div>

      <div className="border-t rule pt-4">
        <h2 className="serif text-sm font-semibold mb-3">Linked wallets</h2>
        {loading ? (
          <Loader variant="dots" size={16} />
        ) : wallets.length === 0 ? (
          <p className="text-xs text-zinc-500">No wallets linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {wallets.map((w: any) => (
              <li key={w.address} className="stats text-xs text-zinc-700 border rule rounded-sm px-2 py-1 inline-block">{truncate(w.address)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
