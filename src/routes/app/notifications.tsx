import { createFileRoute } from "@tanstack/react-router";
import { Bell, Megaphone } from "lucide-react";

import { useAnnouncements, useNotifications } from "@/lib/queries";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationsPage,
});

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const { data: announcements } = useAnnouncements();

  return (
    <div className="space-y-4">
      <h1 className="font-display text-lg font-black uppercase tracking-widest">Notifications</h1>

      {(announcements ?? []).map((a) => (
        <div key={a.id} className="rounded-2xl border border-accent/40 bg-card p-4">
          <p className="flex items-center gap-2 font-display text-xs font-black uppercase tracking-widest text-accent">
            <Megaphone className="size-4" /> {a.title}
          </p>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{a.body}</p>
        </div>
      ))}

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="space-y-3">
        {(notifications ?? []).map((n) => (
          <div key={n.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 size-4 shrink-0 text-accent" />
              <div>
                <p className="font-display text-sm font-bold">{n.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {timeAgo(n.created_at)}
                </p>
              </div>
            </div>
          </div>
        ))}
        {!isLoading && (notifications?.length ?? 0) === 0 && (announcements?.length ?? 0) === 0 && (
          <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Nothing here yet. Tournament alerts, room releases and wallet updates will show up here.
          </p>
        )}
      </div>
    </div>
  );
}
