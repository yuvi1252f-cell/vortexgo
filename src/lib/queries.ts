import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

export function useTournaments() {
  return useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("match_time", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyEntries() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["entries", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_entries")
        .select("*, tournaments(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTransactions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["transactions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Recent winners across completed matches. */
export function useRecentWinners() {
  return useQuery({
    queryKey: ["recent-winners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_entries")
        .select("id, ff_name, prize, kills, rank, tournaments(title)")
        .gt("prize", 0)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Season leaderboard by total winnings. */
export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_entries")
        .select("ff_name, prize, kills")
        .limit(1000);
      if (error) throw error;
      const map = new Map<string, { name: string; prize: number; kills: number }>();
      for (const row of data ?? []) {
        const key = row.ff_name.trim().toLowerCase();
        const cur = map.get(key) ?? { name: row.ff_name, prize: 0, kills: 0 };
        cur.prize += row.prize ?? 0;
        cur.kills += row.kills ?? 0;
        map.set(key, cur);
      }
      return [...map.values()].sort((a, b) => b.prize - a.prize || b.kills - a.kills).slice(0, 20);
    },
  });
}

export function useRefreshWallet() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["tournaments"] });
    qc.invalidateQueries({ queryKey: ["entries"] });
  };
}

const REALTIME_MAP: Record<string, string[]> = {
  tournaments: ["tournaments", "tournament", "admin-tournaments", "admin-stats"],
  tournament_entries: [
    "tournament-entries",
    "entries",
    "admin-entries",
    "recent-winners",
    "leaderboard",
    "tournaments",
  ],
  profiles: ["profile", "admin-players", "admin-stats"],
  transactions: ["transactions", "admin-transactions", "admin-stats"],
  announcements: ["announcements", "admin-announcements"],
  notifications: ["notifications"],
  app_settings: ["settings"],
};

/**
 * Subscribes to database changes once and invalidates the matching queries so
 * every screen (slots, wallet, results, room details, announcements) stays live.
 */
export function useRealtimeSync() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel("barmuda-realtime");
    for (const [table, keys] of Object.entries(REALTIME_MAP)) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        for (const key of keys) qc.invalidateQueries({ queryKey: [key] });
      });
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
