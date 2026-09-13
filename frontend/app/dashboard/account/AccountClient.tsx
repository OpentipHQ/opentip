"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, StatefulButton } from "@/components/motion/button";
import { Input } from "@/components/motion/input";
import { Loader } from "@/components/motion/loader";
import { useToast } from "@/app/providers";
import Link from "next/link";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

interface AccountStatus {
  hasGithub: boolean;
  hasEmail: boolean;
  hasPassword: boolean;
  email: string | null;
  githubLogin: string | null;
}

export default function AccountClient() {
  const { status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const { showToast } = useToast();

  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/account/status");
      const data = await res.json();
      setAccountStatus(data);
    } catch {
      showToast({ status: "error", title: "Failed to load account status" });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchStatus();
    }
  }, [status, fetchStatus]);

  useEffect(() => {
    const linked = params.get("linked");
    const error = params.get("error");
    if (linked === "github") {
      showToast({ status: "success", title: "GitHub connected" });
      fetchStatus();
      router.replace("/dashboard/account");
    }
    if (error) {
      const messages: Record<string, string> = {
        invalid_state: "Invalid OAuth state",
        oauth_failed: "GitHub OAuth failed",
        github_fetch_failed: "Failed to fetch GitHub info",
        github_taken: "This GitHub account is already linked to another user",
        internal: "Something went wrong",
      };
      showToast({ status: "error", title: messages[error] || "Error" });
      router.replace("/dashboard/account");
    }
  }, [params, fetchStatus, router, showToast]);

  async function connectGithub() {
    try {
      const res = await fetch("/api/account/github/link", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast({ status: "error", title: data.error || "Failed to start GitHub linking" });
      }
    } catch {
      showToast({ status: "error", title: "Failed to start GitHub linking" });
    }
  }

  async function saveEmail() {
    if (!email.trim()) return;
    setEmailSaving(true);
    try {
      const res = await fetch("/api/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({ status: "success", title: "Email added" });
        setEmail("");
        fetchStatus();
      } else {
        showToast({ status: "error", title: data.error || "Failed to save email" });
      }
    } catch {
      showToast({ status: "error", title: "Failed to save email" });
    }
    setEmailSaving(false);
  }

  async function savePassword() {
    setPasswordError(undefined);
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordSaving(true);
    try {
      const body: any = { newPassword };
      if (accountStatus?.hasPassword && currentPassword) {
        body.currentPassword = currentPassword;
      }
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        showToast({ status: "success", title: accountStatus?.hasPassword ? "Password changed" : "Password set" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        fetchStatus();
      } else {
        setPasswordError(data.error);
        showToast({ status: "error", title: data.error || "Failed to save password" });
      }
    } catch {
      setPasswordError("Failed to save password");
      showToast({ status: "error", title: "Failed to save password" });
    }
    setPasswordSaving(false);
  }

  if (status === "loading" || loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader variant="spinner" size={24} />
      </div>
    );
  }

  if (!accountStatus) return null;

  return (
    <div className="max-w-xl space-y-12">
      <div>
        <h1 className="serif text-3xl font-semibold tracking-tight leading-[0.9]">Account</h1>
        <p className="text-sm text-zinc-500 mt-2">Manage your sign-in options and security.</p>
      </div>

      {/* GitHub */}
      <section className="space-y-4">
        <div className="border-t rule" />
        <h2 className="text-sm font-medium text-zinc-900">GitHub</h2>
        {accountStatus.hasGithub ? (
          <div className="flex items-center gap-3">
            <GithubIcon className="h-5 w-5 text-zinc-700" />
            <span className="text-sm text-zinc-700">
              Connected as <span className="font-medium">{accountStatus.githubLogin}</span>
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-zinc-500">
              Connect your GitHub account to register repos and verify ownership.
            </p>
            <Button onClick={connectGithub} size="sm" className="px-4">
              <GithubIcon className="h-4 w-4" /> Connect GitHub
            </Button>
          </div>
        )}
      </section>

      {/* Email */}
      <section className="space-y-4">
        <div className="border-t rule" />
        <h2 className="text-sm font-medium text-zinc-900">Email</h2>
        {accountStatus.hasEmail ? (
          <p className="text-sm text-zinc-700">
            {accountStatus.email}
            <span className="text-zinc-400 ml-2">(cannot be changed)</span>
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-zinc-500">
              Add an email to enable password sign-in and reset.
            </p>
            <div className="flex gap-3">
              <Input
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                type="email"
              />
              <div className="flex items-end">
                <StatefulButton
                  state={emailSaving ? "loading" : "idle"}
                  onClick={saveEmail}
                  className="px-4"
                  size="sm"
                >
                  Save
                </StatefulButton>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Password */}
      <section className="space-y-4">
        <div className="border-t rule" />
        <h2 className="text-sm font-medium text-zinc-900">Password</h2>
        {accountStatus.hasPassword ? (
          <p className="text-sm text-zinc-500">
            Change your password below.
          </p>
        ) : (
          <p className="text-sm text-zinc-500">
            Set a password to sign in with email.
          </p>
        )}

        <div className="space-y-3">
          {accountStatus.hasPassword && (
            <Input
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="••••••••"
              type="password"
            />
          )}
          <Input
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="••••••••"
            type="password"
          />
          <Input
            label="Confirm password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
            type="password"
            error={passwordError}
            reserveErrorLine
          />
          <StatefulButton
            state={passwordSaving ? "loading" : "idle"}
            onClick={savePassword}
            className="px-6"
          >
            {accountStatus.hasPassword ? "Change password" : "Set password"}
          </StatefulButton>
        </div>

        {accountStatus.hasPassword && (
          <Link
            href="/forgot-password"
            className="text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-700"
          >
            Forgot your password?
          </Link>
        )}
      </section>
    </div>
  );
}
