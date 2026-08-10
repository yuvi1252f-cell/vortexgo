import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ContentRow = Database["public"]["Tables"]["app_content"]["Row"];
export type BannerRow = Database["public"]["Tables"]["banners"]["Row"];
export type RuleRow = Database["public"]["Tables"]["rules_sections"]["Row"];

/** All editable player-facing strings, keyed by content key. */
export function useContent() {
  return useQuery({
    queryKey: ["app-content"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_content")
        .select("*")
        .order("group_name")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as ContentRow[];
    },
  });
}

/** Reads a single content value with a safe fallback. */
export function useText(key: string, fallback = "") {
  const { data } = useContent();
  const row = data?.find((r) => r.key === key);
  const value = row?.value?.trim();
  return value ? value : fallback;
}

export function useBanners(adminView = false) {
  return useQuery({
    queryKey: ["banners", adminView ? "all" : "active"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as BannerRow[];
      if (adminView) return rows;
      const now = Date.now();
      return rows.filter(
        (b) =>
          b.active &&
          (!b.starts_at || new Date(b.starts_at).getTime() <= now) &&
          (!b.ends_at || new Date(b.ends_at).getTime() >= now),
      );
    },
  });
}

export function useRules(adminView = false) {
  return useQuery({
    queryKey: ["rules", adminView ? "all" : "published"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rules_sections")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as RuleRow[];
      return adminView ? rows : rows.filter((r) => r.published);
    },
  });
}

/**
 * Keeps the player app in sync with BARMUDA CLASH CONTROL edits without a new
 * build: any change to content, banners, rules, announcements or matches
 * invalidates the matching queries immediately.
 */
export function useLiveContentSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("player-live-content")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_content" }, () =>
        qc.invalidateQueries({ queryKey: ["app-content"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () =>
        qc.invalidateQueries({ queryKey: ["banners"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "rules_sections" }, () =>
        qc.invalidateQueries({ queryKey: ["rules"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () =>
        qc.invalidateQueries({ queryKey: ["announcements"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "tournaments" }, () =>
        qc.invalidateQueries({ queryKey: ["tournaments"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

/** Records an admin action in the activity log. Never throws. */
export async function logAudit(
  action: string,
  entity: string,
  entityId?: string | null,
  details: Record<string, unknown> = {},
) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("admin_audit_log").insert({
      actor: data.user.id,
      action,
      entity,
      entity_id: entityId ?? null,
      details: details as never,
    });
  } catch {
    /* logging must never block an admin action */
  }
}
