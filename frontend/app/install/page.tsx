"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      setInstalled(true);
      return;
    }
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setDeferredPrompt(null);
    });
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    (deferredPrompt as any).prompt();
    const result = await (deferredPrompt as any).userChoice;
    setDeferredPrompt(null);
    if (result.outcome === "accepted") setInstalled(true);
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20 space-y-6 text-center">
      <h1 className="serif text-3xl font-semibold tracking-tight">Install Opentip</h1>
      <p className="text-sm text-zinc-600">Add Opentip to your home screen for quick access and push notifications.</p>

      {installed && (
        <div className="border rule rounded-sm p-6">
          <p className="text-emerald-700 font-medium">Installed!</p>
          <Link href="/" className="text-accent underline">Go to dashboard</Link>
        </div>
      )}

      {!installed && deferredPrompt && (
        <button onClick={install} className="w-full py-3 bg-accent text-white rounded-sm font-medium hover:opacity-90 transition-opacity">
          Install App
        </button>
      )}

      {!installed && !deferredPrompt && (
        <div className="border rule rounded-sm p-6 text-sm text-zinc-500 space-y-3">
          <p>Use your browser's menu to install Opentip.</p>
          <Link href="/" className="text-accent underline">Go to dashboard</Link>
        </div>
      )}
    </div>
  );
}
