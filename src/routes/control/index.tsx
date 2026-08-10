import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Image as ImageIcon,
  IndianRupee,
  ScrollText,
  Swords,
  Users,
} from "lucide-react";

import { ControlInstallButton } from "@/components/ControlInstallButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/control/")({
  component: ControlOverview,
});

function ControlOverview() {
  const { data } = useQuery({
    queryKey: ["control-stats"],
    refetchInterval: 20_000,
    queryFn: async () => {
      const [players, tournaments, pending, entries, banners, rules] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("tournaments").select("id", { count: "exact", head: true }),
        supabase.from("transactions").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("tournament_entries").select("id", { count: "exact", head: true }),
        supabase.from("banners").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("rules_sections").select("id", { count: "exact", head: true }).eq("published", true),
      ]);
      return {
        players: players.count ?? 0,
        tournaments: tournaments.count ?? 0,
        pending: pending.count ?? 0,
        entries: entries.count ?? 0,
        banners: banners.count ?? 0,
        rules: rules.count ?? 0,
      };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["control-audit-recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  const cards = [
    { label: "Players", value: data?.players ?? 0, icon: Users, to: "/control/players" as const },
    { label: "Tournaments", value: data?.tournaments ?? 0, icon: Swords, to: "/control/tournaments" as const },
    { label: "Pending payments", value: data?.pending ?? 0, icon: IndianRupee, to: "/control/payments" as const },
    { label: "Total joins", value: data?.entries ?? 0, icon: Activity, to: "/control/results" as const },
    { label: "Active banners", value: data?.banners ?? 0, icon: ImageIcon, to: "/control/banners" as const },
    { label: "Published rules", value: data?.rules ?? 0, icon: ScrollText, to: "/control/rules" as const },
  ];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-lg font-black uppercase tracking-widest">Overview</h1>
        <p className="text-xs text-muted-foreground">
          Everything you change here goes live in the player app instantly.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="rounded-2xl border border-border glass-card p-4 transition-colors hover:border-primary/50"
          >
            <c.icon className="size-5 text-primary" />
            <p className="mt-2 font-display text-2xl font-black">{c.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {c.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-border glass-card p-4">
        <p className="font-display text-xs font-black uppercase tracking-widest text-primary">
          Install on your phone
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add BARMUDA CLASH CONTROL to your home screen as its own app icon.
        </p>
        <ControlInstallButton className="mt-3" />
      </div>

      <div className="rounded-2xl border border-border glass-card p-4">
        <p className="font-display text-xs font-black uppercase tracking-widest text-primary">
          Recent activity
        </p>
        <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
          {(recent ?? []).map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-2">
              <span className="min-w-0 truncate">
                {r.action} · {r.entity}
              </span>
              <span className="shrink-0">{new Date(r.created_at).toLocaleString("en-IN")}</span>
            </li>
          ))}
          {(recent ?? []).length === 0 && <li>No activity recorded yet.</li>}
        </ul>
      </div>
    </div>
  );
}
