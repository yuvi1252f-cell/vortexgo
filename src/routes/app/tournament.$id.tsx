import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Clock, KeyRound, Loader2, ShieldAlert, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useProfile, useRefreshWallet } from "@/lib/queries";
import { CATEGORY_LABEL, MODE_LABEL, bannerFor, countdown, formatMatchTime, type Category } from "@/lib/tournament";

export const Route = createFileRoute("/app/tournament/$id")({
  component: TournamentPage,
});

function TournamentPage() {
  const { id } = useParams({ from: "/app/tournament/$id" });
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const refresh = useRefreshWallet();

  const [tab, setTab] = useState<"description" | "members">("description");
  const [ffName, setFfName] = useState("");
  const [joining, setJoining] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const { data: tournament, isLoading } = useQuery({
    queryKey: ["tournament", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tournaments").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: entries } = useQuery({
    queryKey: ["tournament-entries", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_entries")
        .select("id,user_id,ff_name,team_no,position")
        .eq("tournament_id", id)
        .order("team_no");
      if (error) throw error;
      return data ?? [];
    },
  });

  const joined = !!entries?.some((e) => e.user_id === user?.id);

  const { data: room } = useQuery({
    queryKey: ["room", id, joined],
    enabled: joined,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_room_credentials", { p_tournament: id });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  useEffect(() => {
    if (profile?.ff_name && !ffName) setFfName(profile.ff_name);
  }, [profile?.ff_name, ffName]);

  async function join() {
    if (joining) return;
    if (!ffName.trim()) {
      toast.error("Enter your in-game name");
      return;
    }
    setJoining(true);
    const { error } = await supabase.rpc("join_tournament", {
      p_tournament: id,
      p_ff_name: ffName.trim(),
    });
    setJoining(false);
    if (error) {
      toast.error(error.message.replace(/^.*?:\s*/, ""));
      return;
    }
    toast.success("Joined! Room ID will appear here before the match.");
    refresh();
    qc.invalidateQueries({ queryKey: ["tournament", id] });
    qc.invalidateQueries({ queryKey: ["tournament-entries", id] });
  }

  if (isLoading) return <p className="py-16 text-center text-sm text-muted-foreground">Loading match…</p>;
  if (!tournament)
    return (
      <div className="py-16 text-center">
        <p className="font-display text-sm uppercase tracking-widest">Match not found</p>
        <Link to="/app" className="mt-3 inline-block text-sm text-accent">
          Back to lobby
        </Link>
      </div>
    );

  const balance =
    (profile?.deposit_coins ?? 0) + (profile?.winning_coins ?? 0) + (profile?.bonus_coins ?? 0);
  const full = tournament.filled_slots >= tournament.total_slots;

  return (
    <div className="space-y-4">
      <Link to="/app" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        <ArrowLeft className="size-4" /> Back
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative">
          <img
            src={bannerFor(tournament.category, tournament.banner_url)}
            alt={tournament.title}
            width={1280}
            height={640}
            className="h-44 w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-accent backdrop-blur">
            {CATEGORY_LABEL[tournament.category as Category]} · {MODE_LABEL[tournament.mode]}
          </span>
          {tournament.status === "upcoming" && (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
              <Clock className="size-3" />
              {countdown(tournament.match_time, now)}
            </span>
          )}
        </div>

        <div className="p-4">
          <h1 className="font-display text-base font-black uppercase leading-snug tracking-wide">
            {tournament.title}
          </h1>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Info label="Entry Fee" value={`${tournament.entry_fee}`} />
            <Info label="Prize Pool" value={`${tournament.prize_pool}`} />
            <Info label="Per Kill" value={`${tournament.per_kill}`} />
            <Info label="Type" value={MODE_LABEL[tournament.mode] ?? tournament.mode} />
            <Info label="Map" value={tournament.map} />
            <Info label="Version" value={tournament.version} />
          </div>

          <p className="mt-3 text-center text-xs font-semibold uppercase tracking-widest text-accent">
            {formatMatchTime(tournament.match_time)}
          </p>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full ${full ? "bg-destructive" : "gradient-gold"}`}
              style={{
                width: `${Math.min(100, (tournament.filled_slots / tournament.total_slots) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {tournament.filled_slots}/{tournament.total_slots} slots filled
          </p>
        </div>
      </div>

      {joined && (
        <div className="rounded-2xl border border-accent/40 bg-card p-4">
          <p className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-accent">
            <KeyRound className="size-4" /> Room credentials
          </p>
          {room?.room_id ? (
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <Info label="Room ID" value={room.room_id} />
              <Info label="Password" value={room.room_password ?? "—"} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              You are registered. Room ID and password appear here shortly before the match starts.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
        {(["description", "members"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg py-2 font-display text-[11px] font-bold uppercase tracking-widest ${
              tab === t ? "bg-card text-accent" : "text-muted-foreground"
            }`}
          >
            {t === "description" ? "Description" : `Joined (${entries?.length ?? 0})`}
          </button>
        ))}
      </div>

      {tab === "description" ? (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-accent">
            <ShieldAlert className="size-4" /> Match rules
          </p>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {tournament.rules ?? "Standard YUVIX fair-play rules apply."}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Screen recording must be ON from the moment ID &amp; password are shared.</li>
            <li>• Team-up and unregistered players are strictly not allowed.</li>
            <li>• Missing your match means no refund.</li>
            <li>• Save your full HUD POV for at least 24 hours for anti-cheat checks.</li>
            <li>• Write your in-game name in simple font only — no symbols.</li>
          </ul>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-accent">
            <Users className="size-4" /> Joined members
          </p>
          <ul className="mt-3 space-y-2">
            {(entries ?? []).map((e) => (
              <li key={e.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Team {e.team_no} · Pos {e.position}
                </span>
                <span className="font-semibold">{e.ff_name}</span>
              </li>
            ))}
            {(entries?.length ?? 0) === 0 && (
              <li className="text-sm text-muted-foreground">No players yet — be the first.</li>
            )}
          </ul>
        </div>
      )}

      {!joined && tournament.status === "upcoming" && (
        <div className="sticky bottom-20 rounded-2xl border border-primary/30 bg-card p-4 glow-gold">
          <input
            value={ffName}
            onChange={(e) => setFfName(e.target.value)}
            placeholder="Your in-game name (simple font)"
            maxLength={30}
            className="w-full rounded-xl border border-border bg-background/60 px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="mt-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
            <span className="text-muted-foreground">Payable</span>
            <span className="text-accent">{tournament.entry_fee} coins</span>
          </div>
          <button
            type="button"
            onClick={join}
            disabled={joining || full || balance < tournament.entry_fee}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl gradient-gold py-3 font-display text-sm font-black uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {joining && <Loader2 className="size-4 animate-spin" />}
            {full ? "Match is full" : balance < tournament.entry_fee ? "Low balance" : "Join Now"}
          </button>
          {balance < tournament.entry_fee && (
            <Link
              to="/app/wallet"
              className="mt-2 block text-center text-xs font-bold uppercase tracking-widest text-accent"
            >
              Add money to wallet
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-2">
      <p className="font-display text-sm font-black">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}
