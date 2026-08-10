import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { logAudit, useContent } from "@/lib/content";

export const Route = createFileRoute("/control/content")({
  component: ControlContent,
});

const GROUP_LABEL: Record<string, string> = {
  home: "Home & hero",
  buttons: "Button labels",
  empty: "Empty states",
  info: "About, FAQ & support",
  general: "General",
  appearance: "Appearance",
};

function ControlContent() {
  const { data } = useContent();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) {
      setDraft((d) =>
        Object.keys(d).length ? d : Object.fromEntries(data.map((r) => [r.key, r.value])),
      );
    }
  }, [data]);

  const rows = (data ?? []).filter((r) => r.group_name !== "appearance");
  const groups = [...new Set(rows.map((r) => r.group_name))];

  async function save() {
    setBusy(true);
    const changed = rows.filter((r) => (draft[r.key] ?? r.value) !== r.value);
    for (const row of changed) {
      const { error } = await supabase
        .from("app_content")
        .update({ value: draft[row.key] ?? "" })
        .eq("key", row.key);
      if (error) {
        setBusy(false);
        toast.error(error.message);
        return;
      }
      await logAudit("update", "app_content", row.key, { value: draft[row.key] });
    }
    setBusy(false);
    toast.success(changed.length ? "Content saved — live in the player app" : "Nothing to save");
    qc.invalidateQueries({ queryKey: ["app-content"] });
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-lg font-black uppercase tracking-widest">App Content</h1>
        <p className="text-xs text-muted-foreground">
          Edit player-facing text without touching code.
        </p>
      </header>

      {groups.map((g) => (
        <section key={g} className="space-y-2 rounded-2xl border border-border glass-card p-4">
          <p className="font-display text-xs font-black uppercase tracking-widest text-primary">
            {GROUP_LABEL[g] ?? g}
          </p>
          {rows
            .filter((r) => r.group_name === g)
            .map((r) => (
              <label key={r.key} className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {r.label || r.key}
                </span>
                <textarea
                  rows={(draft[r.key] ?? r.value).length > 80 ? 4 : 2}
                  value={draft[r.key] ?? r.value}
                  onChange={(e) => setDraft((d) => ({ ...d, [r.key]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none"
                />
              </label>
            ))}
        </section>
      ))}

      <button
        onClick={save}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-xs font-black uppercase tracking-widest text-primary-foreground disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save content
      </button>
    </div>
  );
}
