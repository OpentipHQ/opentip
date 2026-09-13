"use client";
import { useState } from "react";
import { Input } from "@/components/motion/input";
import { StatefulButton } from "@/components/motion/button";
import { useToast } from "@/app/providers";
import Link from "next/link";

export default function ForgotPasswordClient() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function requestReset() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/account/password/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        showToast({ status: "error", title: data.error || "Failed to send reset email" });
      }
    } catch {
      showToast({ status: "error", title: "Failed to send reset email" });
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center">
        <div className="max-w-sm w-full mx-auto space-y-10">
          <h1 className="serif fluid-display font-semibold tracking-tight leading-[0.9]">Check your email</h1>
          <p className="text-sm text-zinc-600">
            If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent a password reset link.
          </p>
          <div className="border-t rule pt-6">
            <Link href="/signin" className="text-sm text-zinc-600 underline underline-offset-4">← Back to sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center">
      <div className="max-w-sm w-full mx-auto space-y-10">
        <h1 className="serif fluid-display font-semibold tracking-tight leading-[0.9]">Reset password</h1>
        <p className="text-sm text-zinc-600">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        <div className="space-y-4">
          <Input
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            type="email"
          />
          <StatefulButton
            state={loading ? "loading" : "idle"}
            onClick={requestReset}
            className="px-6"
          >
            Send reset link
          </StatefulButton>
        </div>

        <div className="border-t rule pt-6">
          <Link href="/signin" className="text-sm text-zinc-600 underline underline-offset-4">← Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
