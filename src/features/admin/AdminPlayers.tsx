import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export function AdminPlayers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["admin-players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = (data ?? []).filter((p) =>
    q.trim()
      ? `${p.username} ${p.ff_name ?? ""} ${p.phone ?? ""} ${p.referral_code}`
          .toLowerCase()
          .includes(q.trim().toLowerCase())
      : true,
  );

  async function adjust(userId: string, bucket: string, amount: number) {
    setBusy(userId);
    const { error } = await supabase.rpc("admin_adjust_wallet", {
      p_user: userId,
      p_bucket: bucket,
      p_amount: amount,
      p_note: `Admin ${amount >= 0 ? "credit" : "debit"} (${bucket})`,
    });
    setBusy(null);
    if (error) {
      toast.error(error.message.replace(/^.*?:\s*/, ""));
      return;
    }
    toast.success("Wallet updated");
    qc.invalidateQueries({ queryKey: ["admin-players"] });
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-lg font-black uppercase tracking-widest">Players</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name, in-game name, phone or referral code"
        className="w-full rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
      />

      <div className="space-y-3">
        {rows.map((p) => (
          <PlayerCard key={p.id} p={p} busy={busy === p.id} onAdjust={adjust} />
        ))}
        {rows.length === 0 && (
          <p className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
            No players found.
          </p>
        )}
      </div>
    </div>
  );
}

function PlayerCard({
  p,
  busy,
  onAdjust,
}: {
  p: {
    id: string;
    username: string;
    ff_name: string | null;
    phone: string | null;
    referral_code: string;
    deposit_coins: number;
    winning_coins: number;
    bonus_coins: number;
  };
  busy: boolean;
  onAdjust: (userId: string, bucket: string, amount: number) => void;
}) {
  const [amount, setAmount] = useState(10);
  const [bucket, setBucket] = useState("bonus");

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-sm font-black">{p.username}</p>
          <p className="text-xs text-muted-foreground">
            {p.ff_name || "—"} · {p.phone || "no phone"} · {p.referral_code}
          </p>
        </div>
        <p className="font-display text-xl font-black text-accent">
          {p.deposit_coins + p.winning_coins + p.bonus_coins}
        </p>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        D {p.deposit_coins} · W {p.winning_coins} · B {p.bonus_coins}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <select
          value={bucket}
          onChange={(e) => setBucket(e.target.value)}
          className="rounded-lg border border-border bg-background px-2 py-2 text-xs"
        >
          <option value="bonus">Bonus</option>
          <option value="deposit">Deposit</option>
          <option value="winning">Winning</option>
        </select>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-20 rounded-lg border border-border bg-background px-2 py-2 text-xs"
        />
        <button
          onClick={() => onAdjust(p.id, bucket, amount)}
          disabled={busy}
          className="flex items-center gap-1 rounded-lg gradient-gold px-3 py-2 text-[11px] font-black uppercase text-primary-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Apply
        </button>
      </div>
    </div>
  );
}
