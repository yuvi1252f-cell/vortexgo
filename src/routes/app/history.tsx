import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Gamepad2, Receipt } from "lucide-react";

import { useMyEntries, useTransactions } from "@/lib/queries";
import { formatMatchTime } from "@/lib/tournament";

export const Route = createFileRoute("/app/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const [tab, setTab] = useState<"matches" | "txns">("matches");
  const { data: entries } = useMyEntries();
  const { data: txns } = useTransactions();

  return (
    <div className="space-y-4">
      <h1 className="font-display text-lg font-black uppercase tracking-wide">History</h1>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
        {(["matches", "txns"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg py-2 font-display text-[11px] font-bold uppercase tracking-widest ${
              tab === t ? "bg-card text-accent" : "text-muted-foreground"
            }`}
          >
            {t === "matches" ? "My Matches" : "Transactions"}
          </button>
        ))}
      </div>

      {tab === "matches" ? (
        <div className="space-y-3">
          {(entries ?? []).map((e) => (
            <Link
              key={e.id}
              to="/app/tournament/$id"
              params={{ id: e.tournament_id }}
              className="block rounded-2xl border border-border bg-card p-4"
            >
              <p className="line-clamp-2 font-display text-sm font-bold uppercase leading-snug">
                {e.tournaments?.title ?? "Tournament"}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>{e.tournaments ? formatMatchTime(e.tournaments.match_time) : ""}</span>
                <span className="text-accent">
                  {e.rank ? `Rank #${e.rank}` : "Registered"} · {e.kills} kills
                </span>
              </div>
              <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Team {e.team_no} · Pos {e.position} · {e.ff_name}
              </div>
            </Link>
          ))}
          {(entries?.length ?? 0) === 0 && <Empty icon={Gamepad2} text="You have not joined any match yet." />}
        </div>
      ) : (
        <div className="space-y-2">
          {(txns ?? []).map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
            >
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-wider capitalize">
                  {t.type.replace("_", " ")}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {new Date(t.created_at).toLocaleString("en-IN")} · {t.status}
                </p>
              </div>
              <p
                className={`font-display text-sm font-black ${
                  t.amount >= 0 ? "text-accent" : "text-destructive"
                }`}
              >
                {t.amount >= 0 ? "+" : ""}
                {t.amount}
              </p>
            </div>
          ))}
          {(txns?.length ?? 0) === 0 && <Empty icon={Receipt} text="No transactions yet." />}
        </div>
      )}
    </div>
  );
}

function Empty({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <Icon className="mx-auto size-8 text-accent" />
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
