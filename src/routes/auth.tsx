import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Lock, Mail, Phone, User } from "lucide-react";

import logo from "@/assets/vortexgo-logo.png";
import heroBg from "@/assets/vortex-hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Login or Sign Up — VortexGo Tournaments" },
      {
        name: "description",
        content:
          "Create your VortexGo account or log in to join daily Free Fire tournaments, manage your wallet and withdraw winnings to UPI.",
      },
      { property: "og:title", content: "Login or Sign Up — VortexGo Tournaments" },
      {
        property: "og:description",
        content: "Create your VortexGo account and start competing in daily cash tournaments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Tab = "login" | "signup" | "forgot";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(72);

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [ffName, setFfName] = useState("");
  const [phone, setPhone] = useState("");
  const [referral, setReferral] = useState("");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/app", replace: true });
  }, [loading, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) {
      toast.error(parsedEmail.error.issues[0]!.message);
      return;
    }

    setBusy(true);
    try {
      if (tab === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("Password reset link sent to your email");
        setTab("login");
        return;
      }

      const parsedPass = passwordSchema.safeParse(password);
      if (!parsedPass.success) {
        toast.error(parsedPass.error.issues[0]!.message);
        return;
      }

      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsedEmail.data,
          password: parsedPass.data,
        });
        if (error) throw error;
        toast.success("Welcome back, gamer!");
        navigate({ to: "/app", replace: true });
        return;
      }

      if (username.trim().length < 3) {
        toast.error("Username must be at least 3 characters");
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: parsedEmail.data,
        password: parsedPass.data,
        options: {
          emailRedirectTo: `${window.location.origin}/app`,
          data: {
            username: username.trim().slice(0, 30),
            ff_name: ffName.trim().slice(0, 30),
            phone: phone.trim().slice(0, 15),
            referral_code: referral.trim().toUpperCase().slice(0, 12),
          },
        },
      });
      if (error) throw error;
      toast.success("Account created! You are ready to play.");
      navigate({ to: "/app", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Try email instead.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/app", replace: true });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        width={1536}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
      <div className="absolute inset-0 hex-grid opacity-60" />

      <div className="relative w-full max-w-sm">
        <div className="text-center">
          <img
            src={logo}
            alt="VortexGo"
            width={816}
            height={816}
            className="mx-auto h-24 w-24 animate-float object-contain drop-shadow-[0_0_35px_oklch(0.62_0.25_300/0.6)]"
          />
          <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-widest text-gradient-vortex">
            VortexGo
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Enter the arena
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-lg py-2 font-display text-xs font-bold uppercase tracking-widest transition-colors ${
                  tab === t
                    ? "gradient-vortex text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {t === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <Field icon={Mail}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </Field>

            {tab !== "forgot" && (
              <Field icon={Lock}>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </Field>
            )}

            {tab === "signup" && (
              <>
                <Field icon={User}>
                  <input
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    maxLength={30}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </Field>
                <Field icon={User}>
                  <input
                    value={ffName}
                    onChange={(e) => setFfName(e.target.value)}
                    placeholder="In-game name (simple font only)"
                    maxLength={30}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </Field>
                <Field icon={Phone}>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Mobile number"
                    maxLength={15}
                    inputMode="tel"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </Field>
                <Field icon={User}>
                  <input
                    value={referral}
                    onChange={(e) => setReferral(e.target.value.toUpperCase())}
                    placeholder="Referral code (optional)"
                    maxLength={12}
                    className="w-full bg-transparent text-sm uppercase outline-none placeholder:text-muted-foreground"
                  />
                </Field>
              </>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl gradient-vortex py-3 font-display text-sm font-black uppercase tracking-widest text-primary-foreground neon-glow disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {tab === "login" ? "Login" : tab === "signup" ? "Create Account" : "Send Reset Link"}
            </button>
          </form>

          {tab !== "forgot" && (
            <>
              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  or
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <button
                type="button"
                onClick={googleSignIn}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary py-3 font-display text-xs font-bold uppercase tracking-widest text-foreground disabled:opacity-60"
              >
                Continue with Google
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setTab(tab === "forgot" ? "login" : "forgot")}
            className="mt-4 w-full text-center text-xs font-semibold uppercase tracking-wider text-accent"
          >
            {tab === "forgot" ? "Back to login" : "Forgot password?"}
          </button>
        </div>

        <p className="mt-5 text-center text-[11px] uppercase tracking-widest text-muted-foreground">
          18+ · Skill-based gaming · Play responsibly
        </p>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-3">
      <Icon className="size-4 shrink-0 text-accent" />
      {children}
    </label>
  );
}
