"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/motion/button";
import Link from "next/link";

const NOTIFICATION_TYPES = [
  { key: "tip_received", label: "Tip received", description: "When someone tips on your repo" },
  { key: "claim_available", label: "Claim available", description: "When you can claim tips from a repo" },
  { key: "tip_sent", label: "Tip submitted", description: "When you submit a tip" },
  { key: "claim_submitted", label: "Claim submitted", description: "When you submit a claim" },
  { key: "send_out", label: "Sent", description: "When you send funds out of your wallet" },
  { key: "repo_registered", label: "Repo registered", description: "When your repo is registered" },
  { key: "security_alert", label: "Security alert", description: "When policy limits or unusual activity occur" },
];

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const userId = (session?.user as any)?.id;
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [installMode, setInstallMode] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (status === "loading" || !userId) return;
    fetch("/api/notifications/settings")
      .then((r) => r.json())
      .then((j) => setTypes(j.types ?? []))
      .catch(() => {});
    setLoading(false);
  }, [status, userId]);

  useEffect(() => {
    setInstallMode(window.matchMedia("(display-mode: standalone)").matches);
    setPermission(Notification.permission);
  }, []);

  async function toggleType(key: string) {
    const next = types.includes(key) ? types.filter((t) => t !== key) : [...types, key];
    setTypes(next);
    await fetch("/api/notifications/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ types: next }),
    }).catch(() => {});
  }

  async function subscribe() {
    if (!("serviceWorker" in navigator)) return alert("Service workers not supported");
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return alert("VAPID key not configured");
    const base64UrlToArrayBuffer = (base64Url: string) => {
      const padded = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const raw = atob(padded);
      const buf = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
      return buf.buffer;
    };
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToArrayBuffer(vapidKey),
    });
    const toBase64Url = (buf: ArrayBuffer) =>
      btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        p256Key: toBase64Url(sub.getKey("p256dh")!),
        auth: toBase64Url(sub.getKey("auth")!),
        types,
      }),
    }).catch(() => {});
  }

  async function sendTest() {
    await fetch("/api/notifications/test", { method: "POST" }).catch(() => {});
  }

  if (status === "loading" || loading) {
    return <div className="p-8 text-zinc-500">Loading notifications...</div>;
  }

  if (!userId) {
    return <div className="p-8"><Link href="/signin" className="text-blue-600 underline">Sign in</Link> to manage notifications</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <h1 className="serif text-3xl font-semibold tracking-tight">Notification Settings</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Push Notifications</h2>
        {!installMode && (
          <div className="border rule rounded-sm p-4 bg-zinc-50 text-sm text-zinc-600">
            Install Opentip as a PWA to receive push notifications.{" "}
            <a href="/install" className="text-blue-600 underline">Install</a>
          </div>
        )}
        {permission !== "granted" && (
          <div className="border rule rounded-sm p-4">
            <p className="text-sm text-zinc-600 mb-3">Enable browser notifications to receive alerts.</p>
            <Button size="sm" onClick={() => Notification.requestPermission().then(setPermission)}>
              Enable Notifications
            </Button>
          </div>
        )}
        {permission === "granted" && (
          <Button size="sm" onClick={subscribe}>Subscribe</Button>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Notification Types</h2>
        {NOTIFICATION_TYPES.map(({ key, label, description }) => (
          <label key={key} className="flex items-start gap-3 border rule rounded-sm p-3 cursor-pointer hover:bg-zinc-50 transition-colors">
            <input
              type="checkbox"
              checked={types.includes(key)}
              onChange={() => toggleType(key)}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs text-zinc-500">{description}</div>
            </div>
          </label>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Test</h2>
          <Button size="sm" variant="outline" onClick={sendTest}>Send Test</Button>
        </div>
      </section>
    </div>
  );
}
