import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Download, Share, Smartphone } from "lucide-react";

import logo from "@/assets/vortexgo-logo.png";
import { useSettings } from "@/lib/queries";

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "Download VortexGo App — Free Fire Tournaments on Your Phone" },
      {
        name: "description",
        content:
          "Install the VortexGo app on your phone in one tap. Join daily Free Fire tournaments, track your wallet and withdraw winnings to UPI.",
      },
      { property: "og:title", content: "Download the VortexGo App" },
      {
        property: "og:description",
        content: "Install VortexGo and start winning real cash in daily Free Fire tournaments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DownloadPage,
});

type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function DownloadPage() {
  const { data: settings } = useSettings();
  const [deferred, setDeferred] = useState<Prompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as Prompt);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-5 py-12 text-foreground">
      <div className="absolute inset-0 hex-grid opacity-50" />
      <div className="absolute left-1/2 top-1/4 size-72 -translate-x-1/2 rounded-full bg-primary/25 blur-[110px]" />

      <div className="relative w-full max-w-sm text-center">
        <img
          src={logo}
          alt="VortexGo app icon"
          width={816}
          height={816}
          className="mx-auto h-28 w-28 animate-float object-contain drop-shadow-[0_0_40px_oklch(0.62_0.25_300/0.6)]"
        />
        <h1 className="mt-4 font-display text-2xl font-black uppercase tracking-widest text-gradient-vortex">
          Install VortexGo
        </h1>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          Version {settings?.app_version ?? "1.0.0"} · Free
        </p>

        <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card/85 p-5 text-left backdrop-blur-xl">
          {installed ? (
            <div className="flex items-center gap-2 text-sm text-accent">
              <CheckCircle2 className="size-5" /> App installed — open it from your home screen.
            </div>
          ) : ios ? (
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-2 font-bold uppercase tracking-widest text-foreground">
                <Share className="size-4 text-accent" /> iPhone install
              </p>
              <p>1. Tap the Share button in Safari.</p>
              <p>2. Choose “Add to Home Screen”.</p>
              <p>3. Open VortexGo from your home screen.</p>
            </div>
          ) : (
            <>
              <button
                onClick={install}
                disabled={!deferred}
                className="flex w-full items-center justify-center gap-2 rounded-xl gradient-vortex py-3.5 font-display text-sm font-black uppercase tracking-widest text-primary-foreground neon-glow disabled:opacity-60"
              >
                <Download className="size-4" /> Install App
              </button>
              {!deferred && (
                <p className="text-[11px] text-muted-foreground">
                  If the button is greyed out, open this page in Chrome, tap the menu (⋮) and choose
                  “Install app” / “Add to Home screen”.
                </p>
              )}
              <a
                href={settings?.apk_url ?? "/vortexgo.apk"}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary py-3 font-display text-[11px] font-bold uppercase tracking-widest text-foreground"
              >
                <Smartphone className="size-4" /> Download APK
              </a>
            </>
          )}
        </div>

        <Link
          to="/app"
          className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-accent"
        >
          Continue in browser →
        </Link>
      </div>
    </div>
  );
}
