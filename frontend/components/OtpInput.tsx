"use client";
import { useRef, type KeyboardEvent, type ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({ length = 6, value, onChange, disabled = false, autoFocus = true }: OtpInputProps) {
  const digits = value.split("");
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function focusIndex(i: number) {
    refs.current[i]?.focus();
    refs.current[i]?.select();
  }

  function handleChange(i: number, d: string) {
    if (!/^\d*$/.test(d)) return;
    const next = d.slice(-1);
    const updated = digits.slice();
    updated[i] = next;
    const joined = updated.join("").slice(0, length);
    onChange(joined);
    if (next && i < length - 1) {
      focusIndex(i + 1);
    }
  }

  function handleKeyDown(i: number, e: KeyboardEvent) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        const updated = digits.slice();
        updated[i] = "";
        onChange(updated.join(""));
      } else if (i > 0) {
        const updated = digits.slice();
        updated[i - 1] = "";
        onChange(updated.join(""));
        focusIndex(i - 1);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      focusIndex(i - 1);
    } else if (e.key === "ArrowRight" && i < length - 1) {
      focusIndex(i + 1);
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      focusIndex(nextIndex);
    }
  }

  return (
    <div className="flex gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          value={digits[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cn(
            "w-11 h-12 text-center text-lg font-mono font-semibold text-zinc-900 caret-zinc-900",
            "bg-transparent border rounded-sm outline-none transition-colors duration-200",
            "border-hairline focus:border-accent focus:ring-1 focus:ring-accent/20",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        />
      ))}
    </div>
  );
}
