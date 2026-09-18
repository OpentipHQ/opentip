"use client";
import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { opentipV2Abi } from "@/lib/contract";
import { CONTRACT_ADDRESS, CHAIN_ID, getTokenSymbol, getTokenDecimals } from "@/lib/chain";
import { Button, StatefulButton } from "@/components/motion/button";
import { useToast } from "@/app/providers";

export default function AdminTokensPage() {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { showToast } = useToast();
  const contract = CONTRACT_ADDRESS;

  const [addAddress, setAddAddress] = useState("");
  const [addDecimals, setAddDecimals] = useState("18");
  const [removeAddress, setRemoveAddress] = useState("");
  const [addState, setAddState] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [removeState, setRemoveState] = useState<"idle"|"loading"|"success"|"error">("idle");

  const addW = useWriteContract();
  const removeW = useWriteContract();
  const addReceipt = useWaitForTransactionReceipt({ hash: addW.data });
  const removeReceipt = useWaitForTransactionReceipt({ hash: removeW.data });

  // Read token list from contract
  const { data: tokenList, refetch: refetchTokens } = useReadContract({
    address: contract,
    abi: opentipV2Abi,
    functionName: "getTokenList",
    chainId: CHAIN_ID,
    query: { enabled: !!contract },
  });

  const { data: tokenCount } = useReadContract({
    address: contract,
    abi: opentipV2Abi,
    functionName: "getTokenCount",
    chainId: CHAIN_ID,
    query: { enabled: !!contract },
  });

  const onAdd = () => {
    if (!contract || !addAddress) return;
    setAddState("loading");
    addW.writeContract({
      address: contract,
      abi: opentipV2Abi,
      functionName: "addToken",
      args: [addAddress as `0x${string}`, parseInt(addDecimals) as any],
    });
  };

  const onRemove = () => {
    if (!contract || !removeAddress) return;
    setRemoveState("loading");
    removeW.writeContract({
      address: contract,
      abi: opentipV2Abi,
      functionName: "removeToken",
      args: [removeAddress as `0x${string}`],
    });
  };

  useEffect(() => {
    if (addReceipt.isSuccess) { setAddState("success"); showToast({ status: "success", title: "Token added" }); refetchTokens(); setTimeout(() => setAddState("idle"), 2000); }
    if (addReceipt.isError) { setAddState("error"); showToast({ status: "error", title: "Failed to add token" }); setTimeout(() => setAddState("idle"), 2000); }
  }, [addReceipt.isSuccess, addReceipt.isError]);

  useEffect(() => {
    if (removeReceipt.isSuccess) { setRemoveState("success"); showToast({ status: "success", title: "Token removed" }); refetchTokens(); setTimeout(() => setRemoveState("idle"), 2000); }
    if (removeReceipt.isError) { setRemoveState("error"); showToast({ status: "error", title: "Failed to remove token" }); setTimeout(() => setRemoveState("idle"), 2000); }
  }, [removeReceipt.isSuccess, removeReceipt.isError]);

  if (!contract) return <div className="py-12 text-sm text-zinc-600">Contract not configured.</div>;

  const tokenAddresses = Array.isArray(tokenList) ? tokenList : [];

  return (
    <div className="space-y-8">
      <h1 className="serif text-2xl font-semibold">Token Management</h1>

      {/* Current tokens */}
      <section className="space-y-4">
        <h2 className="serif font-semibold text-sm">Registered Tokens ({tokenCount?.toString() || "0"})</h2>
        <div className="border rule rounded-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b rule bg-zinc-900/5">
                <th className="text-left px-4 py-2 font-medium text-zinc-600">Symbol</th>
                <th className="text-left px-4 py-2 font-medium text-zinc-600">Address</th>
                <th className="text-right px-4 py-2 font-medium text-zinc-600">Decimals</th>
              </tr>
            </thead>
            <tbody>
              {tokenAddresses.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-4 text-center text-xs text-zinc-500">No tokens loaded</td></tr>
              ) : (
                tokenAddresses.map((addr: string) => {
                  return (
                    <tr key={addr} className="border-b rule last:border-0">
                      <td className="px-4 py-2 font-mono text-xs font-medium">{getTokenSymbol(addr)}</td>
                      <td className="px-4 py-2 font-mono text-xs">{addr}</td>
                      <td className="px-4 py-2 text-right text-xs">{getTokenDecimals(addr)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add token */}
      <section className="space-y-4">
        <h2 className="serif font-semibold text-sm">Add Token</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-0 max-w-[340px]">
            <label className="text-xs text-zinc-500">Token Address</label>
            <input
              value={addAddress}
              onChange={(e) => setAddAddress(e.target.value)}
              placeholder="0x..."
              className="w-full h-9 bg-transparent border rule rounded-sm px-3 text-sm text-zinc-900 font-mono mt-1"
            />
          </div>
          <div className="w-[100px]">
            <label className="text-xs text-zinc-500">Decimals</label>
            <input
              value={addDecimals}
              onChange={(e) => setAddDecimals(e.target.value)}
              placeholder="18"
              className="w-full h-9 bg-transparent border rule rounded-sm px-3 text-sm text-zinc-900 mt-1"
            />
          </div>
          {isConnected ? (
            <StatefulButton
              state={addState === "loading" ? "loading" : addState === "success" ? "success" : addState === "error" ? "error" : "idle"}
              onClick={onAdd}
              disabled={!addAddress || addState === "loading"}
            >
              Add token
            </StatefulButton>
          ) : (
            <Button variant="secondary" onClick={() => open()}>Connect wallet</Button>
          )}
        </div>
      </section>

      {/* Remove token */}
      <section className="space-y-4">
        <h2 className="serif font-semibold text-sm">Remove Token</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-0 max-w-[340px]">
            <label className="text-xs text-zinc-500">Token Address</label>
            <input
              value={removeAddress}
              onChange={(e) => setRemoveAddress(e.target.value)}
              placeholder="0x..."
              className="w-full h-9 bg-transparent border rule rounded-sm px-3 text-sm text-zinc-900 font-mono mt-1"
            />
          </div>
          {isConnected ? (
            <StatefulButton
              state={removeState === "loading" ? "loading" : removeState === "success" ? "success" : removeState === "error" ? "error" : "idle"}
              onClick={onRemove}
              disabled={!removeAddress || removeState === "loading"}
              variant="secondary"
            >
              Remove token
            </StatefulButton>
          ) : (
            <Button variant="secondary" onClick={() => open()}>Connect wallet</Button>
          )}
        </div>
        <p className="text-xs text-zinc-500">Warning: Removing a token will prevent new tips in that token. Existing balances remain claimable.</p>
      </section>
    </div>
  );
}
