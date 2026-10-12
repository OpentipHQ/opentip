"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import { Button } from "@/components/motion/button";
import { ReceiptCard } from "@/components/ledger/ReceiptCard";
import { useToast } from "@/app/providers";
import { formatAmount } from "@/lib/formatAmount";
import type { LoadedReceipt } from "@/lib/receipt";

export function ReceiptScreen({ receipt, network }: { receipt: LoadedReceipt; network: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const ready = receipt.status === "ready" && receipt.kind && receipt.repoId && receipt.project;

  useEffect(() => {
    if (receipt.status !== "pending" && receipt.status !== "unknown") return;
    const id = setInterval(() => router.refresh(), 4000);
    const stop = setTimeout(() => clearInterval(id), 30000);
    return () => {
      clearInterval(id);
      clearTimeout(stop);
    };
  }, [receipt.status, router]);

  async function download() {
    if (!cardRef.current || !ready) return;
    setSaving(true);
    try {
      const backgroundColor = getComputedStyle(document.body).backgroundColor;
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `opentip-${receipt.kind}-${(receipt.hash || "receipt").slice(0, 10)}.png`;
      link.click();
    } catch {
      showToast({ status: "error", title: "Could not save the receipt" });
    } finally {
      setSaving(false);
    }
  }

  function share() {
    if (!ready || !receipt.project || !receipt.repoId) return;
    const pageUrl = `https://opentip.tech/${receipt.repoId}`;
    const leg = receipt.legs[0];
    const claimed = leg ? `${formatAmount(leg.maintainer, leg.token) ?? "0"} ${leg.symbol}` : "";
    const text = receipt.kind === "claim"
      ? `Just claimed ${claimed} in funding for ${receipt.project} on @opentip_tech. Funding for open source, from the open market.`
      : `I just funded ${receipt.project} on @opentip_tech. Funding for open source, from the open market.`;
    const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(pageUrl)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center py-6">
      <div className="mb-8 flex w-full items-center justify-between">
        <Link href="/" className="text-sm font-semibold">Opentip</Link>
      </div>
      {ready ? (
        <>
          <span className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-brand">✓</span>
          <h1 className="mt-4 font-display text-5xl">{receipt.kind === "claim" ? "Claimed." : "Funded."}</h1>
          <div ref={cardRef} className="mt-8 w-full bg-background px-3 py-2">
            <ReceiptCard
              kind={receipt.kind!}
              project={receipt.project!}
              repoId={receipt.repoId!}
              from={receipt.from}
              txHash={receipt.hash}
              timestamp={receipt.timestamp}
              legs={receipt.legs}
              network={network}
            />
          </div>
          <Button className="mt-6 h-12 w-full rounded-full" aria-label="Share on X" onClick={share}>
            Share on
            <XMark />
          </Button>
          <Button variant="outline" className="mt-2 h-12 w-full rounded-full" disabled={saving} onClick={() => void download()}>
            {saving ? "Saving…" : "Download receipt"}
          </Button>
          {receipt.kind === "claim" ? (
            <Link href="/dashboard" className="mt-2 flex h-12 w-full items-center justify-center rounded-full border border-border text-sm font-medium hover:bg-muted">
              Back to dashboard
            </Link>
          ) : (
            <Link href="/repos" className="mt-2 flex h-12 w-full items-center justify-center rounded-full border border-border text-sm font-medium hover:bg-muted">
              Fund another repo
            </Link>
          )}
        </>
      ) : (
        <div className="py-16 text-center">
          <h1 className="font-display text-4xl">
            {receipt.status === "pending" ? "Pending." : receipt.status === "unrelated" ? "Not a receipt." : "Receipt not found"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {receipt.note || "That transaction is not an Opentip funding or claim."}
          </p>
          {receipt.repoId && receipt.project ? (
            <p className="mt-3 text-sm">
              <Link href={`/${receipt.repoId}`} className="text-brand">{receipt.project}</Link>
            </p>
          ) : null}
          <Link href="/" className="mt-4 inline-flex h-10 items-center rounded-full bg-accent px-4 text-sm text-white">Go home</Link>
        </div>
      )}
    </div>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
