"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSignMessage, useSendTransaction } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { signIn, useSession } from "next-auth/react";
import { parseUnits, formatUnits, parseEther } from "viem";
import { opentipAbi, usdcAbi, getContractAddress, getUsdcAddress } from "@/lib/contract";
import { getRelayQuote } from "@/lib/relay";
import { useToast } from "@/app/providers";
import { Input } from "@/components/motion/input";
import { Button, StatefulButton } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { Coins, Wallet, Copy } from "lucide-react";

function truncate(addr: string){ return addr.slice(0,6)+"..."+addr.slice(-4); }

export default function TipClient({ repoId }: { repoId: string }) {
  const router = useRouter();
  const repoIdLower = repoId.toLowerCase();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { data: session } = useSession();
  const { showToast, updateToast, dismissToast } = useToast();
  const { signMessageAsync } = useSignMessage();
  const contract = getContractAddress();
  const usdc = getUsdcAddress();

  const { data: isRegistered, isPending: isRegPending } = useReadContract({ address: contract, abi: opentipAbi, functionName: "isRegistered", args: [repoIdLower], query: { enabled: !!contract } });
  const { data: pending } = useReadContract({ address: contract, abi: opentipAbi, functionName: "getPendingBalance", args: [repoIdLower], query: { enabled: !!contract && !!isRegistered } });
  const { data: totalTipped, isPending: isTotalPending } = useReadContract({ address: contract, abi: opentipAbi, functionName: "getTotalTipped", args: [repoIdLower], query: { enabled: !!contract } });
  const { data: payout } = useReadContract({ address: contract, abi: opentipAbi, functionName: "getPayoutAddress", args: [repoIdLower], query: { enabled: !!contract && !!isRegistered } });
  const { data: allowance } = useReadContract({ address: usdc, abi: usdcAbi, functionName: "allowance", args: address && contract ? [address, contract] : undefined, query: { enabled: !!address && !!usdc && !!contract && !!isRegistered } as any });

  const [amount, setAmount] = useState("5");
  const [currency, setCurrency] = useState<"USDC"|"ETH">("USDC");
  const [displayName, setDisplayName] = useState("");
  const [tips, setTips] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [tipsLoading, setTipsLoading] = useState(true);
  const [amountError, setAmountError] = useState<string | undefined>(undefined);
  const [tipFlow, setTipFlow] = useState<"idle"|"approving"|"sending"|"success"|"error">("idle");
  const [claimState, setClaimState] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [registerState, setRegisterState] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [ownership, setOwnership] = useState<{ owns?: boolean; via?: string; loading?: boolean; signature?: string; expiry?: string; nonce?: string }>({});
  const [wallets, setWallets] = useState<any[]>([]);
  const loadingToastRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected && tipFlow !== "idle") {
      setTipFlow("idle");
      if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
    }
  }, [isConnected]);

  const showLoading = (title: string, desc?: string) => {
    if (loadingToastRef.current) dismissToast(loadingToastRef.current);
    const id = showToast({ status: "loading", title, description: desc, duration: 0 });
    loadingToastRef.current = id;
    return id;
  };

  useEffect(() => {
    if (session) {
      fetch("/api/wallet/link").then(r => r.json()).then(j => { if (Array.isArray(j)) setWallets(j); }).catch(() => {});
    }
  }, [session]);

  useEffect(()=>{ setTipsLoading(true); Promise.all([
    fetch(`/api/tips?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setTips).catch(()=>{}),
    fetch(`/api/leaderboard?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setLeaderboard).catch(()=>{})
  ]).finally(()=>setTipsLoading(false)); }, [repoIdLower]);

  const [relayTxHash, setRelayTxHash] = useState<`0x${string}` | undefined>(undefined);
  const relayReceipt = useWaitForTransactionReceipt({ hash: relayTxHash });

  const approveW = useWriteContract();
  const tipW = useWriteContract();
  const claimW = useWriteContract();
  const registerW = useWriteContract();
  const relaySend = useSendTransaction();

  const approveReceipt = useWaitForTransactionReceipt({ hash: approveW.data });
  const tipReceipt = useWaitForTransactionReceipt({ hash: tipW.data });
  const claimReceipt = useWaitForTransactionReceipt({ hash: claimW.data });
  const registerReceipt = useWaitForTransactionReceipt({ hash: registerW.data });

  const validateAmount = (v: string) => {
    const n = Number(v);
    if (!v || isNaN(n) || n <=0) return "Enter an amount";
    if (currency==="USDC" && parseUnits(v||"0",6) < BigInt(1_000_000)) return "Minimum $1";
    return undefined;
  };

  useEffect(()=>{
    if (tipFlow==="approving" && approveReceipt.isSuccess && approveW.data) {
      const baseUnits = parseUnits(amount, 6);
      setTipFlow("sending");
      showLoading("Sending tip...", `${amount} USDC → ${repoIdLower}`);
      tipW.writeContract({ address: contract!, abi: opentipAbi, functionName: "receiveTip", args: [repoIdLower, baseUnits] });
    }
    if (tipFlow==="approving" && approveReceipt.isError) {
      if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
      showToast({ status:"error", title:"Approve failed", description: (approveReceipt.error as any)?.message?.slice(0,100) });
      setTipFlow("error"); setTimeout(()=>setTipFlow("idle"), 2000);
    }
  }, [approveReceipt.isSuccess, approveReceipt.isError]);

  useEffect(()=>{
    if (tipFlow==="sending" && tipReceipt.isSuccess) {
      if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
      showToast({ status:"success", title:"Tip sent", description:`${amount} ${currency} → ${repoIdLower}` });
      setTipFlow("success"); setTimeout(()=>setTipFlow("idle"), 1600);
      fetch(`/api/tips?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setTips).catch(()=>{});
      fetch(`/api/leaderboard?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setLeaderboard).catch(()=>{});
    }
    if (tipFlow==="sending" && tipReceipt.isError) {
      if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
      showToast({ status:"error", title:"Tip failed", description: (tipReceipt.error as any)?.message?.slice(0,120) });
      setTipFlow("error"); setTimeout(()=>setTipFlow("idle"), 2000);
    }
  }, [tipReceipt.isSuccess, tipReceipt.isError]);

  useEffect(()=>{
    if (claimState==="loading" && claimReceipt.isSuccess) { setClaimState("success"); showToast({ status:"success", title:"Claimed", description: formatUnits((pending as bigint)||BigInt(0),6)+" USDC" }); setTimeout(()=>setClaimState("idle"),1600); }
    if (claimState==="loading" && claimReceipt.isError) { setClaimState("error"); showToast({ status:"error", title:"Claim failed" }); setTimeout(()=>setClaimState("idle"),2000); }
  }, [claimReceipt.isSuccess, claimReceipt.isError]);

  useEffect(()=>{
    if (registerState==="loading" && registerReceipt.isSuccess) { setRegisterState("success"); showToast({ status:"success", title:"Registered", description: repoIdLower }); setTimeout(()=>setRegisterState("idle"),1600); }
    if (registerState==="loading" && registerReceipt.isError) { setRegisterState("error"); showToast({ status:"error", title:"Register failed" }); setTimeout(()=>setRegisterState("idle"),2000); }
  }, [registerReceipt.isSuccess, registerReceipt.isError]);

  useEffect(()=>{
    if (relayTxHash && relayReceipt.isSuccess) {
      if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
      showToast({ status:"success", title:"ETH tip sent", description:`${amount} ETH → USDC` });
      setTipFlow("success"); setTimeout(()=>setTipFlow("idle"),1600);
      setRelayTxHash(undefined);
      fetch(`/api/tips?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setTips).catch(()=>{});
      fetch(`/api/leaderboard?repoId=${encodeURIComponent(repoIdLower)}`).then(r=>r.json()).then(setLeaderboard).catch(()=>{});
    }
    if (relayTxHash && relayReceipt.isError) {
      if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
      showToast({ status:"error", title:"ETH tip failed" });
      setTipFlow("error"); setTimeout(()=>setTipFlow("idle"),2000);
      setRelayTxHash(undefined);
    }
  }, [relayReceipt.isSuccess, relayReceipt.isError, relayTxHash]);

  useEffect(()=>{
    if (relaySend.data) {
      setRelayTxHash(relaySend.data);
    }
    if (relaySend.error) {
      if (loadingToastRef.current) { dismissToast(loadingToastRef.current); loadingToastRef.current = null; }
      showToast({ status:"error", title:"Transaction rejected", description: relaySend.error.message?.slice(0,100) });
      setTipFlow("error"); setTimeout(()=>setTipFlow("idle"),2000);
    }
  }, [relaySend.data, relaySend.error]);

  const onTipClick = async () => {
    const err = validateAmount(amount);
    setAmountError(err);
    if (err) { showToast({ status:"error", title: err }); return; }
    if (!isConnected || !address || !contract) { showToast({ status:"error", title:"Connect wallet" }); return; }
    if (currency==="ETH") {
      setTipFlow("sending");
      const chainId = 8453;
      const wei = parseEther(amount).toString();
      const id = showLoading("Fetching Relay quote...", `${amount} ETH → USDC`);
      try {
        const quote = await getRelayQuote({ chainId, amountWei: wei, recipient: address });
        updateToast(id, { status:"loading", title:"Confirm in wallet", description:`${amount} ETH → USDC`, duration: 0 });
        const tx = quote.tx;
        relaySend.sendTransaction({
          to: tx.to as `0x${string}`,
          data: tx.data as `0x${string}`,
          value: BigInt(tx.value),
        });
      } catch(e:any){ updateToast(id, { status:"error", title:"Relay quote failed", description: e.message?.slice(0,120) }); setTipFlow("error"); setTimeout(()=>setTipFlow("idle"),2000); }
      return;
    }
    const baseUnits = parseUnits(amount, 6);
    const currentAllowance = (allowance as bigint) || BigInt(0);
    if (currentAllowance < baseUnits) {
      setTipFlow("approving");
      showLoading("Approving spend...", `${amount} USDC`);
      approveW.writeContract({ address: usdc!, abi: usdcAbi, functionName: "approve", args: [contract!, baseUnits] });
    } else {
      setTipFlow("sending");
      showLoading("Sending tip...", `${amount} USDC → ${repoIdLower}`);
      tipW.writeContract({ address: contract!, abi: opentipAbi, functionName: "receiveTip", args: [repoIdLower, baseUnits] });
    }
  };

  const onClaim = () => {
    if (!contract) return;
    setClaimState("loading");
    claimW.writeContract({ address: contract, abi: opentipAbi, functionName: "claim", args: [repoIdLower] });
  };

  const onRegister = async () => {
    if (!contract || !address) return;
    // If we already have a signature, use it directly
    if (ownership.signature && ownership.expiry && ownership.nonce) {
      setRegisterState("loading");
      registerW.writeContract({
        address: contract,
        abi: opentipAbi,
        functionName: "registerRepo",
        args: [repoIdLower, address as `0x${string}`, BigInt(ownership.expiry), BigInt(ownership.nonce), ownership.signature as `0x${string}`],
      });
      return;
    }
    // Otherwise, get signature from backend first
    await checkOwnershipAndSign();
  };

  const checkOwnershipAndSign = async () => {
    if (!address) { showToast({ status: "error", title: "Connect wallet first" }); return; }
    setOwnership({ loading: true });
    try {
      const res = await fetch("/api/verify-ownership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId: repoIdLower, payoutAddress: address }),
      });
      const j = await res.json();
      if (j.ok) {
        setOwnership({ owns: true, via: "github", loading: false, signature: j.signature, expiry: j.expiry, nonce: j.nonce });
      } else {
        setOwnership({ owns: false, loading: false });
      }
    } catch {
      setOwnership({ owns: false, loading: false });
    }
  };

  const copyLink = async () => {
    const url = `https://opentip.tech/${repoIdLower}`;
    await navigator.clipboard.writeText(url);
    showToast({ status:"success", title:"Copied", description: url });
  };

  const saveDisplayName = async () => {
    if (!address || !displayName) { showToast({ status:"error", title:"Enter a display name" }); return; }
    const message = `Set display name: ${displayName} for ${address}`;
    try {
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/display-name", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ address, displayName, signature })});
      if (!res.ok) throw new Error(await res.text());
      showToast({ status:"success", title:"Display name saved", description: displayName });
    } catch(e:any){ showToast({ status:"error", title:"Save failed", description: e.message?.slice(0,100) }); }
  };

  const tipButtonText = tipFlow==="approving" ? "Approving spend..." : tipFlow==="sending" ? "Sending..." : tipFlow==="success" ? "Tip sent" : tipFlow==="error" ? "Try again" : `Tip ${amount} ${currency}`;

  if (contract === undefined) return <div className="py-12 text-sm text-zinc-600">Set NEXT_PUBLIC_BASE_CONTRACT in .env</div>;

  return (
    <div className="space-y-0">

      {/* Stats strip */}
      <section className="py-8 border-b rule grid grid-cols-3 gap-4">
        <div>
          <div className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500">Pending</div>
          <div className="stats mt-2 text-2xl flex items-baseline gap-2 text-zinc-900">
            {pending!==undefined ? formatUnits(pending as bigint,6) : <Loader size={16} variant="dots" />}
            <span className="text-xs text-zinc-500 font-sans">USDC</span>
          </div>
        </div>
        <div className="border-l rule pl-4">
          <div className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500">Total tipped</div>
          <div className="stats mt-2 text-2xl flex items-baseline gap-2 text-zinc-900">
            {isTotalPending ? <Loader size={16} variant="dots" /> : totalTipped!==undefined ? formatUnits(totalTipped as bigint,6) : "—"}
            <span className="text-xs text-zinc-500 font-sans">USDC</span>
          </div>
        </div>
        <div className="border-l rule pl-4">
          <div className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500">Payout</div>
          <div className="stats mt-2 text-sm text-zinc-700">{payout ? truncate(payout as string) : "—"}</div>
        </div>
      </section>

      {/* Unclaimed */}
      {isRegPending ? (
        <section className="py-12 flex justify-center"><Loader variant="spinner" size={24} /></section>
      ) : !isRegistered ? (
        <section className="py-10 border-b rule space-y-4">
          <h2 className="serif text-2xl font-semibold">Claim this repo</h2>
          {!session ? (
            <div className="space-y-4">
              <p className="text-zinc-600 max-w-lg">Not claimed yet. Sign in to verify ownership and register this repo.</p>
              <div className="flex gap-3">
                <Button onClick={() => router.push("/onboarding")}>Get started</Button>
                <Button variant="ghost" onClick={() => signIn("github")}>Sign in with GitHub</Button>
              </div>
            </div>
          ) : wallets.length === 0 ? (
            <div className="space-y-4">
              <p className="text-zinc-600 max-w-lg">You need to link a wallet first. This wallet receives USDC tips.</p>
              <Button onClick={() => router.push("/onboarding")}>Link wallet →</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-zinc-600 max-w-lg">Verify you own <code className="font-mono text-sm">{repoIdLower}</code>, then register to start receiving tips.</p>
              {ownership.loading ? (
                <Loader variant="dots" />
              ) : ownership.owns ? (
                <div className="space-y-3">
                  <p className="text-sm text-emerald-700">Verified via {ownership.via}</p>
                  <StatefulButton state={registerState === "loading" ? "loading" : registerState === "success" ? "success" : registerState === "error" ? "error" : "idle"} onClick={onRegister}>
                    Register repo
                  </StatefulButton>
                </div>
              ) : ownership.owns === false ? (
                <div className="space-y-3">
                  <p className="text-sm text-red-600">Not owner. Ensure you have admin/write on GitHub.</p>
                  <Button variant="secondary" onClick={checkOwnershipAndSign}>Re-check</Button>
                </div>
              ) : (
                <Button onClick={checkOwnershipAndSign}>Verify ownership</Button>
              )}
            </div>
          )}
        </section>
      ) : (
        /* Registered — tip form */
        <section className="py-10 border-b rule space-y-6">
          <h2 className="serif text-2xl font-semibold">Tip {repoIdLower}</h2>

          <div className="flex gap-3 items-end">
            <div className="flex-1 max-w-[200px]">
              <Input label="Amount" value={amount} onChange={(v)=>{ setAmount(v); setAmountError(validateAmount(v)); }} error={amountError} reserveErrorLine leftIcon={currency==="USDC" ? <Coins /> : <Wallet />} placeholder="5.00" />
            </div>
            <select value={currency} onChange={e=>setCurrency(e.target.value as any)} className="h-9 bg-transparent border rule rounded-sm px-3 text-sm text-zinc-900">
              <option>USDC</option>
              <option>ETH</option>
            </select>
            {isConnected ? (
              <span className="stats text-xs text-zinc-700 border rule rounded-sm px-2 py-1 h-9 flex items-center">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            ) : (
              <Button variant="secondary" onClick={() => open()} className="h-9">Connect wallet</Button>
            )}
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1 max-w-xs">
              <Input value={displayName} onChange={setDisplayName} placeholder="Display name (optional)" />
            </div>
            <Button variant="ghost" size="sm" onClick={saveDisplayName}>Save</Button>
          </div>

          <div className="flex gap-3 items-center">
            <StatefulButton state={tipFlow==="approving"||tipFlow==="sending"?"loading": tipFlow==="success"?"success": tipFlow==="error"?"error":"idle"} onClick={onTipClick} disabled={tipFlow==="approving"||tipFlow==="sending"}>
              {tipButtonText}
            </StatefulButton>
            {address && payout && (address.toLowerCase() === (payout as string).toLowerCase()) && (
              <StatefulButton state={claimState==="loading"?"loading": claimState==="success"?"success": claimState==="error"?"error":"idle"} onClick={onClaim} variant="secondary">
                Claim {pending? formatUnits(pending as bigint,6):"0"} USDC
              </StatefulButton>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={copyLink}><Copy className="h-3.5 w-3.5" /> Copy tip link</Button>
        </section>
      )}

      {/* Feeds */}
      <section className="py-10 grid md:grid-cols-2 gap-10">
        <div>
          <h3 className="serif font-semibold text-sm">Top supporters</h3>
          {tipsLoading ? (
            <div className="py-8 flex justify-center"><Loader variant="dots" size={20} /></div>
          ) : leaderboard.length===0 ? (
            <p className="text-xs text-zinc-500 mt-3">No tips yet.</p>
          ) : (
            <ul className="mt-3 divide-y rule">
              {leaderboard.map((r:any)=>(
                <li key={r.tipper_address} className="flex justify-between py-3">
                  <span className="text-sm text-zinc-700">{r.display_name || truncate(r.tipper_address)}</span>
                  <span className="stats text-sm text-zinc-900">${(Number(r.total)/1e6).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="serif font-semibold text-sm">Recent tips</h3>
          {tipsLoading ? (
            <div className="py-8 flex justify-center"><Loader variant="dots" size={20} /></div>
          ) : tips.length===0 ? (
            <p className="text-xs text-zinc-500 mt-3">No tips.</p>
          ) : (
            <ul className="mt-3 divide-y rule">
              {tips.slice(0,10).map((t:any)=>(
                <li key={t.id} className="flex justify-between py-3">
                  <span className="text-xs text-zinc-600">{truncate(t.tipper_address)}</span>
                  <span className="stats text-sm text-zinc-900">${(Number(t.usdc_amount)/1e6).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
