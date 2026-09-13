import Link from "next/link";
import { Button } from "@/components/motion/button";

export const metadata = {
  title: "Page not found | Opentip",
};

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center text-center space-y-6">
      <h1 className="serif fluid-display font-semibold tracking-tight">404</h1>
      <p className="text-zinc-600 max-w-sm mx-auto">This page doesn&apos;t exist. It might have been moved or deleted.</p>
      <div><Link href="/"><Button>Go home</Button></Link></div>
    </div>
  );
}
