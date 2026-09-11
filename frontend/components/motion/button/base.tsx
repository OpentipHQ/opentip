"use client";
import { motion, useReducedMotion } from "motion/react";
import { forwardRef, type ReactNode } from "react";
import { SPRING_PRESS } from "@/lib/ease";
import { useHoverCapable } from "@/lib/hooks/use-hover-capable";
import { cn } from "@/lib/utils";
export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg" | "icon";
export interface ButtonProps extends Omit<React.ComponentPropsWithoutRef<typeof motion.button>, "children"> {
  variant?: ButtonVariant; size?: ButtonSize; pressScale?: number; children?: ReactNode;
}
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-foreground hover:bg-accent/90",
  secondary: "border rule text-zinc-900 hover:bg-zinc-900/5",
  ghost: "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-900/5",
  outline: "border rule text-zinc-900 hover:bg-zinc-900/5",
};
const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-sm",
  md: "h-9 px-4 text-sm gap-2 rounded-sm",
  lg: "h-10 px-5 text-sm gap-2 rounded-sm",
  icon: "h-8 w-8 rounded-sm",
};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = "primary", size = "md", pressScale = 0.97, className, children, ...rest }, ref) {
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();
  return (
    <motion.button ref={ref} type="button" whileTap={reduce ? undefined : { scale: pressScale }} whileHover={reduce || !canHover ? undefined : { scale: 1.02 }} transition={SPRING_PRESS} className={cn("inline-flex items-center justify-center font-medium select-none transition-colors disabled:pointer-events-none disabled:opacity-50", VARIANT_CLASS[variant], SIZE_CLASS[size], className)} {...rest}>
      {children}
    </motion.button>
  );
});
