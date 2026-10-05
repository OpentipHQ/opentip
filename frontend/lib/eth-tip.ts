// ETH has no hardcoded price. A missing or zero quote must not skip the $1 minimum.
export function ethTipAmountError(amount: number, ethPrice: number | undefined | null): string | undefined {
  if (typeof ethPrice !== "number" || !Number.isFinite(ethPrice) || ethPrice <= 0) {
    return "ETH price is unavailable. Try again shortly.";
  }
  if (amount * ethPrice < 1) return "Minimum tip is $1";
  return undefined;
}
