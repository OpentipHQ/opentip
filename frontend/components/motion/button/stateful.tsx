"use client";
import { Check, Loader2, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { forwardRef, type ReactNode } from "react";
import { SPRING_SWAP } from "@/lib/ease";
import { Button, type ButtonProps } from "./base";
export type ButtonState = "idle" | "loading" | "success" | "error";
export interface StatefulButtonProps extends Omit<ButtonProps, "children"> {
  state?: ButtonState; children: ReactNode; loadingText?: ReactNode; successText?: ReactNode; errorText?: ReactNode;
}
export const StatefulButton = forwardRef<HTMLButtonElement, StatefulButtonProps>(function StatefulButton({ state = "idle", children, loadingText = "Loading", successText = "Done", errorText = "Try again", disabled, ...rest }, ref) {
  const reduce = useReducedMotion();
  const isBusy = state === "loading";
  const stateText = state === "loading" ? loadingText : state === "success" ? successText : state === "error" ? errorText : children;
  return (
    <Button ref={ref} disabled={disabled || isBusy} aria-busy={isBusy} {...rest}>
      <span className="inline-flex items-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          {state === "loading" ? <motion.span key="loading" initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="inline-flex"><Loader2 className="h-4 w-4 animate-spin" /></motion.span> : null}
          {state === "success" ? <motion.span key="success" initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="inline-flex"><Check className="h-4 w-4" /></motion.span> : null}
          {state === "error" ? <motion.span key="error" initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="inline-flex"><X className="h-4 w-4" /></motion.span> : null}
        </AnimatePresence>
        <motion.span key={String(stateText)} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }} transition={reduce ? { duration: 0.12 } : SPRING_SWAP} className="inline-flex">
          {stateText}
        </motion.span>
      </span>
    </Button>
  );
});
