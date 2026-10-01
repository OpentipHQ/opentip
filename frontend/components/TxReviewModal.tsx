"use client";
import Modal from "@/components/motion/modal";
import { Button } from "@/components/motion/button";
import GasRow from "@/components/GasRow";

export type ReviewRow = { label: string; value: React.ReactNode };
export type GasInfo = {
  sponsored: boolean | null;
  estimating: boolean;
  estimate: string | null;
};

// The divide-y summary box shared by every money-out review step.
export function TxReviewRows({ rows, gas }: { rows: ReviewRow[]; gas?: GasInfo | null }) {
  return (
    <div className="divide-y rule border rule rounded-sm">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between px-3 py-2">
          <span className="text-xs text-zinc-500">{r.label}</span>
          <span className="stats text-xs">{r.value}</span>
        </div>
      ))}
      {gas && <GasRow sponsored={gas.sponsored} estimating={gas.estimating} estimate={gas.estimate} />}
    </div>
  );
}

// Complete review modal: summary + error + cancel/confirm.
export default function TxReviewModal({
  open,
  onClose,
  title,
  rows,
  gas,
  onConfirm,
  confirming,
  confirmLabel,
  error,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  rows: ReviewRow[];
  gas?: GasInfo | null;
  onConfirm: () => void;
  confirming: boolean;
  confirmLabel: string;
  error?: string | undefined;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-3">
        <TxReviewRows rows={rows} gas={gas} />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" className="flex-1" onClick={onClose} disabled={confirming}>
            Cancel
          </Button>
          <Button size="sm" className="flex-1" onClick={onConfirm} disabled={confirming}>
            {confirming ? "Sending..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
