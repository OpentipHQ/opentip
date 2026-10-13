import { formatAmount } from "./formatAmount";
import { fmtUsd, usdValue } from "./prices";

export type ReceiptKind = "fund" | "claim";

export type ReceiptAmountLeg = {
  token: string;
  symbol: string;
  amount: string;
  maintainer: string;
};

export type ReceiptAmountLine = {
  token: string;
  amount: string;
  symbol: string;
  label: string;
};

export type ReceiptHeadline =
  | { mode: "empty" }
  | { mode: "single"; amount: string; symbol: string }
  | { mode: "usd"; usd: string; breakdown: string }
  | { mode: "stacked"; lines: ReceiptAmountLine[] };

function displayedRaw(kind: ReceiptKind, leg: ReceiptAmountLeg) {
  return kind === "claim" ? leg.maintainer : leg.amount;
}

export function receiptAmountLine(kind: ReceiptKind, leg: ReceiptAmountLeg): ReceiptAmountLine {
  const amount = formatAmount(displayedRaw(kind, leg), leg.token) ?? "0";
  return {
    token: leg.token,
    amount,
    symbol: leg.symbol,
    label: `${amount} ${leg.symbol}`,
  };
}

function hasPositivePrice(token: string, prices: Record<string, number>) {
  const price = prices[token.toLowerCase()];
  return typeof price === "number" && Number.isFinite(price) && price > 0;
}

function pricedUsd(kind: ReceiptKind, legs: ReceiptAmountLeg[], prices: Record<string, number>) {
  return legs.reduce((sum, leg) => sum + usdValue(displayedRaw(kind, leg), leg.token, prices), 0);
}

export function receiptHeadline(
  kind: ReceiptKind,
  legs: ReceiptAmountLeg[],
  prices: Record<string, number>,
): ReceiptHeadline {
  if (legs.length === 0) return { mode: "empty" };
  const lines = legs.map((leg) => receiptAmountLine(kind, leg));
  if (legs.length === 1) return { mode: "single", amount: lines[0].amount, symbol: lines[0].symbol };
  if (legs.every((leg) => hasPositivePrice(leg.token, prices))) {
    return {
      mode: "usd",
      usd: fmtUsd(pricedUsd(kind, legs, prices)),
      breakdown: lines.map((line) => line.label).join(" + "),
    };
  }
  return { mode: "stacked", lines };
}

export function claimShareTotal(
  legs: ReceiptAmountLeg[],
  prices: Record<string, number>,
): string {
  if (legs.length === 0) return "";
  const lines = legs.map((leg) => receiptAmountLine("claim", leg));
  if (legs.every((leg) => hasPositivePrice(leg.token, prices))) {
    return fmtUsd(pricedUsd("claim", legs, prices));
  }
  return lines.map((line) => line.label).join(" + ");
}
