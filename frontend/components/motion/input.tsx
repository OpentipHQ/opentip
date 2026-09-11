"use client";
// beui.dev/components/motion/input — light
import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react";
import { forwardRef, useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange"> {
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  error?: string | boolean;
  reserveErrorLine?: boolean;
  success?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  classNames?: { root?: string; label?: string; field?: string; input?: string; leftIcon?: string; rightIcon?: string; errorMessage?: string };
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, value: valueProp, defaultValue, onChange, onFocus, onBlur, error, reserveErrorLine = false, success, leftIcon, rightIcon, className, classNames, disabled, id: idProp, type, ...rest }, ref) {
  const reactId = useId();
  const id = idProp ?? reactId;
  const reduce = useReducedMotion();
  const controlled = valueProp !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const value = controlled ? (valueProp ?? "") : internal;
  const [focused, setFocused] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : null;
  const rightSlot = success ? null : rightIcon;
  useEffect(() => {
    if (!fieldRef.current || reduce || !hasError) return;
    animate(fieldRef.current, { x: [0, -6, 6, -4, 4, -2, 0] }, { duration: 0.45 });
  }, [hasError, reduce]);
  const handleChange = (next: string) => { if (!controlled) setInternal(next); onChange?.(next); };
  return (
    <div className={cn("flex flex-col gap-1.5", className, classNames?.root)}>
      {label ? <label htmlFor={id} className={cn("px-1 text-sm font-medium text-zinc-900", classNames?.label)}>{label}</label> : null}
      <div ref={fieldRef} data-state={hasError ? "error" : success ? "success" : focused ? "focused" : "idle"} className={cn("relative h-9 overflow-hidden rounded-sm border transition-colors duration-200", "border-hairline bg-transparent", focused && !hasError && "border-accent ring-1 ring-accent/20", hasError && "border-red-500 ring-1 ring-red-500/20", disabled && "opacity-60", classNames?.field)}>
        {leftIcon ? <span className={cn("pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-zinc-500 [&_svg]:h-4 [&_svg]:w-4", classNames?.leftIcon)}>{leftIcon}</span> : null}
        <input ref={ref} id={id} type={type} value={value} disabled={disabled} aria-invalid={hasError || undefined} aria-describedby={errorMessage ? `${id}-error` : undefined} {...rest} onChange={(e) => handleChange(e.target.value)} onFocus={(e) => { setFocused(true); onFocus?.(e); }} onBlur={(e) => { setFocused(false); onBlur?.(e); }} className={cn("peer h-full w-full bg-transparent text-base leading-6 text-zinc-900 caret-zinc-900 outline-none", "placeholder:text-zinc-500", leftIcon ? "pl-10" : "pl-3.5", rightSlot || success ? "pr-10" : "pr-3.5", disabled && "cursor-not-allowed", classNames?.input)} />
        {rightSlot ? <span className={cn("absolute right-0 top-0 flex h-full items-center text-zinc-500 [&_button]:grid [&_button]:size-11 [&_button]:place-items-center [&_svg]:h-4 [&_svg]:w-4", classNames?.rightIcon)}>{rightSlot}</span> : null}
      </div>
      <div className={reserveErrorLine ? "min-h-4" : "contents"}>
        <AnimatePresence initial={false}>
          {errorMessage ? <motion.p id={`${id}-error`} role="alert" initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, filter: "blur(4px)" }} transition={{ duration: 0.2 }} className={cn("px-1 text-xs text-red-400", classNames?.errorMessage)}>{errorMessage}</motion.p> : null}
        </AnimatePresence>
      </div>
    </div>
  );
});
