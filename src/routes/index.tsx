import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Brain, LineChart, Sparkles, Wand2 } from "lucide-react";
import heroBrain from "@/assets/hero-brain.png";
import { Logo } from "@/components/mm/Logo";
import { GlassCard, Progress, StatusPill } from "@/components/mm/primitives";
import { useMoneymind } from "@/lib/mm/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moneymind — Don't just track your money. Understand it." },
      {
        name: "description",
        content:
          "Moneymind reads your spending behaviour, explains the patterns in plain language and simulates how small changes reach your savings goal faster.",
      },
      { property: "og:title", content: "Moneymind — Don't just track your money. Understand it." },
      {
        property: "og:description",
        content:
          "Personalised financial behaviour intelligence: pattern detection, plain-language insights and a what-if simulator.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { loadDemo } = useMoneymind();
  const navigate = useNavigate();

  const demo = () => {
    loadDemo();
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <button
            onClick={demo}
            className="hidden rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary/70 sm:block"
          >
            Explore Demo
          </button>
          <Link
            to="/onboarding"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-10 pt-6 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:pt-14">
        <div className="rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" /> Financial behaviour intelligence
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
            Your money has patterns.{" "}
            <span className="text-gradient">Moneymind helps you see them.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Understand your spending behaviour, discover where your money is really going, and make smarter
            decisions based on your personal financial goals.
          </p>
          <p className="mt-4 text-sm text-muted-foreground/80">
            Don't just track your money. Understand it.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/onboarding"
              className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground glow-cyan transition hover:brightness-110"
            >
              Understand My Money
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
            <button
              onClick={demo}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-6 py-3.5 text-sm font-semibold transition hover:bg-secondary"
            >
              Explore Demo
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-8 rounded-full bg-primary/20 blur-3xl" aria-hidden />
          <img
            src={heroBrain}
            width={1024}
            height={1024}
            alt="Abstract glowing financial intelligence brain surrounded by spending lines, charts and goal nodes"
            className="float-slow relative mx-auto w-full max-w-lg drop-shadow-2xl"
          />
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <GlassCard className="p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <PreviewStat label="Monthly income" value="₹20,000" tone="text-foreground" />
            <PreviewStat label="Total spending" value="₹16,200" tone="text-[var(--warn)]" />
            <PreviewStat label="Saved this month" value="₹3,800" tone="text-[var(--success)]" />
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-border bg-surface-2 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Goal progress</p>
                <StatusPill status="On Track" />
              </div>
              <p className="mt-3 text-2xl font-semibold">
                ₹3,800 <span className="text-base text-muted-foreground">/ ₹5,000</span>
              </p>
              <Progress value={76} className="mt-4" />
              <div className="mt-5 flex h-24 items-end gap-2">
                {[42, 58, 51, 70, 64, 82, 76].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md"
                    style={{
                      height: `${h}%`,
                      background: "linear-gradient(180deg, var(--chart-1), transparent)",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-surface-2 p-5">
              <p className="text-sm font-medium">Detected behaviour</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Food delivery spending increased <span className="text-primary">31%</span> this month across 8
                orders.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Cutting 2 orders a week could save about{" "}
                <span className="text-[var(--success)]">₹1,200/month</span>.
              </p>
              <StatusPill status="High Impact" className="mt-4" />
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Value props */}
      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-20 sm:px-8 md:grid-cols-3">
        <Value
          icon={<Brain className="size-5" />}
          title="Understand"
          text="Discover hidden spending patterns across months, categories and weekends."
        />
        <Value
          icon={<LineChart className="size-5" />}
          title="Personalise"
          text="Get recommendations built from your behaviour, not generic budgeting tips."
        />
        <Value
          icon={<Wand2 className="size-5" />}
          title="Simulate"
          text="See what happens to your goal before you change a single habit."
        />
      </section>

      <footer className="border-t border-border px-5 py-8 text-center text-xs text-muted-foreground sm:px-8">
        Moneymind provides informational insights about financial behaviour based on the data you supply. It is
        not professional financial advice and is not connected to any bank.
      </footer>
    </div>
  );
}

function PreviewStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function Value({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <GlassCard className="transition hover:-translate-y-1 hover:glow-cyan">
      <div className="grid size-11 place-items-center rounded-2xl bg-primary/12 text-primary">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </GlassCard>
  );
}
