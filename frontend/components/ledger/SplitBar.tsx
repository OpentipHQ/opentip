import { cn } from "@/lib/utils";

/** Fee explanation bar. Pass maintainer share in basis points (9500 = 95%). */
export function SplitBar({
  maintainerBps = 9500,
  className,
}: {
  maintainerBps?: number;
  className?: string;
}) {
  const maintainer = Math.max(0, Math.min(10000, Math.round(maintainerBps)));
  const fee = 10000 - maintainer;
  const maintainerLabel = formatBps(maintainer);
  const feeLabel = formatBps(fee);
  return (
    <div
      className={cn("flex h-1.5 w-full overflow-hidden rounded-full bg-fee", className)}
      role="img"
      aria-label={`${maintainerLabel} percent to maintainers and ${feeLabel} percent platform fee`}
    >
      <div className="h-full bg-accent" style={{ width: `${maintainer / 100}%` }} />
    </div>
  );
}

function formatBps(bps: number) {
  const n = bps / 100;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
