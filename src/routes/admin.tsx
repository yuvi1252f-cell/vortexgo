import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BarChart3, IndianRupee, Settings2, Swords, Trophy, Users } from "lucide-react";

import logo from "@/assets/yuvix-logo.png";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/queries";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "YUVIX Admin — Tournament & Payment Control Panel" },
      {
        name: "description",
        content:
          "Admin control panel for YUVIX: create tournaments, set prizes and entry fees, approve UPI payments and withdrawals, and publish match results.",
      },
      { property: "og:title", content: "YUVIX Admin Control Panel" },
      {
        property: "og:description",
        content: "Manage tournaments, payments, players and results for YUVIX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Dash", icon: BarChart3, exact: true },
  { to: "/admin/tournaments", label: "Matches", icon: Swords, exact: false },
  { to: "/admin/payments", label: "Payments", icon: IndianRupee, exact: false },
  { to: "/admin/results", label: "Results", icon: Trophy, exact: false },
  { to: "/admin/players", label: "Players", icon: Users, exact: false },
  { to: "/admin/settings", label: "Setup", icon: Settings2, exact: false },
] as const;

function AdminLayout() {
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  if (loading || !user || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-display text-xs uppercase tracking-widest text-muted-foreground">
          Checking access…
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <h1 className="font-display text-xl font-black uppercase tracking-widest text-destructive">
          Admins only
        </h1>
        <p className="text-sm text-muted-foreground">
          This account does not have admin access to YUVIX.
        </p>
        <Link
          to="/app"
          className="rounded-xl gradient-gold px-5 py-2.5 font-display text-xs font-black uppercase tracking-widest text-primary-foreground"
        >
          Back to app
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
          <img src={logo} alt="YUVIX" width={48} height={48} className="h-8 w-8 object-contain" />
          <span className="font-display text-sm font-black tracking-widest text-gradient-gold">
            ADMIN PANEL
          </span>
          <Link
            to="/app"
            className="ml-auto rounded-full border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
          >
            Player view
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto grid max-w-3xl grid-cols-6">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.exact }}
              activeProps={{ className: "text-accent" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex flex-col items-center gap-1 py-2.5"
            >
              <t.icon className="size-4" />
              <span className="text-[9px] font-bold uppercase tracking-wide">{t.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
