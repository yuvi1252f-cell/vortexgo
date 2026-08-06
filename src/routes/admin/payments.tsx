import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPayments,
});

type Row = {
  id: string;
  user_id: string;
  username: string | null;
  phone: string | null;
  type: string;
  amount: number;
  status: string;
  method: string | null;
  upi_id: string | null;
  reference: string | null;
  screenshot_url: string | null;
  note: string | null;
  created_at: string;
};

function AdminPayments() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [proof, setProof] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-txns", status],
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_transactions", { p_status: status });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  async function review(id: string, approve: boolean) {
    setBusy(id);
    const { error } = await supabase.rpc("admin_review_transaction", {
      p_txn: id,
      p_approve: approve,
    });

    setBusy(null);
    if (error) {
      toast.error(error.message.replace(/^.*?:\s*/, ""));
      return;
    }
    toast.success(approve ? "Approved & wallet updated" : "Rejected");
    qc.invalidateQueries({ queryKey: ["admin-txns"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  async function openProof(path: string) {
    const { data, error } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(path, 300);
    if (error || !data) {
      toast.error("Could not open screenshot");
      return;
    }
    setProof(data.signedUrl);
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-lg font-black uppercase tracking-widest">Payments</h1>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-lg py-2 font-display text-[11px] font-bold uppercase tracking-widest ${
              status === s ? "gradient-vortex text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
      {!isLoading && (data ?? []).length === 0 && (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
          Nothing here.
        </p>
      )}

      <div className="space-y-3">
        {(data ?? []).map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-sm font-black uppercase tracking-wide">
                  {r.type === "deposit" ? "Add Money" : r.type}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.username ?? "Player"} {r.phone ? `· ${r.phone}` : ""}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("en-IN")}
                </p>
              </div>
              <p className="font-display text-2xl font-black text-accent">
                {Math.abs(r.amount)}
              </p>
            </div>

            <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
              {r.reference && <p>UTR: {r.reference}</p>}
              {r.upi_id && <p>Payout UPI: {r.upi_id}</p>}
              {r.note && <p>{r.note}</p>}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {r.screenshot_url && (
                <button
                  onClick={() => openProof(r.screenshot_url!)}
                  className="rounded-lg border border-border px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-accent"
                >
                  View screenshot
                </button>
              )}
              {r.status === "pending" && (
                <>
                  <button
                    onClick={() => review(r.id, true)}
                    disabled={busy === r.id}
                    className="flex items-center gap-1 rounded-lg gradient-vortex px-4 py-2 text-[11px] font-black uppercase tracking-wide text-primary-foreground disabled:opacity-60"
                  >
                    {busy === r.id ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    Approve
                  </button>
                  <button
                    onClick={() => review(r.id, false)}
                    disabled={busy === r.id}
                    className="flex items-center gap-1 rounded-lg border border-destructive/50 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-destructive disabled:opacity-60"
                  >
                    <X className="size-3.5" /> Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {proof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4"
          onClick={() => setProof(null)}
        >
          <img
            src={proof}
            alt="Payment screenshot"
            className="max-h-[85vh] w-auto rounded-xl border border-border object-contain"
          />
        </div>
      )}
    </div>
  );
}
