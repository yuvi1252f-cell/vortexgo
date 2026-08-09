import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Coins,
  Crosshair,
  Flame,
  Gift,
  Map as MapIcon,
  Megaphone,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { useAnnouncements, useProfile, useRecentWinners, useTournaments } from "@/lib/queries";
import {
  CATEGORY_LABEL,
  MODE_LABEL,
  bannerFor,
  countdown,
  formatMatchTime,
  type Category,
} from "@/lib/tournament";

export const Route = createFileRoute("/app/")({
  component: HomePage,
});

const CATEGORIES: { key: Category | "all"; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "all", label: "All", icon: Sparkles },
  { key: "survival", label: "Survival", icon: Flame },
  { key: "full_map", label: "Full Map", icon: MapIcon },
  { key: "clash_squad", label: "Clash Squad", icon: Users },
  { key: "lone_wolf", label: "Lone Wolf", icon: Crosshair },
];

const STATUS_TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Results" },
] as const;

function HomePage() {
  const { data: profile } = useProfile();
  const { data: tournaments, isLoading } = useTournaments();
  const { data: announcements } = useAnnouncements();
  const { data: winners } = useRecentWinners();
  const [category, setCategory] = useState<Category | "all">("all");
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]["key"]>("upcoming");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const list = useMemo(
    () =>
      (tournaments ?? []).filter(
        (t) =>
          t.published !== false &&
          t.status === status &&
          (category === "all" || t.category === category),
      ),
    [tournaments, status, category],
  );

  const total =
    (profile?.deposit_coins ?? 0) + (profile?.winning_coins ?? 0) + (profile?.bonus_coins ?? 0);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card p-4 glow-gold">
        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/25 blur-[70px]" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Hey {profile?.username ?? "Gamer"}
            </p>
            <p className="mt-1 flex items-center gap-2 font-display text-3xl font-black">
              <Coins className="size-6 text-accent" />
              {total}
            </p>
            <p className="text-[11px] uppercase tracking-widest text-accent">Total coins</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to="/app/wallet"
              className="rounded-xl gradient-gold px-4 py-2 font-display text-xs font-black uppercase tracking-widest text-primary-foreground"
            >
              Add Money
            </Link>
            <Link
              to="/app/wallet"
              className="rounded-xl border border-accent/40 px-4 py-2 text-center font-display text-xs font-black uppercase tracking-widest text-accent"
            >
              Withdraw
            </Link>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <MiniStat label="Deposit" value={profile?.deposit_coins ?? 0} />
          <MiniStat label="Winning" value={profile?.winning_coins ?? 0} />
          <MiniStat label="Bonus" value={profile?.bonus_coins ?? 0} />
        </div>
      </section>

      {(announcements ?? []).slice(0, 2).map((a) => (
        <div key={a.id} className="rounded-2xl border border-accent/40 bg-card p-4">
          <p className="flex items-center gap-2 font-display text-xs font-black uppercase tracking-widest text-accent">
            <Megaphone className="size-4" /> {a.title}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">{a.body}</p>
        </div>
      ))}

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {CATEGORIES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 font-display text-[11px] font-bold uppercase tracking-widest transition-colors ${
              category === key
                ? "border-transparent gradient-gold text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setStatus(t.key)}
            className={`rounded-lg py-2 font-display text-[11px] font-bold uppercase tracking-widest transition-colors ${
              status === t.key ? "bg-card text-accent" : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="py-10 text-center text-sm text-muted-foreground">Loading matches…</p>}

      {!isLoading && list.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Gift className="mx-auto size-8 text-accent" />
          <p className="mt-3 font-display text-sm font-bold uppercase tracking-wider">
            No matches here yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            New tournaments drop every few hours. Check back soon.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {list.map((t) => {
          const pct = Math.min(100, Math.round((t.filled_slots / t.total_slots) * 100));
          const full = t.filled_slots >= t.total_slots;
          return (
            <Link
              key={t.id}
              to="/app/tournament/$id"
              params={{ id: t.id }}
              className="block overflow-hidden rounded-2xl border border-border bg-card transition-transform hover:-translate-y-0.5 hover:premium-border"
            >
              <div className="relative">
                <img
                  src={bannerFor(t.category, t.banner_url)}
                  alt={t.title}
                  loading="lazy"
                  width={1280}
                  height={640}
                  className="h-36 w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-accent backdrop-blur">
                  {CATEGORY_LABEL[t.category as Category]} · {MODE_LABEL[t.mode]}
                </span>
                {t.status === "upcoming" && (
                  <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                    <Clock className="size-3" />
                    {countdown(t.match_time, now)}
                  </span>
                )}
              </div>

              <div className="p-4">
                <h3 className="line-clamp-2 font-display text-sm font-bold uppercase leading-snug tracking-wide">
                  {t.title}
                </h3>

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-border bg-background/60 p-2 text-center">
                  <Cell label="Entry" value={`${t.entry_fee}`} tone="text-accent" />
                  <Cell label="Prize Pool" value={`${t.prize_pool}`} tone="text-primary" />
                  <Cell label="Per Kill" value={`${t.per_kill}`} tone="text-foreground" />
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>{formatMatchTime(t.match_time)}</span>
                  <span>{t.map}</span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${full ? "bg-destructive" : "gradient-gold"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                  <span className={full ? "text-destructive" : "text-accent"}>
                    {full ? "Match is full" : `Only ${t.total_slots - t.filled_slots} spots left`}
                  </span>
                  <span className="text-muted-foreground">
                    {t.filled_slots}/{t.total_slots}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {(winners ?? []).length > 0 && (
        <div className="rounded-2xl border border-border glass-card p-4">
          <p className="font-display text-xs font-black uppercase tracking-widest text-accent">
            Recent winners
          </p>
          <ul className="mt-3 space-y-2">
            {(winners ?? []).slice(0, 6).map((w) => (
              <li key={w.id} className="flex items-center justify-between text-sm">
                <span className="truncate pr-2 font-semibold">{w.ff_name}</span>
                <span className="shrink-0 text-accent">+{w.prize}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-border glass-card p-4">
        <Trophy className="size-8 shrink-0 text-accent" />
        <p className="text-sm text-muted-foreground">
          Win matches, climb the season leaderboard and withdraw straight to UPI within minutes.
        </p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-2 text-center">
      <p className="font-display text-base font-black">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div>
      <p className={`font-display text-base font-black ${tone}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}
