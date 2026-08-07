import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Megaphone, Send, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/announcements")({
  component: AdminAnnouncements,
});

function AdminAnnouncements() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function publish() {
    if (title.trim().length < 3 || body.trim().length < 3) {
      toast.error("Add a title and a message");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("announcements")
      .insert({ title: title.trim(), body: body.trim(), active: true });
    if (!error && notify) {
      await supabase
        .from("notifications")
        .insert({ title: title.trim(), body: body.trim(), kind: "announcement" });
    }
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTitle("");
    setBody("");
    toast.success("Announcement published");
    qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    qc.invalidateQueries({ queryKey: ["announcements"] });
  }

  async function toggle(id: string, active: boolean) {
    const { error } = await supabase.from("announcements").update({ active }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    qc.invalidateQueries({ queryKey: ["announcements"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    qc.invalidateQueries({ queryKey: ["announcements"] });
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-lg font-black uppercase tracking-widest">Announcements</h1>

      <div className="space-y-2 rounded-2xl border border-primary/40 bg-card p-4">
        <p className="flex items-center gap-2 font-display text-xs font-black uppercase tracking-widest text-accent">
          <Megaphone className="size-4" /> New announcement
        </p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="Title"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Message shown on the player home screen"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none"
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          Also send as a notification to every player
        </label>
        <button
          onClick={publish}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl gradient-gold py-2.5 font-display text-xs font-black uppercase tracking-widest text-primary-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Publish
        </button>
      </div>

      <div className="space-y-3">
        {(data ?? []).map((a) => (
          <div key={a.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-sm font-black">{a.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => toggle(a.id, !a.active)}
                  className={`rounded-lg border px-3 py-2 text-[10px] font-black uppercase ${
                    a.active ? "border-accent/40 text-accent" : "border-border text-muted-foreground"
                  }`}
                >
                  {a.active ? "Live" : "Off"}
                </button>
                <button
                  onClick={() => remove(a.id)}
                  aria-label="Delete announcement"
                  className="flex size-9 items-center justify-center rounded-lg border border-destructive/40 text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {(data ?? []).length === 0 && (
          <p className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
            No announcements yet.
          </p>
        )}
      </div>
    </div>
  );
}
