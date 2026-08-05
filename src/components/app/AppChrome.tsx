import { Link, useRouterState } from "@tanstack/react-router";
import { Coins, History, Home, Users, Wallet } from "lucide-react";
import logo from "@/assets/vortexgo-logo.png";

export function Splash() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 hex-grid opacity-60" />
      <div className="absolute size-[320px] rounded-full bg-primary/25 blur-[120px] animate-pulse-glow" />
      <img
        src={logo}
        alt="VortexGo"
        width={816}
        height={816}
        className="relative h-36 w-36 animate-float object-contain drop-shadow-[0_0_45px_oklch(0.62_0.25_300/0.65)]"
      />
      <p className="relative mt-6 font-display text-2xl font-black tracking-[0.3em] text-gradient-vortex">
        VORTEXGO
      </p>
      <p className="relative mt-2 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
        Play · Compete · Conquer
      </p>
      <div className="relative mt-8 h-1 w-40 overflow-hidden rounded-full bg-secondary">
        <div className="h-full w-1/2 animate-marquee rounded-full gradient-vortex" />
      </div>
    </div>
  );
}

const TABS = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/wallet", label: "Wallet", icon: Wallet, exact: false },
  { to: "/app/history", label: "History", icon: History, exact: false },
  { to: "/app/refer", label: "Refer", icon: Users, exact: false },
  { to: "/app/profile", label: "Profile", icon: Coins, exact: false },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-stretch">
        {TABS.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                active ? "text-accent" : "text-muted-foreground"
              }`}
            >
              <Icon className={`size-5 ${active ? "drop-shadow-[0_0_8px_currentColor]" : ""}`} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
