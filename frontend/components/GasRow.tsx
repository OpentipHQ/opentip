"use client";

// Shared Gas row for review modals (Send + Tip). Three states:
// resolving → "Estimating…"; sponsored → accent "Sponsored by Opentip";
// otherwise the USD estimate (or "Paid by you" if estimation failed).
export default function GasRow({
  sponsored,
  estimating,
  estimate,
}: {
  sponsored: boolean | null;
  estimating: boolean;
  estimate: string | null;
}) {
  return (
    <div className="flex justify-between px-3 py-2">
      <span className="text-xs text-zinc-500">Gas</span>
      {sponsored === null || estimating ? (
        <span className="stats text-xs text-zinc-500">Estimating…</span>
      ) : sponsored ? (
        <span className="stats text-xs text-accent">Sponsored by Opentip</span>
      ) : (
        <span className="stats text-xs">{estimate ? `≈ ${estimate} · you pay` : "Paid by you"}</span>
      )}
    </div>
  );
}
