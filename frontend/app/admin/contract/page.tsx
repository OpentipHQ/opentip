"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/motion/button";
import { useToast } from "@/app/providers";

export default function AdminContract() {
  const { showToast, dismissToast } = useToast();
  const [feeBps, setFeeBps] = useState("");
  const [treasury, setTreasury] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [treasuryBalance, setTreasuryBalance] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(j => {
      if (j.treasuryBalance) {
        const bal = Number(j.treasuryBalance) / 1e6;
        setTreasuryBalance(bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      }
    }).catch(() => {});
  }, []);

  const action = async (key: string, url: string, body: any) => {
    setLoading((prev) => ({ ...prev, [key]: true }));
    const toastId = showToast({ status: "loading", title: "Sending transaction...", duration: 0 });
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json();
      dismissToast(toastId);
      if (j.ok) {
        showToast({ status: "success", title: "Transaction sent", description: j.txHash?.slice(0, 16) + "..." });
      } else {
        showToast({ status: "error", title: "Failed", description: j.error });
      }
    } catch (e: any) {
      dismissToast(toastId);
      showToast({ status: "error", title: "Failed", description: e.message });
    }
    setLoading((prev) => ({ ...prev, [key]: false }));
  };

  return (
    <div className="space-y-8 max-w-lg">
      <h1 className="serif text-2xl font-semibold">Contract controls</h1>

      {/* Pause / Unpause */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Emergency controls</h2>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => action("pause", "/api/admin/pause", {})} disabled={loading.pause}>
            {loading.pause ? "Sending..." : "Pause contract"}
          </Button>
          <Button onClick={() => action("unpause", "/api/admin/unpause", {})} disabled={loading.unpause}>
            {loading.unpause ? "Sending..." : "Unpause contract"}
          </Button>
        </div>
        <p className="text-xs text-zinc-500">Pausing stops all tips and claims. Unpausing restores them.</p>
      </section>

      <div className="border-t rule" />

      {/* Set fee */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Platform fee</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1 max-w-[160px]">
            <label className="block text-xs text-zinc-500 mb-1">Fee (basis points)</label>
            <input
              type="number"
              value={feeBps}
              onChange={(e) => setFeeBps(e.target.value)}
              placeholder="500"
              min="0"
              max="1000"
              className="w-full bg-transparent border rule rounded-sm px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-accent"
            />
          </div>
          <Button onClick={() => action("setFee", "/api/admin/set-fee", { feeBps: Number(feeBps) })} disabled={loading.setFee || !feeBps}>
            {loading.setFee ? "Sending..." : "Update"}
          </Button>
        </div>
        <p className="text-xs text-zinc-500">500 = 5%. Max 1000 (10%).</p>
      </section>

      <div className="border-t rule" />

      {/* Set treasury */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Treasury address</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 mb-1">New treasury address</label>
            <input
              type="text"
              value={treasury}
              onChange={(e) => setTreasury(e.target.value)}
              placeholder="0x..."
              className="w-full bg-transparent border rule rounded-sm px-3 py-1.5 text-sm text-zinc-900 font-mono placeholder:text-zinc-500 outline-none focus:border-accent"
            />
          </div>
          <Button onClick={() => action("setTreasury", "/api/admin/set-treasury", { address: treasury })} disabled={loading.setTreasury || !treasury}>
            {loading.setTreasury ? "Sending..." : "Update"}
          </Button>
        </div>
      </section>

      <div className="border-t rule" />

      {/* Withdraw */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Withdraw treasury</h2>
        {treasuryBalance !== null && (
          <p className="text-xs text-zinc-500">Available: <span className="stats text-zinc-900">{treasuryBalance} USDC</span></p>
        )}
        <div className="flex gap-3 items-end">
          <div className="flex-1 max-w-[160px]">
            <label className="block text-xs text-zinc-500 mb-1">Amount (USDC)</label>
            <input
              type="text"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent border rule rounded-sm px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-accent"
            />
          </div>
          <Button onClick={() => action("withdraw", "/api/admin/withdraw", { amount: withdrawAmount })} disabled={loading.withdraw || !withdrawAmount}>
            {loading.withdraw ? "Sending..." : "Withdraw"}
          </Button>
        </div>
        <p className="text-xs text-zinc-500">Sends accumulated fees to the treasury address.</p>
      </section>
    </div>
  );
}
