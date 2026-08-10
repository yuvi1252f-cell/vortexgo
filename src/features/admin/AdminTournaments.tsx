import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABEL, MODE_LABEL, formatMatchTime } from "@/lib/tournament";

type Form = {
  id?: string;
  title: string;
  category: string;
  mode: string;
  map: string;
  version: string;
  banner_url: string;
  entry_fee: number;
  prize_pool: number;
  per_kill: number;
  total_slots: number;
  match_time: string;
  rules: string;
  room_id: string;
  room_password: string;
  status: string;
  published: boolean;
  room_reveal_minutes: number;
};

function localInput(iso?: string) {
  const d = iso ? new Date(iso) : new Date(Date.now() + 3 * 3600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EMPTY: Form = {
  title: "",
  category: "survival",
  mode: "solo",
  map: "BERMUDA",
  version: "TTP",
  banner_url: "",
  entry_fee: 10,
  prize_pool: 500,
  per_kill: 5,
  total_slots: 48,
  match_time: localInput(),
  rules: "",
  room_id: "",
  room_password: "",
  status: "upcoming",
  published: true,
  room_reveal_minutes: 10,
};

export function AdminTournaments() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("match_time", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  async function save() {
    if (!form) return;
    if (form.title.trim().length < 3) {
      toast.error("Enter a match title");
      return;
    }
    setBusy(true);
    const payload = {
      title: form.title.trim(),
      category: form.category as never,
      mode: form.mode as never,
      map: form.map.trim().toUpperCase(),
      version: form.version.trim().toUpperCase(),
      banner_url: form.banner_url.trim() || null,
      entry_fee: form.entry_fee,
      prize_pool: form.prize_pool,
      per_kill: form.per_kill,
      total_slots: form.total_slots,
      match_time: new Date(form.match_time).toISOString(),
      rules: form.rules.trim() || null,
      room_id: form.room_id.trim() || null,
      room_password: form.room_password.trim() || null,
      status: form.status as never,
      published: form.published,
      room_reveal_minutes: form.room_reveal_minutes,
    };
    const res = form.id
      ? await supabase.from("tournaments").update(payload).eq("id", form.id)
      : await supabase.from("tournaments").insert(payload);
    setBusy(false);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    if (!form.id && form.published) {
      await supabase.from("notifications").insert({
        title: "New tournament live",
        body: `${payload.title} — entry ${payload.entry_fee} coins, prize ${payload.prize_pool}. Join now!`,
        kind: "tournament",
      });
    }
    toast.success(form.id ? "Match updated" : "Match created");
    setForm(null);
    qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
    qc.invalidateQueries({ queryKey: ["tournaments"] });
  }

  async function togglePublish(id: string, published: boolean) {
    const { error } = await supabase.from("tournaments").update({ published }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(published ? "Match published" : "Match hidden");
    qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
    qc.invalidateQueries({ queryKey: ["tournaments"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("tournaments").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Match deleted");
    qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
    qc.invalidateQueries({ queryKey: ["tournaments"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg font-black uppercase tracking-widest">Matches</h1>
        <button
          onClick={() => setForm({ ...EMPTY, match_time: localInput() })}
          className="flex items-center gap-1 rounded-xl gradient-gold px-3 py-2 text-[11px] font-black uppercase tracking-wide text-primary-foreground"
        >
          <Plus className="size-3.5" /> New
        </button>
      </div>

      {form && (
        <div className="space-y-2 rounded-2xl border border-primary/40 bg-card p-4">
          <p className="font-display text-xs font-black uppercase tracking-widest text-accent">
            {form.id ? "Edit match" : "Create match"}
          </p>
          <Text label="Title" value={form.title} onChange={(v) => set("title", v)} />
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Category"
              value={form.category}
              onChange={(v) => set("category", v)}
              options={Object.entries(CATEGORY_LABEL).map(([k, l]) => ({ value: k, label: l }))}
            />
            <Select
              label="Mode"
              value={form.mode}
              onChange={(v) => set("mode", v)}
              options={Object.entries(MODE_LABEL).map(([k, l]) => ({ value: k, label: l }))}
            />
            <Text label="Map" value={form.map} onChange={(v) => set("map", v)} />
            <Text label="Version" value={form.version} onChange={(v) => set("version", v)} />
            <Num label="Entry fee" value={form.entry_fee} onChange={(v) => set("entry_fee", v)} />
            <Num label="Prize pool" value={form.prize_pool} onChange={(v) => set("prize_pool", v)} />
            <Num label="Per kill" value={form.per_kill} onChange={(v) => set("per_kill", v)} />
            <Num label="Total slots" value={form.total_slots} onChange={(v) => set("total_slots", v)} />
          </div>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Match time
            </span>
            <input
              type="datetime-local"
              value={form.match_time}
              onChange={(e) => set("match_time", e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none"
            />
          </label>
          <Text
            label="Banner image URL (optional)"
            value={form.banner_url}
            onChange={(v) => set("banner_url", v)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Text label="Room ID" value={form.room_id} onChange={(v) => set("room_id", v)} />
            <Text
              label="Room password"
              value={form.room_password}
              onChange={(v) => set("room_password", v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Num
              label="Room reveal (min before)"
              value={form.room_reveal_minutes}
              onChange={(v) => set("room_reveal_minutes", v)}
            />
            <Select
              label="Visibility"
              value={form.published ? "published" : "hidden"}
              onChange={(v) => set("published", v === "published")}
              options={[
                { value: "published", label: "Published" },
                { value: "hidden", label: "Hidden" },
              ]}
            />
          </div>
          <Select
            label="Status"
            value={form.status}
            onChange={(v) => set("status", v)}
            options={["upcoming", "ongoing", "completed", "cancelled"].map((s) => ({
              value: s,
              label: s,
            }))}
          />
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Rules
            </span>
            <textarea
              rows={5}
              value={form.rules}
              onChange={(e) => set("rules", e.target.value)}
              placeholder="One rule per line"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none"
            />
          </label>

          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl gradient-gold py-2.5 font-display text-xs font-black uppercase tracking-widest text-primary-foreground disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />} Save
            </button>
            <button
              onClick={() => setForm(null)}
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {(data ?? []).map((t) => (
          <div key={t.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display text-sm font-black uppercase">{t.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {CATEGORY_LABEL[t.category as keyof typeof CATEGORY_LABEL]} ·{" "}
                  {MODE_LABEL[t.mode]} · {formatMatchTime(t.match_time)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Fee {t.entry_fee} · Pool {t.prize_pool} · Kill {t.per_kill} · {t.filled_slots}/
                  {t.total_slots} · {t.status} · {t.published ? "published" : "hidden"}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => togglePublish(t.id, !t.published)}
                  aria-label={t.published ? "Hide match" : "Publish match"}
                  className={`flex size-9 items-center justify-center rounded-lg border ${
                    t.published ? "border-accent/40 text-accent" : "border-border text-muted-foreground"
                  }`}
                >
                  {t.published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
                <button
                  onClick={() =>
                    setForm({
                      id: t.id,
                      title: t.title,
                      category: t.category,
                      mode: t.mode,
                      map: t.map,
                      version: t.version,
                      banner_url: t.banner_url ?? "",
                      entry_fee: t.entry_fee,
                      prize_pool: t.prize_pool,
                      per_kill: t.per_kill,
                      total_slots: t.total_slots,
                      match_time: localInput(t.match_time),
                      rules: t.rules ?? "",
                      room_id: t.room_id ?? "",
                      room_password: t.room_password ?? "",
                      status: t.status,
                      published: t.published,
                      room_reveal_minutes: t.room_reveal_minutes,
                    })
                  }
                  aria-label="Edit"
                  className="flex size-9 items-center justify-center rounded-lg border border-border text-accent"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => remove(t.id)}
                  aria-label="Delete"
                  className="flex size-9 items-center justify-center rounded-lg border border-destructive/40 text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none"
      />
    </label>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm capitalize outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
