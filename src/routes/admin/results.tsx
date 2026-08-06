import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trophy } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { formatMatchTime } from "@/lib/tournament";

export const Route = createFileRoute("/admin/results")({
  component: AdminResults,
});

function AdminResults() {
  const [tid, setTid] = useState<string>("");

  const { data: tournaments } = useQuery({
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

  const { data: entries } = useQuery({
    queryKey: ["admin-entries", tid],
    enabled: !!tid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_entries")
        .select("*")
        .eq("tournament_id", tid)
        .order("team_no", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-lg font-black uppercase tracking-widest">Results</h1>

      <select
        value={tid}
        onChange={(e) => setTid(e.target.value)}
        className="w-full rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none"
      >
        <option value="">Select a match…</option>
        {(tournaments ?? []).map((t) => (
          <option key={t.id} value={t.id}>
            {t.title} — {formatMatchTime(t.match_time)}
          </option>
        ))}
      </select>

      {tid && (entries ?? []).length === 0 && (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
          No players joined this match yet.
        </p>
      )}

      <div className="space-y-3">
        {(entries ?? []).map((e) => (
          <EntryRow key={e.id} entry={e} />
        ))}
      </div>
    </div>
  );
}

function EntryRow({
  entry,
}: {
  entry: {
    id: string;
    ff_name: string;
    team_no: number;
    position: string;
    kills: number;
    rank: number | null;
    prize: number;
  };
}) {
  const qc = useQueryClient();
  const [kills, setKills] = useState(entry.kills);
  const [rank, setRank] = useState(entry.rank ?? 0);
  const [prize, setPrize] = useState(entry.prize);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { error } = await supabase.rpc("admin_set_entry_result", {
      p_entry: entry.id,
      p_kills: kills,
      p_rank: rank || null,
      p_prize: prize,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message.replace(/^.*?:\s*/, ""));
      return;
    }
    toast.success("Result saved & prize credited");
    qc.invalidateQueries({ queryKey: ["admin-entries"] });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="font-display text-sm font-black">
        #{entry.team_no}
        {entry.position} · {entry.ff_name}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Field label="Kills" value={kills} onChange={setKills} />
        <Field label="Rank" value={rank} onChange={setRank} />
        <Field label="Prize" value={prize} onChange={setPrize} />
      </div>
      <button
        onClick={save}
        disabled={busy}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl gradient-vortex py-2.5 text-[11px] font-black uppercase tracking-widest text-primary-foreground disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Trophy className="size-4" />} Save result
      </button>
    </div>
  );
}

function Field({
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
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
      />
    </label>
  );
}
