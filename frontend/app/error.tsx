"use client";
import { Button } from "@/components/motion/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center text-center space-y-6">
      <h1 className="font-display text-4xl tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground max-w-sm mx-auto">{error.message || "An unexpected error occurred."}</p>
      <div><Button onClick={reset}>Try again</Button></div>
    </div>
  );
}
