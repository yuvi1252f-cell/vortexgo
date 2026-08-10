import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/control/audit")({
  component: ControlAudit,
});

function ControlAudit() {
  const { data, isLoading } = useQuery({
    queryKey: ["control-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-lg font-black uppercase tracking-widest">Activity Log</h1>
        <p className="text-xs text-muted-foreground">Every admin change is recorded here.</p>
      </header>

      {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}

      <div className="space-y-2">
        {(data ?? []).map((r) => (
          <div key={r.id} className="rounded-xl border border-border glass-card p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-xs font-black uppercase tracking-wide">
                {r.action} · {r.entity}
              </p>
              <p className="shrink-0 text-[10px] text-muted-foreground">
                {new Date(r.created_at).toLocaleString("en-IN")}
              </p>
            </div>
            {r.entity_id && (
              <p className="mt-1 break-all text-[11px] text-muted-foreground">{r.entity_id}</p>
            )}
          </div>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="rounded-xl border border-border glass-card p-6 text-center text-xs text-muted-foreground">
            No activity yet.
          </p>
        )}
      </div>
    </div>
  );
}
