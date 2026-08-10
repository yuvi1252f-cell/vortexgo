import {Link} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, Swords, TrendingUp, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    refetchInterval: 20_000,
    queryFn: async () => {
      const [players, tournaments, pending, entries] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("tournaments").select("id", { count: "exact", head: true }),
        supabase.from("transactions").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("tournament_entries").select("id", { count: "exact", head: true }),
      ]);
      return {
        players: players.count ?? 0,
        tournaments: tournaments.count ?? 0,
        pending: pending.count ?? 0,
        entries: entries.count ?? 0,
      };
    },
  });

  const cards = [
    { label: "Players", value: data?.players ?? 0, icon: Users, to: "/admin/players" },
    { label: "Matches", value: data?.tournaments ?? 0, icon: Swords, to: "/admin/tournaments" },
    { label: "Pending Payments", value: data?.pending ?? 0, icon: IndianRupee, to: "/admin/payments" },
    { label: "Total Joins", value: data?.entries ?? 0, icon: TrendingUp, to: "/admin/results" },
  ] as const;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-lg font-black uppercase tracking-widest">Control Center</h1>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
          >
            <c.icon className="size-5 text-accent" />
            <p className="mt-2 font-display text-3xl font-black">{c.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {c.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <p className="font-display text-xs font-black uppercase tracking-widest text-accent">
          Quick guide
        </p>
        <ul className="mt-2 space-y-1.5 text-xs">
          <li>• Matches — create/edit tournaments, banners, prizes, entry fee, room ID &amp; password.</li>
          <li>• Payments — verify UPI screenshots, approve or reject add-money and payouts.</li>
          <li>• Results — set kills, rank and prize; winnings credit automatically.</li>
          <li>• Setup — change payment QR/UPI, APK link, limits and the app ticker text.</li>
        </ul>
      </div>
    </div>
  );
}
