"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const userId = (session?.user as any)?.id;
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading" || !userId) return;
    fetch("/api/notifications/history")
      .then((r) => r.json())
      .then((j) => setNotifications(j.notifications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, userId]);

  async function markAllRead() {
    await fetch("/api/notifications/mark-all-read", { method: "POST" }).catch(() => {});
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" }).catch(() => {});
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  async function clearAll() {
    await fetch("/api/notifications/clear", { method: "POST" }).catch(() => {});
    setNotifications([]);
  }

  if (status === "loading") {
    return <div className="p-8 text-zinc-500">Loading notifications...</div>;
  }

  if (!userId) {
    return <div className="p-8"><Link href="/signin" className="text-blue-600 underline">Sign in</Link> to view notifications</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="serif text-3xl font-semibold tracking-tight">Notifications</h1>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="text-sm text-accent hover:underline">Mark all as read</button>
          <button onClick={clearAll} className="text-sm text-red-600 hover:underline">Clear all</button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-zinc-500">Loading...</div>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-zinc-500">No notifications yet.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`border rule rounded-sm p-3 text-sm cursor-pointer transition-opacity hover:opacity-80 ${n.read ? "opacity-60" : ""}`}
              onClick={() => markRead(n.id)}
            >
              <div className="font-medium">{n.title}</div>
              <div className="text-xs text-zinc-500">{n.body}</div>
              <div className="text-xs text-zinc-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}

      <Link href="/dashboard/notifications" className="text-sm text-accent hover:underline">Notification settings →</Link>
    </div>
  );
}
