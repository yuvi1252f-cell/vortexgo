import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowUp,
  Coins,
  Gamepad2,
  Gauge,
  Gift,
  Headphones,
  Menu,
  MessageCircle,
  Scale,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trophy,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import logo from "@/assets/vortexgo-logo.png";
import heroBg from "@/assets/vortex-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VortexGo — Daily Skill-Based Gaming Tournaments & Rewards" },
      {
        name: "description",
        content:
          "Join VortexGo: daily free-entry esports tournaments, instant UPI withdrawals, fair-play matches and 24/7 support. Download the app and start winning.",
      },
      { property: "og:title", content: "VortexGo — Daily Skill-Based Gaming Tournaments & Rewards" },
      {
        property: "og:description",
        content:
          "Join VortexGo: daily free-entry esports tournaments, instant UPI withdrawals, fair-play matches and 24/7 support. Download the app and start winning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VortexGoLanding,
});

const WHATSAPP =
  "https://chat.whatsapp.com/J8yJnG0vAgu0nmfSCVDXpf?s=cl&p=a&ilr=1";

const NAV = [
  { label: "Home", href: "#home" },
  { label: "Why Us", href: "#features" },
  { label: "How It Works", href: "#how" },
  { label: "Stats", href: "#stats" },
  { label: "Rewards", href: "#rewards" },
  { label: "Download", href: "#download" },
];

const FEATURES = [
  {
    icon: Scale,
    title: "Fair Play Engine",
    body: "Every match is monitored and scored on real in-game performance. Zero bots, zero bias.",
  },
  {
    icon: Gauge,
    title: "Lightning Fast",
    body: "Built on modern tech for buttery lobbies, instant match joins and no lag drops.",
  },
  {
    icon: Trophy,
    title: "Free Entry Matches",
    body: "Pick any contest, any time slot, and jump in free. Skill decides the winner, not luck.",
  },
  {
    icon: Wallet,
    title: "Instant Withdrawal",
    body: "Move winnings to UPI or redeem gift cards within minutes, 24 hours a day.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Private",
    body: "Encrypted accounts, privacy-first setup and verified payouts on every single win.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    body: "Real humans on WhatsApp around the clock, so you are never stuck mid-tournament.",
  },
];

const STEPS = [
  {
    icon: Smartphone,
    step: "01",
    title: "Download the App",
    body: "Grab the VortexGo APK and install in under a minute.",
  },
  {
    icon: Users,
    step: "02",
    title: "Create Account",
    body: "Sign up in 30 seconds with a secure, privacy-first setup.",
  },
  {
    icon: Gamepad2,
    step: "03",
    title: "Join a Tournament",
    body: "Choose your slot, enter the lobby and drop into the match.",
  },
  {
    icon: Coins,
    step: "04",
    title: "Win & Withdraw",
    body: "Climb the leaderboard and cash out instantly to UPI.",
  },
];

const STATS = [
  { icon: Gamepad2, value: "50,000+", label: "Tournaments Hosted" },
  { icon: Users, value: "100K+", label: "Active Gamers" },
  { icon: Coins, value: "1.2L+", label: "Winnings Distributed" },
  { icon: Gift, value: "60K+", label: "Rewards Claimed" },
];

const TICKER = [
  "DAILY TOURNAMENTS",
  "INSTANT PAYOUTS",
  "FAIR PLAY",
  "FREE ENTRY",
  "REAL REWARDS",
  "24/7 SUPPORT",
];

function VortexGoLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-border bg-background/85 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <a href="#home" className="flex min-w-0 items-center gap-2">
            <img
              src={logo}
              alt="VortexGo logo"
              width={48}
              height={48}
              className="h-11 w-11 shrink-0 object-contain drop-shadow-[0_0_14px_oklch(0.62_0.25_300/0.7)]"
            />
            <span className="truncate font-display text-lg font-black tracking-widest text-gradient-vortex">
              VORTEXGO
            </span>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-accent"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href="#download"
              className="hidden rounded-full gradient-vortex px-5 py-2 font-display text-xs font-bold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-105 sm:inline-block"
            >
              Get App
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 font-display text-xs font-bold uppercase tracking-widest lg:hidden"
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              Menu
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-border bg-card/95 backdrop-blur-xl lg:hidden">
            <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2 sm:px-6">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-border py-3 font-display text-sm font-bold uppercase tracking-wider text-foreground last:border-0 hover:text-accent"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main id="home">
        {/* HERO */}
        <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
          <img
            src={heroBg}
            alt=""
            aria-hidden="true"
            width={1536}
            height={1024}
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
          <div className="absolute inset-0 hex-grid opacity-70" />
          <div className="absolute left-1/2 top-24 -z-0 size-[420px] -translate-x-1/2 rounded-full bg-primary/25 blur-[130px] animate-pulse-glow" />

          <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
            <img
              src={logo}
              alt="VortexGo esports logo"
              width={816}
              height={816}
              className="mx-auto h-40 w-40 animate-float object-contain drop-shadow-[0_0_45px_oklch(0.62_0.25_300/0.65)] sm:h-56 sm:w-56"
            />

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent backdrop-blur">
              <Sparkles className="size-3.5" />
              Season 1 Live Now
            </div>

            <h1 className="mt-5 font-display text-4xl font-black uppercase leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Enter The <span className="text-gradient-vortex">Vortex</span>
            </h1>
            <p className="mt-3 font-display text-sm font-bold uppercase tracking-[0.3em] text-accent sm:text-base">
              Play · Compete · Conquer
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground text-balance sm:text-lg">
              VortexGo is your competitive gaming destination. Join daily
              skill-based tournaments, earn real rewards instantly, and rise up
              a leaderboard built purely on skill.
            </p>

            <div className="mx-auto mt-8 flex max-w-md flex-col gap-3">
              <a
                href="#download"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl gradient-vortex px-6 py-4 font-display text-sm font-black uppercase tracking-widest text-primary-foreground neon-glow transition-transform hover:scale-[1.03]"
              >
                <Smartphone className="size-5" />
                Download App
              </a>
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-accent/40 bg-card/70 px-6 py-4 font-display text-sm font-black uppercase tracking-widest text-accent backdrop-blur transition-transform hover:scale-[1.03] cyan-glow"
              >
                <MessageCircle className="size-5" />
                WhatsApp Support
              </a>
            </div>
          </div>
        </section>

        {/* TICKER */}
        <div className="relative overflow-hidden border-y border-border bg-card/40 py-3">
          <div className="flex w-max animate-marquee gap-10 pr-10">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span
                key={`${t}-${i}`}
                className="flex items-center gap-3 font-display text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground"
              >
                <Zap className="size-3.5 text-accent" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <section id="features" className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              kicker="Why VortexGo"
              title="Built For Real Gamers"
              sub="Trusted by real players, engineered for fair play."
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <article
                  key={title}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1.5 hover:neon-border"
                >
                  <div className="absolute -right-10 -top-10 size-28 rounded-full bg-primary/20 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative flex size-12 items-center justify-center rounded-xl gradient-vortex">
                    <Icon className="size-6 text-primary-foreground" />
                  </div>
                  <h3 className="relative mt-5 font-display text-lg font-bold uppercase tracking-wide">
                    {title}
                  </h3>
                  <p className="relative mt-2 text-base leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15 animate-spin-slow" />
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              kicker="How It Works"
              title="Four Steps To Your First Win"
              sub="From install to instant payout in a single evening."
            />
            <div className="relative mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, step, title, body }) => (
                <article
                  key={step}
                  className="relative rounded-2xl border border-border bg-card/80 p-6 backdrop-blur transition-transform hover:-translate-y-1.5"
                >
                  <span className="font-display text-4xl font-black text-primary/30">
                    {step}
                  </span>
                  <div className="mt-3 flex size-11 items-center justify-center rounded-full border border-accent/40 bg-accent/10">
                    <Icon className="size-5 text-accent" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold uppercase tracking-wide">
                    {title}
                  </h3>
                  <p className="mt-2 text-base text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section
          id="stats"
          className="relative overflow-hidden border-y border-border py-16 sm:py-20"
        >
          <img
            src={heroBg}
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={1536}
            height={1024}
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-background/70" />
          <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <Icon className="mx-auto size-7 text-accent" />
                <p className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl">
                  {value}
                </p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-accent/80">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* REWARDS */}
        <section id="rewards" className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              kicker="Rewards"
              title="Win Real. Withdraw Fast."
              sub="Cash, gift cards and in-game credits — your choice."
            />
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {[
                {
                  icon: Wallet,
                  title: "UPI & Paytm",
                  body: "Direct bank transfers processed within minutes of your win.",
                },
                {
                  icon: Gift,
                  title: "Gift Cards",
                  body: "Redeem winnings for popular gaming and shopping gift cards.",
                },
                {
                  icon: Trophy,
                  title: "Season Leaderboard",
                  body: "Top the monthly rankings for bonus prize pools and badges.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-border bg-gradient-to-b from-card to-background p-7 transition-all hover:neon-border"
                >
                  <Icon className="size-8 text-primary" />
                  <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-wide">
                    {title}
                  </h3>
                  <p className="mt-2 text-base text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* DOWNLOAD CTA */}
        <section id="download" className="px-4 pb-20 sm:px-6">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-primary/30 bg-card/70 px-6 py-14 text-center backdrop-blur neon-glow sm:px-12">
            <div className="absolute inset-0 hex-grid opacity-60" />
            <div className="absolute -left-16 -top-16 size-56 rounded-full bg-primary/25 blur-[90px]" />
            <div className="absolute -bottom-16 -right-16 size-56 rounded-full bg-accent/20 blur-[90px]" />
            <div className="relative">
              <img
                src={logo}
                alt="VortexGo app icon"
                loading="lazy"
                width={816}
                height={816}
                className="mx-auto h-24 w-24 animate-float object-contain"
              />
              <h2 className="mt-6 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
                Get The <span className="text-gradient-vortex">VortexGo</span>{" "}
                App
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
                Tap below to download the Android app and start competing in
                today's tournaments. Support is one message away.
              </p>
              <div className="mx-auto mt-8 flex max-w-md flex-col gap-3">
                <a
                  href="/app"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl gradient-vortex px-6 py-4 font-display text-sm font-black uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.03]"
                >
                  <Smartphone className="size-5" />
                  Open VortexGo App
                </a>
                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-accent/40 px-6 py-4 font-display text-sm font-black uppercase tracking-widest text-accent transition-transform hover:scale-[1.03]"
                >
                  <MessageCircle className="size-5" />
                  Join WhatsApp Support
                </a>
              </div>
              <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
                18+ · Skill-based gaming · Play responsibly
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card/40 py-10">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <img
            src={logo}
            alt="VortexGo"
            loading="lazy"
            width={816}
            height={816}
            className="mx-auto h-14 w-14 object-contain"
          />
          <nav className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-accent"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <p className="mt-5 text-sm text-muted-foreground">
            © {new Date().getFullYear()}{" "}
            <span className="font-semibold text-foreground">VortexGo</span>. All
            rights reserved.
          </p>
        </div>
      </footer>

      <a
        href="#home"
        aria-label="Back to top"
        className="fixed bottom-5 right-5 z-40 flex size-12 items-center justify-center rounded-xl gradient-vortex text-primary-foreground neon-glow transition-transform hover:scale-110"
      >
        <ArrowUp className="size-5" />
      </a>
    </div>
  );
}

function SectionHeading({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="text-center">
      <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-accent">
        {kicker}
      </span>
      <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      <div className="mx-auto mt-4 h-1 w-20 rounded-full gradient-vortex" />
      <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground text-balance">
        {sub}
      </p>
    </div>
  );
}
