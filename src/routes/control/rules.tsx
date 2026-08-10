import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Plus, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { logAudit, useRules, type RuleRow } from "@/lib/content";

export const Route = createFileRoute("/control/rules")({
  component: ControlRules,
});

const CATEGORIES = [
  { value: "general", label: "General rules" },
  { value: "tournament", label: "Tournament rules" },
  { value: "match", label: "Match rules" },
  { value: "fairplay", label: "Fair play" },
  { value: "disqualification", label: "Disqualification" },
  { value: "room", label: "Room rules" },
  { value: "faq", label: "FAQ" },
];

function ControlRules() {
  const { data, isLoading } = useRules(true);
  const qc = useQueryClient();

  function refresh() {
    qc.invalidateQueries({ queryKey: ["rules"] });
  }

  async function create() {
    const next = (data?.length ?? 0) + 1;
    const { data: row, error } = await supabase
      .from("rules_sections")
      .insert({ title: "New section", category: "general", sort_order: next, published: false })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAudit("create", "rules_section", row.id, {});
    refresh();
  }

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-lg font-black uppercase tracking-widest">Rules</h1>
          <p className="text-xs text-muted-foreground">
            Players always see the latest published version.
          </p>
        </div>
        <button
          onClick={create}
          className="flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2 text-[11px] font-black uppercase tracking-wide text-primary-foreground"
        >
          <Plus className="size-3.5" /> New
        </button>
      </header>

      {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}

      <div className="space-y-3">
        {(data ?? []).map((r) => (
          <RuleCard key={r.id} rule={r} onChanged={refresh} />
        ))}
      </div>
    </div>
  );
}

function RuleCard({ rule, onChanged }: { rule: RuleRow; onChanged: () => void }) {
  const [form, setForm] = useState({
    title: rule.title,
    body: rule.body,
    category: rule.category,
    sort_order: rule.sort_order,
  });
  const [busy, setBusy] = useState(false);

  async function patch(values: Partial<RuleRow>) {
    setBusy(true);
    const { error } = await supabase.from("rules_sections").update(values).eq("id", rule.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAudit("update", "rules_section", rule.id, values as Record<string, unknown>);
    onChanged();
  }

  return (
    <div className="space-y-2 rounded-2xl border border-border glass-card p-4">
      <div className="flex items-center gap-2">
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="rounded-lg border border-border bg-background px-2 py-2 text-xs"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
          className="w-16 rounded-lg border border-border bg-background px-2 py-2 text-xs"
        />
        <button
          onClick={() => patch({ published: !rule.published })}
          className={`rounded-lg border px-3 py-2 text-[10px] font-black uppercase ${
            rule.published ? "border-primary/40 text-primary" : "border-border text-muted-foreground"
          }`}
        >
          {rule.published ? <Eye className="mr-1 inline size-3.5" /> : <EyeOff className="mr-1 inline size-3.5" />}
          {rule.published ? "Published" : "Draft"}
        </button>
        <button
          onClick={async () => {
            const { error } = await supabase.from("rules_sections").delete().eq("id", rule.id);
            if (error) {
              toast.error(error.message);
              return;
            }
            await logAudit("delete", "rules_section", rule.id, {});
            onChanged();
          }}
          aria-label="Delete section"
          className="ml-auto flex size-9 items-center justify-center rounded-lg border border-destructive/40 text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <input
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Section title"
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none"
      />
      <textarea
        rows={5}
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        placeholder="One rule per line"
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none"
      />
      <button
        onClick={() =>
          patch({
            title: form.title.trim() || "Untitled",
            body: form.body,
            category: form.category,
            sort_order: Number(form.sort_order) || 0,
          }).then(() => toast.success("Rules saved"))
        }
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 font-display text-[11px] font-black uppercase tracking-widest text-primary-foreground disabled:opacity-60"
      >
        {busy && <Loader2 className="size-4 animate-spin" />} Save section
      </button>
    </div>
  );
}
