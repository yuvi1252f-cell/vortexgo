import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Banknote, Coins, Copy, Loader2, Wallet2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useProfile, useRefreshWallet, useTransactions } from "@/lib/queries";
import { UPI_ID, UPI_PAYEE_NAME } from "@/lib/constants";

export const Route = createFileRoute("/app/wallet")({
  component: WalletPage,
});

const QUICK = [50, 100, 200, 500];

const APPS = [
  { name: "Google Pay", scheme: "gpay", tone: "text-accent" },
  { name: "PhonePe", scheme: "phonepe", tone: "text-primary" },
  { name: "Paytm", scheme: "paytmmp", tone: "text-accent" },
  { name: "Any UPI App", scheme: "upi", tone: "text-foreground" },
];

function WalletPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: txns } = useTransactions();
  const refresh = useRefreshWallet();

  const [tab, setTab] = useState<"add" | "withdraw">("add");
  const [amount, setAmount] = useState(100);
  const [utr, setUtr] = useState("");
  const [wAmount, setWAmount] = useState(50);
  const [upi, setUpi] = useState("");
  const [method, setMethod] = useState("UPI");
  const [busy, setBusy] = useState(false);

  function upiLink(scheme: string) {
    const query = `pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(
      UPI_PAYEE_NAME,
    )}&am=${amount}&cu=INR&tn=${encodeURIComponent("VortexGo wallet top-up")}`;
    return scheme === "upi" ? `upi://pay?${query}` : `${scheme}://upi/pay?${query}`;
  }

  async function submitDeposit() {
    if (busy) return;
    if (amount < 10) {
      toast.error("Minimum top-up is 10 coins");
      return;
    }
    if (utr.trim().length < 6) {
      toast.error("Enter the UTR / transaction ID from your UPI app");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: user!.id,
      type: "deposit",
      amount,
      status: "pending",
      method,
      reference: utr.trim().slice(0, 40),
      note: "UPI top-up request",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setUtr("");
    refresh();
    toast.success("Top-up submitted — coins are added after payment is verified.");
  }

  async function submitWithdraw() {
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.rpc("request_withdrawal", {
      p_amount: wAmount,
      p_method: method,
      p_upi_id: upi.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message.replace(/^.*?:\s*/, ""));
      return;
    }
    setUpi("");
    refresh();
    toast.success("Withdrawal requested — payout within minutes.");
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
          <Box label="Deposited" value={profile?.deposit_coins ?? 0} />
          <Box label="Winning" value={profile?.winning_coins ?? 0} />
          <Box label="Bonus" value={profile?.bonus_coins ?? 0} />
        </div>
        <p className="relative mt-3 text-center text-[11px] uppercase tracking-widest text-muted-foreground">
          1 coin = ₹1 · Only winning coins can be withdrawn
        </p>
      </section>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
        {(["add", "withdraw"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg py-2 font-display text-[11px] font-bold uppercase tracking-widest ${
              tab === t ? "bg-card text-accent" : "text-muted-foreground"
            }`}
          >
            {t === "add" ? "Add Money" : "Withdraw"}
          </button>
        ))}
      </div>

      {tab === "add" ? (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Amount</p>
            <div className="mt-2 flex gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(q)}
                  className={`flex-1 rounded-xl border py-2 font-display text-sm font-bold ${
                    amount === q ? "border-transparent gradient-vortex text-primary-foreground" : "border-border text-muted-foreground"
                  }`}
                >
                  ₹{q}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={10}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="mt-2 w-full rounded-xl border border-border bg-background/60 px-3 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Pay with
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {APPS.map((a) => (
                <a
                  key={a.scheme}
                  href={upiLink(a.scheme)}
                  onClick={() => setMethod(a.name)}
                  className={`rounded-xl border border-border bg-background/60 py-3 text-center font-display text-xs font-bold uppercase tracking-wider ${a.tone}`}
                >
                  {a.name}
                </a>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(UPI_ID);
                toast.success("UPI ID copied");
              }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-accent/40 py-2.5 text-xs font-bold uppercase tracking-widest text-accent"
            >
              <Copy className="size-3.5" /> {UPI_ID}
            </button>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              UTR / Transaction ID
            </p>
            <input
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="Paste the 12-digit UPI reference"
              maxLength={40}
              className="mt-2 w-full rounded-xl border border-border bg-background/60 px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <button
            type="button"
            onClick={submitDeposit}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl gradient-vortex py-3 font-display text-sm font-black uppercase tracking-widest text-primary-foreground disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />} Submit Top-up
          </button>
          <p className="text-center text-[11px] uppercase tracking-widest text-muted-foreground">
            Coins are credited after payment verification
          </p>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Withdraw amount (min 50)
            </p>
            <input
              type="number"
              min={50}
              value={wAmount}
              onChange={(e) => setWAmount(Math.max(0, Number(e.target.value)))}
              className="mt-2 w-full rounded-xl border border-border bg-background/60 px-3 py-3 text-sm outline-none"
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Method</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {["UPI", "Paytm", "Redeem Code"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`rounded-xl border py-2 text-xs font-bold uppercase tracking-wider ${
                    method === m ? "border-transparent gradient-vortex text-primary-foreground" : "border-border text-muted-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              UPI ID / Mobile number
            </p>
            <input
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              placeholder="yourname@upi"
              maxLength={60}
              className="mt-2 w-full rounded-xl border border-border bg-background/60 px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="button"
            onClick={submitWithdraw}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl gradient-vortex py-3 font-display text-sm font-black uppercase tracking-widest text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Banknote className="size-4" />}
            Request Withdrawal
          </button>
        </div>
      )}

      {pending.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-accent">
            Pending requests
          </p>
          <ul className="mt-3 space-y-2">
            {pending.map((t) => (
              <li key={t.id} className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted-foreground">{t.type}</span>
                <span className="font-semibold">{Math.abs(t.amount)} coins</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Box({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-2">
      <p className="font-display text-base font-black">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}
