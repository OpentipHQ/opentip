"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

export function NumberTicker({
  value,
  format,
}: {
  value: number;
  format: (n: number) => string;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce || !Number.isFinite(value)) {
      setShown(value);
      return;
    }
    const from = 0;
    const start = performance.now();
    const duration = 700;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from + (value - from) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduce]);

  return <span className="tabular-nums">{format(Number.isFinite(shown) ? shown : 0)}</span>;
}
