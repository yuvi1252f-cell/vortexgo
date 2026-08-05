import bannerSurvival from "@/assets/banner-survival.jpg";
import bannerFullMap from "@/assets/banner-fullmap.jpg";
import bannerClash from "@/assets/banner-clash.jpg";
import bannerLoneWolf from "@/assets/banner-lonewolf.jpg";

export type Category = "survival" | "full_map" | "clash_squad" | "lone_wolf";

export const CATEGORY_LABEL: Record<Category, string> = {
  survival: "Survival",
  full_map: "Full Map",
  clash_squad: "Clash Squad",
  lone_wolf: "Lone Wolf",
};

export const CATEGORY_BANNER: Record<Category, string> = {
  survival: bannerSurvival,
  full_map: bannerFullMap,
  clash_squad: bannerClash,
  lone_wolf: bannerLoneWolf,
};

export function bannerFor(category: string, bannerUrl?: string | null) {
  return bannerUrl || CATEGORY_BANNER[(category as Category) ?? "survival"] || bannerSurvival;
}

export function formatMatchTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function countdown(iso: string, now: number) {
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return "Started";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export const MODE_LABEL: Record<string, string> = {
  solo: "Solo",
  duo: "Duo",
  squad: "Squad",
};
