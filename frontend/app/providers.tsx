"use client";
import { SessionProvider } from "next-auth/react";
import { createContext, useContext } from "react";
import ContextProvider from "@/context";
import { AnimatedToastStack, useAnimatedToastStack, type ToastInput } from "@/components/motion/animated-toast-stack";

type ToastCtx = { showToast: (i: ToastInput) => string; updateToast: (id: string, p: Partial<ToastInput>) => void; dismissToast: (id: string) => void };
const Ctx = createContext<ToastCtx | null>(null);
export const useToast = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast outside Providers");
  return v;
};

function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, showToast, updateToast, dismissToast } = useAnimatedToastStack({ defaultDuration: 3600, limit: 5 });
  return (
    <Ctx.Provider value={{ showToast, updateToast, dismissToast }}>
      {children}
      <AnimatedToastStack toasts={toasts} onDismiss={dismissToast} position="top-center" placement="fixed" maxVisible={3} />
    </Ctx.Provider>
  );
}

export default function Providers({ children, cookies }: { children: React.ReactNode; cookies: string | null }) {
  return (
    <SessionProvider>
      <ContextProvider cookies={cookies}>
        <ToastProvider>{children}</ToastProvider>
      </ContextProvider>
    </SessionProvider>
  );
}
