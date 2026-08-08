import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, Gift, Share2, Users } from "lucide-react";

import { useProfile } from "@/lib/queries";

export const Route = createFileRoute("/app/refer")({
  component: ReferPage,
});

function ReferPage() {
  const { data: profile } = useProfile();
  const code = profile?.referral_code ?? "——————";
  const link = typeof window !== "undefined" ? `${window.location.origin}/auth?ref=${code}` : "";

  async function share() {
    const text = `Join me on BARMUDA CLASH — daily Free Fire tournaments with instant UPI payouts. Use my referral code ${code}: ${link}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "BARMUDA CLASH", text });
        return;
      } catch {
        /* user cancelled */
      }
    }
    navigator.clipboard?.writeText(text);
    toast.success("Invite copied — paste it in WhatsApp");
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-lg font-black uppercase tracking-wide">Refer &amp; Earn</h1>

      <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card p-6 text-center glow-gold">
        <div className="absolute inset-0 hex-grid opacity-60" />
        <Gift className="relative mx-auto size-10 text-accent" />
        <p className="relative mt-3 font-display text-xl font-black uppercase tracking-wide">
          Get <span className="text-gradient-gold">15 coins</span> per friend
        </p>
        <p className="relative mt-1 text-sm text-muted-foreground">
          Your friend gets 10 bonus coins on sign-up too.
        </p>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(code);
            toast.success("Referral code copied");
          }}
          className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accent/60 bg-background/60 py-4 font-display text-xl font-black tracking-[0.3em] text-accent"
        >
          {code}
          <Copy className="size-4" />
        </button>

        <button
          type="button"
          onClick={share}
          className="relative mt-3 flex w-full items-center justify-center gap-2 rounded-xl gradient-gold py-3 font-display text-sm font-black uppercase tracking-widest text-primary-foreground"
        >
          <Share2 className="size-4" /> Share Invite
        </button>
      </section>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-accent">
          <Users className="size-4" /> How it works
        </p>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>1. Share your code with friends.</li>
          <li>2. They enter it while creating their BARMUDA CLASH account.</li>
          <li>3. You instantly get 15 bonus coins, they get 10.</li>
          <li>4. Bonus coins can be used as entry fee for any match.</li>
        </ol>
      </div>
    </div>
  );
}
