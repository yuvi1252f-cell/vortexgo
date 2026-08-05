import { createFileRoute } from "@tanstack/react-router";
import heroVisual from "@/assets/hero-visual.png";
import workVisual from "@/assets/work-visual.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ember Studio — Design & Engineering" },
      {
        name: "description",
        content:
          "Ember Studio crafts brand systems, websites, and digital products for ambitious companies. A design and engineering practice built for clarity and craft.",
      },
      { property: "og:title", content: "Ember Studio — Design & Engineering" },
      {
        property: "og:description",
        content:
          "Brand systems, websites, and digital products for ambitious companies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const services = [
  {
    no: "01",
    title: "Brand Systems",
    desc: "Identity, type, and visual languages that scale across every surface.",
  },
  {
    no: "02",
    title: "Web Experiences",
    desc: "Marketing sites and product interfaces engineered for speed and feel.",
  },
  {
    no: "03",
    title: "Product Design",
    desc: "From zero-to-one flows to mature design systems your team can build on.",
  },
  {
    no: "04",
    title: "Engineering",
    desc: "Type-safe full-stack builds shipped on modern, edge-first runtimes.",
  },
];

const work = [
  {
    client: "Northwind",
    project: "Rebrand & marketing site",
    year: "2025",
  },
  {
    client: "Lumen Health",
    project: "Product design system",
    year: "2025",
  },
  {
    client: "Atlas Capital",
    project: "Investor platform",
    year: "2024",
  },
  {
    client: "Verve Studio",
    project: "Identity & web",
    year: "2024",
  },
];

const stats = [
  { value: "120+", label: "Projects shipped" },
  { value: "14", label: "Years of craft" },
  { value: "40+", label: "Teams partnered" },
  { value: "9", label: "Awards earned" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a href="#" className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary ember-glow" />
            <span className="font-display text-2xl leading-none tracking-tight">
              Ember
            </span>
          </a>
          <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#work" className="transition-colors hover:text-foreground">
              Work
            </a>
            <a
              href="#services"
              className="transition-colors hover:text-foreground"
            >
              Services
            </a>
            <a href="#about" className="transition-colors hover:text-foreground">
              Studio
            </a>
          </div>
          <a
            href="#contact"
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Start a project
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Design & Engineering Studio
            </span>
            <h1 className="mt-8 font-display text-5xl leading-[1.02] tracking-tight text-balance sm:text-6xl md:text-7xl">
              We build brands and products with{" "}
              <span className="italic text-primary">uncommon</span> craft.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Ember is a small studio of designers and engineers partnering with
              ambitious companies to ship work that feels considered from the
              first pixel to the last commit.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#work"
                className="rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                See selected work
              </a>
              <a
                href="#contact"
                className="rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Book a call
              </a>
            </div>
          </div>
        </div>
        <div className="relative mx-auto max-w-6xl px-6 pb-4">
          <div className="overflow-hidden rounded-2xl border border-border">
            <img
              src={heroVisual}
              alt="Abstract ember-lit metal ribbons representing the studio's craft"
              width={1600}
              height={1008}
              className="h-[240px] w-full object-cover sm:h-[360px] md:h-[460px]"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="py-10 md:py-12">
              <div className="font-display text-5xl text-primary md:text-6xl">
                {s.value}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
            What we do
          </h2>
          <p className="max-w-sm text-muted-foreground">
            Four disciplines, one team. We work across the full lifecycle so the
            work holds together end to end.
          </p>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border sm:grid-cols-2">
          {services.map((s) => (
            <div
              key={s.no}
              className="group bg-card p-8 transition-colors hover:bg-secondary md:p-10"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-3xl">{s.title}</h3>
                <span className="text-sm text-muted-foreground">{s.no}</span>
              </div>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Work */}
      <section id="work" className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
              Selected work
            </h2>
            <a
              href="#contact"
              className="text-sm text-primary transition-opacity hover:opacity-80"
            >
              View all engagements →
            </a>
          </div>

          <div className="mt-12 overflow-hidden rounded-2xl border border-border">
            <img
              src={workVisual}
              alt="Studio space lit by a single warm amber beam"
              width={1200}
              height={912}
              loading="lazy"
              className="h-[200px] w-full object-cover sm:h-[300px]"
            />
          </div>

          <div className="mt-px grid gap-px border-b border-l border-border sm:grid-cols-2">
            {work.map((w) => (
              <a
                key={w.client}
                href="#contact"
                className="group flex items-center justify-between border-r border-t border-border p-7 transition-colors hover:bg-secondary md:p-9"
              >
                <div>
                  <div className="font-display text-2xl">{w.client}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {w.project}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground transition-colors group-hover:text-primary">
                  {w.year}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
              A studio, not a factory
            </h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-muted-foreground md:col-span-7">
            <p>
              We keep Ember deliberately small. Senior practitioners on every
              project, no handoffs to a junior bench, no work lost in
              translation between departments.
            </p>
            <p>
              That means fewer clients, deeper partnerships, and work we're
              proud to put our name on. We'd rather build one thing well than
              ten things fast.
            </p>
            <div className="flex flex-wrap gap-3 pt-4">
              {["Brand", "Web", "Product", "Engineering", "Strategy"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border px-4 py-1.5 text-sm text-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Contact */}
      <section
        id="contact"
        className="border-t border-border bg-card/40"
      >
        <div className="mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary ember-glow" />
          <h2 className="mt-8 font-display text-5xl leading-[1.05] tracking-tight text-balance sm:text-6xl">
            Have something worth building well?
          </h2>
          <p className="mx-auto mt-6 max-w-md text-lg text-muted-foreground">
            Tell us about it. We take on a handful of new partners each quarter.
          </p>
          <a
            href="mailto:hello@emberstudio.com"
            className="mt-9 inline-flex rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            hello@emberstudio.com
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            <span className="font-display text-xl text-foreground">Ember</span>
          </div>
          <p>© {new Date().getFullYear()} Ember Studio. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-foreground">
              Instagram
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Dribbble
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
