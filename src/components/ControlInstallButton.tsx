import { useEffect, useState } from "react";
import { CheckCircle2, Download } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Installs BARMUDA CLASH CONTROL to the home screen as its own app icon
 * (separate manifest + start_url from the player app).
 */
export function ControlInstallButton({ className = "" }: { className?: string }) {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const base =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-display text-[11px] font-black uppercase tracking-widest text-primary-foreground";

  if (installed) {
    return (
      <p className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 font-display text-[11px] font-black uppercase tracking-widest text-muted-foreground ${className}`}>
        <CheckCircle2 className="size-4 text-primary" /> Control app installed
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={async () => {
        if (!deferred) return;
        await deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
      }}
      disabled={!deferred}
      className={`${base} ${className} disabled:opacity-60`}
    >
      <Download className="size-4" />
      {deferred ? "Install Control app" : "Use browser menu → Add to Home screen"}
    </button>
  );
}
