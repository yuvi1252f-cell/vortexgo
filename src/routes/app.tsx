import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Coins, MessageCircle } from "lucide-react";

import logo from "@/assets/barmuda-logo.png";
import { BottomNav, Splash } from "@/components/app/AppChrome";
import { useAuth } from "@/lib/auth";
import { useProfile, useRealtimeSync, useSettings } from "@/lib/queries";
import { WHATSAPP_SUPPORT } from "@/lib/constants";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "BARMUDA CLASH App — Join Free Fire Tournaments & Win Real Cash" },
      {
        name: "description",
        content:
          "Play daily Survival, Full Map, Clash Squad and Lone Wolf tournaments on BARMUDA CLASH. Track your wallet, withdraw to UPI and climb the leaderboard.",
      },
      { property: "og:title", content: "BARMUDA CLASH App — Join Tournaments & Win Real Cash" },
      {
        property: "og:description",
        content:
          "Daily skill-based tournaments, instant UPI withdrawals and 24/7 support inside the BARMUDA CLASH app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [splash, setSplash] = useState(true);
  const { data: profile } = useProfile();
  const { data: settings } = useSettings();
  useRealtimeSync();

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  if (splash || loading || !user) return <Splash />;

  if (settings?.maintenance_mode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <img src={logo} alt="BARMUDA CLASH" width={816} height={816} className="h-24 w-24 object-contain" />
        <h1 className="font-display text-xl font-black uppercase tracking-widest text-gradient-gold">
          Under maintenance
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {settings.maintenance_message ||
            "BARMUDA CLASH is being upgraded. Matches will be back shortly — thanks for your patience."}
        </p>
        <a
          href={WHATSAPP_SUPPORT}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl gradient-gold px-5 py-2.5 font-display text-xs font-black uppercase tracking-widest text-primary-foreground"
        >
          Contact support
        </a>
      </div>
    );
  }

  const coins =
    (profile?.deposit_coins ?? 0) + (profile?.winning_coins ?? 0) + (profile?.bonus_coins ?? 0);

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-2.5">
          <Link to="/app" className="flex items-center gap-2">
            <img src={logo} alt="BARMUDA CLASH" width={48} height={48} className="h-8 w-8 object-contain" />
            <span className="font-display text-sm font-black tracking-widest text-gradient-gold">
              BARMUDA CLASH
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/app/wallet"
              className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-card px-3 py-1.5 font-display text-xs font-bold text-accent"
            >
              <Coins className="size-4" />
              {coins}
            </Link>
            <a
              href={WHATSAPP_SUPPORT}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp support"
              className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-accent"
            >
              <MessageCircle className="size-4" />
            </a>
            <Link
              to="/app/notifications"
              aria-label="Notifications"
              className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"
            >
              <Bell className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {settings?.update_notice ? (
        <div className="mx-auto max-w-lg px-4 pt-3">
          <p className="rounded-xl border border-accent/40 bg-card px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-accent">
            {settings.update_notice}
          </p>
        </div>
      ) : null}

      <main className="mx-auto max-w-lg px-4 py-4">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
