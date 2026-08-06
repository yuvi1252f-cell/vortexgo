import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Banknote,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Loader2,
  ShieldCheck,
  Upload,
  Wallet2,
  X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useProfile, useRefreshWallet, useSettings, useTransactions } from "@/lib/queries";
import { fmtClock, upiQrDataUrl, upiUri } from "@/lib/upi";

export const Route = createFileRoute("/app/wallet")({
  component: WalletPage,
});

const QUICK = [50, 100, 200, 500];

const UPI_APPS = [
  { name: "Google Pay", scheme: "gpay" },
  { name: "PhonePe", scheme: "phonepe" },
  { name: "Paytm", scheme: "paytmmp" },
  { name: "Any UPI", scheme: "upi" },
];

function WalletPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: settings } = useSettings();
  const { data: txns } = useTransactions();
  const refresh = useRefreshWallet();

  const [tab, setTab] = useState<"add" | "withdraw">("add");
  const [amount, setAmount] = useState(100);
  const [wAmount, setWAmount] = useState(50);
  const [upi, setUpi] = useState("");
  const [busy, setBusy] = useState(false);

  // Payment session
  const [session, setSession] = useState<{ amount: number; uri: string; qr: string } | null>(null);
  const [left, setLeft] = useState(0);
  const [utr, setUtr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const minDeposit = settings?.min_deposit ?? 10;
  const minWithdraw = settings?.min_withdraw ?? 50;
  const windowSec = settings?.payment_window_seconds ?? 300;

  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(t);
          setSession(null);
          setFile(null);
          setUtr("");
          toast.error("Payment time over. Please start again.");
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [session]);

  async function startPayment() {
    if (amount < minDeposit) {
      toast.error(`Minimum add money is ${minDeposit} coins`);
      return;
    }
    if (!settings?.upi_id) {
      toast.error("Payment is not configured yet. Contact support.");
      return;
    }
    setBusy(true);
    try {
      const uri = upiUri(settings.upi_id, settings.payee_name || "VortexGo", amount, `VortexGo ${amount}`);
      const qr = settings.qr_url ? settings.qr_url : await upiQrDataUrl(uri);
      setSession({ amount, uri, qr });
      setLeft(windowSec);
    } catch {
      toast.error("Could not open payment. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitDeposit() {
    if (busy || !session) return;
    if (!file) {
      toast.error("Upload the payment screenshot");
      return;
    }
    if (utr.trim().length < 6) {
      toast.error("Enter the 12-digit UTR / transaction ID");
      return;
    }
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
      const path = `${user!.id}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("payment-proofs").upload(path, file, {
        contentType: file.type || "image/jpeg",
      });
      if (up.error) throw up.error;

      const { error } = await supabase.from("transactions").insert({
        user_id: user!.id,
        type: "deposit",
        amount: session.amount,
        status: "pending",
        method: "UPI",
        reference: utr.trim().slice(0, 40),
        screenshot_url: path,
        expires_at: new Date(Date.now() + left * 1000).toISOString(),
        note: "UPI top-up request",
      });
      if (error) throw error;

      setSession(null);
      setFile(null);
      setUtr("");
      refresh();
      toast.success("Payment submitted — coins are added once admin verifies it.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitWithdraw() {
    if (busy) return;
    if (wAmount < minWithdraw) {
      toast.error(`Minimum withdraw is ${minWithdraw} coins`);
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("request_withdrawal", {
      p_amount: wAmount,
      p_method: "UPI",
      p_upi_id: upi.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message.replace(/^.*?:\s*/, ""));
      return;
    }
    setUpi("");
    refresh();
    toast.success("Withdrawal requested — admin will approve it shortly.");
  }

  const pending = (txns ?? []).filter((t) => t.status === "pending");

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card p-4 neon-glow">
        <div className="absolute -right-10 -top-10 size-36 rounded-full bg-primary/25 blur-[70px]" />
        <p className="relative flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-accent">
          <Wallet2 className="size-4" /> My Wallet
        </p>
        <p className="relative mt-2 flex items-center gap-2 font-display text-4xl font-black">
          <Coins className="size-7 text-accent" />
          {(profile?.deposit_coins ?? 0) + (profile?.winning_coins ?? 0) + (profile?.bonus_coins ?? 0)}
        </p>
        <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Deposit", value: profile?.deposit_coins ?? 0 },
            { label: "Winning", value: profile?.winning_coins ?? 0 },
            { label: "Bonus", value: profile?.bonus_coins ?? 0 },
          ].map((b) => (
            <div key={b.label} className="rounded-xl border border-border bg-background/60 py-2">
              <p className="font-display text-lg font-black">{b.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {b.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
        {(["add", "withdraw"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg py-2 font-display text-xs font-bold uppercase tracking-widest transition-colors ${
              tab === t ? "gradient-vortex text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t === "add" ? "Add Money" : "Withdraw"}
          </button>
        ))}
      </div>

      {tab === "add" && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="font-display text-sm font-black uppercase tracking-widest">Add Coins</p>
          <p className="mt-1 text-xs text-muted-foreground">
            1 Coin = ₹{Number(settings?.coin_rate ?? 1)} · Minimum {minDeposit} coins
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-3">
            <Coins className="size-4 text-accent" />
            <input
              type="number"
              min={minDeposit}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="w-full bg-transparent font-display text-lg font-black outline-none"
            />
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => setAmount(q)}
                className={`rounded-lg border py-2 font-display text-xs font-bold ${
                  amount === q ? "border-accent text-accent" : "border-border text-muted-foreground"
                }`}
              >
                +{q}
              </button>
            ))}
          </div>

          <button
            onClick={startPayment}
            disabled={busy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl gradient-vortex py-3 font-display text-sm font-black uppercase tracking-widest text-primary-foreground neon-glow disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            Pay ₹{amount} via UPI
          </button>

          <div className="mt-4 space-y-1.5 rounded-xl border border-border bg-background/50 p-3 text-[11px] text-muted-foreground">
            <p>• Scan the QR or open any UPI app and pay the exact amount.</p>
            <p>• Upload the payment screenshot + UTR within {Math.round(windowSec / 60)} minutes.</p>
            <p>• Coins are credited after admin verification (usually a few minutes).</p>
          </div>
        </section>
      )}

      {tab === "withdraw" && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="font-display text-sm font-black uppercase tracking-widest">Withdraw Winnings</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Only winning coins can be withdrawn · Minimum {minWithdraw}
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-3">
            <Banknote className="size-4 text-accent" />
            <input
              type="number"
              min={minWithdraw}
              value={wAmount}
              onChange={(e) => setWAmount(Math.max(0, Number(e.target.value)))}
              className="w-full bg-transparent font-display text-lg font-black outline-none"
            />
          </div>
          <input
            value={upi}
            onChange={(e) => setUpi(e.target.value)}
            placeholder="Your UPI ID (example@okicici)"
            className="mt-2 w-full rounded-xl border border-border bg-background/60 px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={submitWithdraw}
            disabled={busy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl gradient-vortex py-3 font-display text-sm font-black uppercase tracking-widest text-primary-foreground disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />} Request Payout
          </button>
        </section>
      )}

      {pending.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="font-display text-xs font-black uppercase tracking-widest text-accent">
            Pending Requests
          </p>
          <div className="mt-2 space-y-2">
            {pending.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-3 py-2 text-xs"
              >
                <span className="font-semibold uppercase tracking-wide">{t.type}</span>
                <span className="font-display font-black">{t.amount}</span>
                <span className="rounded-full border border-accent/40 px-2 py-0.5 text-[10px] uppercase text-accent">
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {session && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/85 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-primary/40 bg-card p-4 pb-8">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-black uppercase tracking-widest">
                Pay ₹{session.amount}
              </p>
              <button
                onClick={() => setSession(null)}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div
              className={`mt-3 flex items-center justify-center gap-2 rounded-xl border py-2 font-display text-sm font-black ${
                left < 60 ? "border-destructive/50 text-destructive" : "border-accent/40 text-accent"
              }`}
            >
              <Clock className="size-4" /> {fmtClock(left)} left
            </div>

            <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3">
              <img
                src={session.qr}
                alt="UPI payment QR code"
                width={260}
                height={260}
                className="size-[240px] object-contain"
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3 py-2">
              <span className="truncate text-xs text-muted-foreground">{settings?.upi_id}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(settings?.upi_id ?? "");
                  toast.success("UPI ID copied");
                }}
                className="flex items-center gap-1 text-xs font-bold uppercase text-accent"
              >
                <Copy className="size-3.5" /> Copy
              </button>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {UPI_APPS.map((a) => (
                <a
                  key={a.scheme}
                  href={
                    a.scheme === "upi"
                      ? session.uri
                      : session.uri.replace("upi://", `${a.scheme}://upi/`)
                  }
                  className="rounded-lg border border-border bg-background/60 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-foreground"
                >
                  {a.name}
                </a>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <input
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="UTR / Transaction ID"
                className="w-full rounded-xl border border-border bg-background/60 px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accent/50 bg-background/60 py-3 text-xs font-bold uppercase tracking-widest text-accent"
              >
                {file ? <CheckCircle2 className="size-4" /> : <Upload className="size-4" />}
                {file ? file.name.slice(0, 24) : "Upload payment screenshot"}
              </button>
              <button
                onClick={submitDeposit}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl gradient-vortex py-3 font-display text-sm font-black uppercase tracking-widest text-primary-foreground disabled:opacity-60"
              >
                {busy && <Loader2 className="size-4 animate-spin" />} I have paid — Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
