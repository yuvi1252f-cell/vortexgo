import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Activity,
  Image as ImageIcon,
  IndianRupee,
  LayoutDashboard,
  Loader2,
  LogOut,
  Megaphone,
  Palette,
  ScrollText,
  Settings2,
  ShieldCheck,
  Swords,
  Trophy,
  Type,
  Users,
} from "lucide-react";

import logo from "@/assets/barmuda-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/queries";

export const Route = createFileRoute("/control")({
  head: () => ({
    meta: [
      { title: "BARMUDA CLASH CONTROL — Private Admin Console" },
      {
        name: "description",
        content:
          "Private administrator console for BARMUDA CLASH: manage content, banners, tournaments, rules, payments, players and results.",
      },
      { property: "og:title", content: "BARMUDA CLASH CONTROL" },
      { property: "og:description", content: "Private administrator console for BARMUDA CLASH." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ControlLayout,
});

export const CONTROL_NAV = [
  { to: "/control", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/control/content", label: "App Content", icon: Type, exact: false },
  { to: "/control/banners", label: "Banners", icon: ImageIcon, exact: false },
  { to: "/control/tournaments", label: "Tournaments", icon: Swords, exact: false },
  { to: "/control/rules", label: "Rules", icon: ScrollText, exact: false },
  { to: "/control/announcements", label: "Announcements", icon: Megaphone, exact: false },
  { to: "/control/payments", label: "Payments", icon: IndianRupee, exact: false },
  { to: "/control/players", label: "Players", icon: Users, exact: false },
  { to: "/control/results", label: "Results", icon: Trophy, exact: false },
  { to: "/control/settings", label: "App Settings", icon: Settings2, exact: false },
  { to: "/control/appearance", label: "Appearance", icon: Palette, exact: false },
  { to: "/control/audit", label: "Activity Log", icon: Activity, exact: false },
] as const;

function ControlShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-border glass-card p-6 text-center shadow-lg">
        {children}
      </div>
    </div>
  );
}

/** Own manifest so CONTROL installs as its own app icon, separate from the player app. */
function useControlManifest() {
  useEffect(() => {
    const links = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="manifest"]'),
    );
    const previous = links.map((l) => l.getAttribute("href"));
    links.forEach((l) => l.setAttribute("href", "/control.webmanifest"));
    if (links.length === 0) {
      const el = document.createElement("link");
      el.rel = "manifest";
      el.href = "/control.webmanifest";
      el.dataset["control"] = "1";
      document.head.appendChild(el);
    }
    return () => {
      links.forEach((l, i) => {
        const href = previous[i];
        if (href) l.setAttribute("href", href);
      });
      document.querySelector('link[data-control="1"]')?.remove();
    };
  }, []);
}

function ControlLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in to CONTROL");
  }

  return (
    <ControlShell>
      <img src={logo} alt="BARMUDA CLASH CONTROL" width={64} height={64} className="mx-auto size-14 object-contain" />
      <h1 className="mt-3 font-display text-lg font-black uppercase tracking-[0.18em]">
        Barmuda Clash
      </h1>
      <p className="font-display text-[11px] font-black uppercase tracking-[0.3em] text-primary">
        Control
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Private administrator console. Sign in with your admin account.
      </p>
      <form onSubmit={signIn} className="mt-5 space-y-2.5 text-left">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Admin email"
          className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-xs font-black uppercase tracking-widest text-primary-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          Sign in
        </button>
      </form>
      <Link to="/" className="mt-4 inline-block text-[11px] uppercase tracking-widest text-muted-foreground">
        Back to website
      </Link>
    </ControlShell>
  );
}

function ControlLayout() {
  const { user, loading, signOut } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();
  useControlManifest();

  if (loading || (user && isLoading)) {
    return (
      <ControlShell>
        <Loader2 className="mx-auto size-5 animate-spin text-primary" />
        <p className="mt-3 font-display text-[11px] uppercase tracking-widest text-muted-foreground">
          Checking access…
        </p>
      </ControlShell>
    );
  }

  if (!user) return <ControlLogin />;

  if (!isAdmin) {
    return (
      <ControlShell>
        <ShieldCheck className="mx-auto size-6 text-destructive" />
        <h1 className="mt-3 font-display text-base font-black uppercase tracking-widest text-destructive">
          Access denied
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          This account is not an administrator of BARMUDA CLASH.
        </p>
        <button
          onClick={signOut}
          className="mt-4 w-full rounded-xl border border-border py-2.5 font-display text-[11px] font-black uppercase tracking-widest text-muted-foreground"
        >
          Sign out
        </button>
      </ControlShell>
    );
  }

  return (
    <div className="min-h-screen text-foreground lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/70 backdrop-blur-xl lg:block">
        <div className="sticky top-0 flex h-screen flex-col p-4">
          <BrandMark />
          <nav className="mt-5 flex-1 space-y-1 overflow-y-auto">
            {CONTROL_NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.exact }}
                activeProps={{ className: "bg-primary/10 text-primary" }}
                inactiveProps={{ className: "text-muted-foreground hover:bg-secondary" }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold"
              >
                <n.icon className="size-4 shrink-0" />
                {n.label}
              </Link>
            ))}
          </nav>
          <SignOutButton onSignOut={signOut} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <BrandMark compact />
            <button
              onClick={signOut}
              aria-label="Sign out"
              className="ml-auto flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto px-4 pb-2">
            {CONTROL_NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.exact }}
                activeProps={{ className: "border-primary/40 bg-primary/10 text-primary" }}
                inactiveProps={{ className: "border-border text-muted-foreground" }}
                className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide"
              >
                <n.icon className="size-3.5" />
                {n.label}
              </Link>
            ))}
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl px-4 py-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src={logo} alt="BARMUDA CLASH CONTROL" width={40} height={40} className="size-8 object-contain" />
      <div className="min-w-0 leading-tight">
        <p className="truncate font-display text-[12px] font-black uppercase tracking-[0.16em]">
          Barmuda Clash
        </p>
        <p className="font-display text-[10px] font-black uppercase tracking-[0.32em] text-primary">
          {compact ? "Control" : "Control Console"}
        </p>
      </div>
    </div>
  );
}

function SignOutButton({ onSignOut }: { onSignOut: () => Promise<void> }) {
  return (
    <button
      onClick={onSignOut}
      className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 font-display text-[11px] font-black uppercase tracking-widest text-muted-foreground"
    >
      <LogOut className="size-4" /> Sign out
    </button>
  );
}
