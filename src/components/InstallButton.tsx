import { useEffect, useState } from "react";
import { CheckCircle2, Download, Smartphone } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function standalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Single install entry point for BARMUDA CLASH.
 * Shows "Install App" when the browser offers installation, "Open App" once
 * installed, and falls back to the guided /download page otherwise.
 */
export function InstallButton({ className = "" }: { className?: string }) {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(standalone());

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
    "group inline-flex items-center justify-center gap-2 rounded-2xl gradient-gold px-6 py-4 font-display text-sm font-black uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.03]";

  if (installed) {
    return (
      <a href="/app" className={`${base} ${className}`}>
        <CheckCircle2 className="size-5" />
        Open BARMUDA CLASH App
      </a>
    );
  }

  if (deferred) {
    return (
      <button
        type="button"
        className={`${base} ${className}`}
        onClick={async () => {
          await deferred.prompt();
          const choice = await deferred.userChoice;
          if (choice.outcome === "accepted") setInstalled(true);
          setDeferred(null);
        }}
      >
        <Download className="size-5" />
        Install App
      </button>
    );
  }

  return (
    <a href="/download" className={`${base} ${className}`}>
      <Smartphone className="size-5" />
      Install BARMUDA CLASH App
    </a>
  );
}
