"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { useToast } from "@/app/providers";
import { opentipAbi } from "@/lib/contract";
import { VIEM_CHAIN, CONTRACT_ADDRESS } from "@/lib/chain";
import { createPublicClient, http } from "viem";

const client = createPublicClient({ chain: VIEM_CHAIN, transport: http() });

export default function AdminRegistrar() {
  const { showToast, dismissToast } = useToast();
  const [currentSigner, setCurrentSigner] = useState<string | null>(null);
  const [newSigner, setNewSigner] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!CONTRACT_ADDRESS) { setFetching(false); return; }
    client.readContract({ address: CONTRACT_ADDRESS, abi: opentipAbi, functionName: "registrarSigner" })
      .then((addr) => setCurrentSigner(addr as string))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const handleRotate = async () => {
    if (!newSigner) return;
    setLoading(true);
    const toastId = showToast({ status: "loading", title: "Rotating signer...", duration: 0 });
    try {
      const res = await fetch("/api/admin/set-registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: newSigner }),
      });
      const j = await res.json();
      dismissToast(toastId);
      if (j.ok) {
        showToast({ status: "success", title: "Signer rotated", description: "Old key is now invalidated." });
        setCurrentSigner(newSigner);
        setNewSigner("");
      } else {
        showToast({ status: "error", title: "Failed", description: j.error });
      }
    } catch (e: any) {
      dismissToast(toastId);
      showToast({ status: "error", title: "Failed", description: e.message });
    }
    setLoading(false);
  };

  if (fetching) return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;

  return (
    <div className="space-y-8 max-w-lg">
      <h1 className="serif text-2xl font-semibold">Registrar signer</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Current signer</h2>
        <div className="border rule rounded-sm p-4">
          <div className="font-mono text-sm text-zinc-900 break-all">{currentSigner || "Not set"}</div>
          <div className="text-xs text-zinc-500 mt-1">This address signs registration permits.</div>
        </div>
      </section>

      <div className="border-t rule" />

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Rotate signer</h2>
        <p className="text-xs text-zinc-500">Changing the signer immediately invalidates all permits signed by the old key.</p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 mb-1">New signer address</label>
            <input
              type="text"
              value={newSigner}
              onChange={(e) => setNewSigner(e.target.value)}
              placeholder="0x..."
              className="w-full bg-transparent border rule rounded-sm px-3 py-1.5 text-sm text-zinc-900 font-mono placeholder:text-zinc-500 outline-none focus:border-accent"
            />
          </div>
          <Button onClick={handleRotate} disabled={loading || !newSigner}>
            {loading ? "Sending..." : "Rotate"}
          </Button>
        </div>
      </section>
    </div>
  );
}
