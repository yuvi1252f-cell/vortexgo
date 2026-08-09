import { Download } from "lucide-react";

import { useSettings } from "@/lib/queries";

/**
 * Primary website CTA — starts the APK download directly.
 *
 * The APK URL comes from the backend app settings (`app_settings.apk_url`),
 * editable in Admin → App Setup → "APK download URL".
 * If no real `.apk` URL is configured yet, the button falls back to opening the
 * installable web app instead of sending users to an extra download screen.
 */
export function isApkUrl(url?: string | null): url is string {
  return !!url && /\.apk(\?|#|$)/i.test(url.trim());
}

export function DownloadAppButton({ className = "" }: { className?: string }) {
  const { data: settings } = useSettings();
  const apk = settings?.apk_url;
  const direct = isApkUrl(apk);

  const base =
    "inline-flex w-full items-center justify-center gap-2.5 rounded-2xl gradient-gold px-6 py-4 font-display text-sm font-black uppercase tracking-widest text-primary-foreground shadow-[0_16px_38px_-18px_oklch(0.56_0.21_262/55%)] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] sm:text-base";

  return (
    <a
      href={direct ? apk : "/app"}
      {...(direct ? { download: "", rel: "noopener" } : {})}
      className={`${base} ${className}`}
    >
      <Download className="size-5 shrink-0" />
      Download App
    </a>
  );
}
