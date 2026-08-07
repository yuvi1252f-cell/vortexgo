import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/queries";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

type S = {
  upi_id: string;
  payee_name: string;
  qr_url: string;
  apk_url: string;
  app_version: string;
  support_url: string;
  coin_rate: number;
  min_deposit: number;
  min_withdraw: number;
  payment_window_seconds: number;
  marquee: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  update_notice: string;
  bonus_max_percent: number;
  referral_reward: number;
  referee_reward: number;
};

function AdminSettings() {
  const { data } = useSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<S | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data && !form) {
      setForm({
        upi_id: data.upi_id,
        payee_name: data.payee_name,
        qr_url: data.qr_url ?? "",
        apk_url: data.apk_url,
        app_version: data.app_version,
        support_url: data.support_url,
        coin_rate: Number(data.coin_rate),
        min_deposit: data.min_deposit,
        min_withdraw: data.min_withdraw,
        payment_window_seconds: data.payment_window_seconds,
        marquee: data.marquee,
        maintenance_mode: data.maintenance_mode,
        maintenance_message: data.maintenance_message ?? "",
        update_notice: data.update_notice ?? "",
        bonus_max_percent: data.bonus_max_percent,
        referral_reward: data.referral_reward,
        referee_reward: data.referee_reward,
      });
    }
  }, [data, form]);

  if (!form) return <p className="text-xs text-muted-foreground">Loading…</p>;

  function set<K extends keyof S>(k: K, v: S[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  async function save() {
    if (!form) return;
    setBusy(true);
    const { error } = await supabase
      .from("app_settings")
      .update({
        ...form,
        qr_url: form.qr_url.trim() || null,
        maintenance_message: form.maintenance_message.trim(),
        update_notice: form.update_notice.trim(),

      })
      .eq("id", 1);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["settings"] });
  }

  return (
    <div className="space-y-3">
      <h1 className="font-display text-lg font-black uppercase tracking-widest">App Setup</h1>

      <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <p className="font-display text-xs font-black uppercase tracking-widest text-accent">
          Payments
        </p>
        <T label="UPI ID (QR is generated from this)" v={form.upi_id} on={(v) => set("upi_id", v)} />
        <T label="Payee name" v={form.payee_name} on={(v) => set("payee_name", v)} />
        <T
          label="Custom QR image URL (optional — overrides generated QR)"
          v={form.qr_url}
          on={(v) => set("qr_url", v)}
        />
        <div className="grid grid-cols-3 gap-2">
          <N label="Coin rate ₹" v={form.coin_rate} on={(v) => set("coin_rate", v)} />
          <N label="Min add" v={form.min_deposit} on={(v) => set("min_deposit", v)} />
          <N label="Min payout" v={form.min_withdraw} on={(v) => set("min_withdraw", v)} />
        </div>
        <N
          label="Payment window (seconds)"
          v={form.payment_window_seconds}
          on={(v) => set("payment_window_seconds", v)}
        />
      </div>

      <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <p className="font-display text-xs font-black uppercase tracking-widest text-accent">
          App &amp; Support
        </p>
        <T label="APK download URL" v={form.apk_url} on={(v) => set("apk_url", v)} />
        <T label="App version" v={form.app_version} on={(v) => set("app_version", v)} />
        <T label="WhatsApp support link" v={form.support_url} on={(v) => set("support_url", v)} />
        <T label="Home ticker text" v={form.marquee} on={(v) => set("marquee", v)} />
        <T label="Update notice banner" v={form.update_notice} on={(v) => set("update_notice", v)} />
      </div>

      <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <p className="font-display text-xs font-black uppercase tracking-widest text-accent">
          Bonus &amp; Referral
        </p>
        <div className="grid grid-cols-3 gap-2">
          <N
            label="Bonus use %"
            v={form.bonus_max_percent}
            on={(v) => set("bonus_max_percent", v)}
          />
          <N label="Referrer coins" v={form.referral_reward} on={(v) => set("referral_reward", v)} />
          <N label="New user coins" v={form.referee_reward} on={(v) => set("referee_reward", v)} />
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <p className="font-display text-xs font-black uppercase tracking-widest text-accent">
          Maintenance
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.maintenance_mode}
            onChange={(e) => set("maintenance_mode", e.target.checked)}
          />
          Enable maintenance mode (players see a notice instead of the app)
        </label>
        <T
          label="Maintenance message"
          v={form.maintenance_message}
          on={(v) => set("maintenance_message", v)}
        />
      </div>

      <button
        onClick={save}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl gradient-gold py-3 font-display text-xs font-black uppercase tracking-widest text-primary-foreground disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save settings
      </button>
    </div>
  );
}

function T({ label, v, on }: { label: string; v: string; on: (x: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        value={v}
        onChange={(e) => on(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none"
      />
    </label>
  );
}

function N({ label, v, on }: { label: string; v: number; on: (x: number) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        value={v}
        onChange={(e) => on(Number(e.target.value))}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none"
      />
    </label>
  );
}
