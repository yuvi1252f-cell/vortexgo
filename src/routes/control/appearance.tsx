import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { logAudit, useContent } from "@/lib/content";

export const Route = createFileRoute("/control/appearance")({
  component: ControlAppearance,
});

function ControlAppearance() {
  const { data } = useContent();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const rows = (data ?? []).filter((r) => r.group_name === "appearance");

  useEffect(() => {
    if (rows.length && !Object.keys(draft).length) {
      setDraft(Object.fromEntries(rows.map((r) => [r.key, r.value])));
    }
  }, [rows, draft]);

  async function save() {
    setBusy(true);
    for (const row of rows) {
      const value = draft[row.key] ?? row.value;
      if (value === row.value) continue;
      const { error } = await supabase.from("app_content").update({ value }).eq("key", row.key);
      if (error) {
        setBusy(false);
        toast.error(error.message);
        return;
      }
      await logAudit("update", "appearance", row.key, { value });
    }
    setBusy(false);
    toast.success("Appearance saved");
    qc.invalidateQueries({ queryKey: ["app-content"] });
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-lg font-black uppercase tracking-widest">Appearance</h1>
        <p className="text-xs text-muted-foreground">
          Brand name, tagline and accent shown across the player app.
        </p>
      </header>

      <section className="space-y-2 rounded-2xl border border-border glass-card p-4">
        {rows.map((r) => (
          <label key={r.key} className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {r.label || r.key}
            </span>
            <input
              value={draft[r.key] ?? r.value}
              onChange={(e) => setDraft((d) => ({ ...d, [r.key]: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none"
            />
          </label>
        ))}
        {rows.length === 0 && (
          <p className="text-xs text-muted-foreground">No appearance settings available.</p>
        )}
      </section>

      <button
        onClick={save}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-xs font-black uppercase tracking-widest text-primary-foreground disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save appearance
      </button>
    </div>
  );
}
