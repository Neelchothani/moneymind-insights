import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Clock,
  Flame,
  Info,
  Lightbulb,
  Percent,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Counter, EmptyState, GlassCard, Progress, SectionTitle, StatusPill } from "@/components/mm/primitives";
import { inr } from "@/lib/mm/types";
import { useMoneymind } from "@/lib/mm/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/risk")({
  head: () => ({
    meta: [
      { title: "Spending Risk Forecast — Moneymind" },
      {
        name: "description",
        content: "Understand when, where, and under what circumstances your spending is most likely to drift off track.",
      },
    ],
  }),
  component: SpendingRiskPage,
});

export function SpendingRiskPage() {
  const { risk, hasData, loadDemo } = useMoneymind();

  if (!hasData || !risk.hasEnoughData) {
    return (
      <div className="mx-auto max-w-2xl py-16 space-y-6">
        <EmptyState
          icon={<ShieldAlert className="size-6" />}
          title="Not enough behavioural data yet"
          message="Moneymind needs at least 15 transactions across different days to identify your recurring spending-risk windows."
          action={
            <div className="mt-4 flex flex-col items-center gap-3 w-full max-w-xs">
              <div className="w-full">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Logged Expense Rows</span>
                  <span className="font-semibold text-foreground">
                    {risk.txCount} / {risk.requiredTxCount} Needed
                  </span>
                </div>
                <Progress value={(risk.txCount / risk.requiredTxCount) * 100} />
              </div>
              <button
                onClick={loadDemo}
                className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-cyan transition hover:brightness-110"
              >
                Load Demo Statement Data
              </button>
            </div>
          }
        />
      </div>
    );
  }

  const {
    score,
    level,
    factors,
    patternProfile,
    weeklyHeatmap,
    diurnalWindows,
    highRiskWindows,
    upcomingForecast,
    nextWatchOut,
    preventiveAdvice,
  } = risk;

  // Visual status config
  const riskTierConfig = {
    LOW: {
      color: "text-[var(--success)]",
      bg: "bg-[var(--success)]/10",
      border: "border-[var(--success)]/30",
      glow: "shadow-[0_0_30px_-5px_rgba(22,163,74,0.3)]",
      desc: "Spending velocity is steady with low probability of impulsive deviation.",
    },
    MODERATE: {
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/30",
      glow: "glow-cyan",
      desc: "Spending fluctuates noticeably around weekends and post-income windows.",
    },
    HIGH: {
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/30",
      glow: "shadow-[0_0_35px_-5px_rgba(239,68,68,0.35)]",
      desc: "High behavioural clustering detected in weekend dining, food delivery, and shopping.",
    },
    ELEVATED: {
      color: "text-destructive",
      bg: "bg-destructive/15",
      border: "border-destructive/40",
      glow: "shadow-[0_0_45px_-5px_rgba(239,68,68,0.5)]",
      desc: "Immediate risk of discretionary overshoot threatening monthly savings target.",
    },
  }[level];

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" /> Early Warning System
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Based on your historical spending behaviour
            </span>
          </div>
          <SectionTitle
            title="Spending Risk Forecast"
            subtitle="Understand when, where, and under what circumstances your spending is most likely to drift off track."
          />
        </div>

        <div className="rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-xs text-muted-foreground">
          Updated dynamically from {risk.txCount} transactions
        </div>
      </div>

      {/* 2. Main Risk Score Hero Card & 3. Pattern Archetype */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1.7fr]">
        {/* Radial Risk Meter */}
        <GlassCard className={cn("flex flex-col items-center justify-center p-8 text-center sm:p-10", riskTierConfig.glow)}>
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-4">
            Your Spending Risk
          </p>

          <div className="relative flex items-center justify-center">
            {/* Pulsing ring indicator */}
            <div className={cn("absolute inset-0 rounded-full blur-2xl opacity-40", riskTierConfig.bg)} />
            <div
              className={cn(
                "relative flex size-44 items-center justify-center rounded-full border-4 bg-surface-2 transition-all duration-700",
                riskTierConfig.border,
              )}
            >
              <div className="text-center">
                <span className="text-5xl font-extrabold tracking-tight sm:text-6xl text-foreground">
                  <Counter value={score} duration={1100} />
                </span>
                <span className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">
                  / 100
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-4 py-1 text-xs font-bold uppercase tracking-wider",
                riskTierConfig.bg,
                riskTierConfig.color,
                riskTierConfig.border,
              )}
            >
              <Flame className="size-3.5" /> {level} RISK
            </span>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground leading-relaxed">
              {riskTierConfig.desc}
            </p>
          </div>
        </GlassCard>

        {/* Your Spending Pattern Profile Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-border bg-gradient-to-br from-card/90 via-card/70 to-surface-2 p-6 sm:p-8 backdrop-blur-xl">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Zap className="size-3.5" /> Primary Behavioural Pattern
              </span>
              <span className="rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                Data Derived
              </span>
            </div>

            <h3 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
              {patternProfile.archetype}
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {patternProfile.summary}
            </p>
          </div>

          <div className="mt-6 border-t border-border/60 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{patternProfile.metricLabel}</p>
                <p className="text-2xl font-bold text-primary mt-0.5">{patternProfile.metricValue}</p>
              </div>

              <Link
                to="/app/insights"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-4 py-2 text-xs font-semibold hover:bg-secondary transition"
              >
                View Related Insight <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. "What's Driving Your Risk?" Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">What's driving your risk?</h2>
          <p className="text-xs text-muted-foreground">
            The mathematical risk score is explainable and attributed directly to these observed behavioral signals:
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {factors.map((f) => (
            <GlassCard key={f.id} className="p-5 flex flex-col justify-between hover:border-primary/40 transition">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground">{f.name}</h4>
                  <StatusPill status={f.impact} />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {f.observed}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs">
                <span className="text-muted-foreground">Magnitude</span>
                <span className="font-semibold text-primary">{f.value}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* 5. Personal Spending-Risk Calendar / Behavioural Heatmap */}
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Calendar className="size-4 text-primary" /> Weekly Behavioural Heatmap
            </h3>
            <p className="text-xs text-muted-foreground">
              Historical day-of-week risk based on average transaction size and discretionary frequency
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-[var(--success)]" /> Low
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-[var(--warn)]" /> Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-destructive" /> High
            </span>
          </div>
        </div>

        {/* 7-Day Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {weeklyHeatmap.map((day) => {
            const isHigh = day.risk === "High";
            const isMed = day.risk === "Medium";

            return (
              <div
                key={day.dayName}
                className={cn(
                  "rounded-2xl border p-4 flex flex-col justify-between text-center transition-all hover:-translate-y-0.5",
                  isHigh
                    ? "border-destructive/30 bg-destructive/10"
                    : isMed
                      ? "border-[var(--warn)]/30 bg-[var(--warn)]/10"
                      : "border-border bg-surface-2",
                )}
              >
                <div>
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    {day.dayName.slice(0, 3)}
                  </span>
                  <div className="mt-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        isHigh
                          ? "bg-destructive/20 text-destructive"
                          : isMed
                            ? "bg-[var(--warn)]/20 text-[var(--warn)]"
                            : "bg-[var(--success)]/20 text-[var(--success)]",
                      )}
                    >
                      {day.risk}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/40 text-xs">
                  <p className="text-[11px] text-muted-foreground">Avg Spend</p>
                  <p className="font-semibold text-foreground mt-0.5">{inr(day.avgSpend)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Diurnal Time-of-Day Distribution */}
        <div className="mt-6 pt-5 border-t border-border/60">
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" /> Diurnal Risk Intensity Windows
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {diurnalWindows.map((dw) => (
              <div key={dw.window} className="rounded-xl border border-border bg-surface-2 p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{dw.window}</span>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase rounded px-1.5 py-0.2",
                      dw.level === "High"
                        ? "text-destructive"
                        : dw.level === "Medium"
                          ? "text-[var(--warn)]"
                          : "text-[var(--success)]",
                    )}
                  >
                    {dw.level}
                  </span>
                </div>
                <p className="text-[11px] text-primary/80 font-mono">{dw.hours}</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed pt-1">{dw.description}</p>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* 6. "Your High-Risk Spending Windows" */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Your High-Risk Spending Windows</h2>
          <p className="text-xs text-muted-foreground">
            Specific recurring behavioural contexts where spending velocity historically peaks:
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {highRiskWindows.map((w) => (
            <GlassCard key={w.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-base font-semibold text-foreground">{w.title}</h4>
                  <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", w.badgeColor)}>
                    {w.level}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {w.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Historical Delta:</span>
                <span className="font-semibold text-foreground">{w.impactStat}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* 7. Upcoming Spending Risk (Next 5 Days) */}
      <GlassCard className="p-6">
        <div className="pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary animate-ping" />
            <h3 className="text-base font-semibold text-foreground">Upcoming Spending Risk</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Short-term probabilistic forecast based on your past day-of-week spending patterns. (Informational likelihood, not guaranteed).
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {upcomingForecast.map((f, i) => {
            const isHigh = f.level === "High";
            const isMed = f.level === "Medium";

            return (
              <div
                key={i}
                className={cn(
                  "rounded-2xl border p-4 flex flex-col justify-between space-y-3",
                  isHigh
                    ? "border-destructive/40 bg-destructive/10"
                    : isMed
                      ? "border-[var(--warn)]/40 bg-[var(--warn)]/10"
                      : "border-border bg-surface-2",
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{f.dayLabel}</span>
                    <span className="text-[10px] text-muted-foreground">{f.dateFormatted}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        isHigh ? "bg-destructive" : isMed ? "bg-[var(--warn)]" : "bg-[var(--success)]",
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-bold uppercase",
                        isHigh ? "text-destructive" : isMed ? "text-[var(--warn)]" : "text-[var(--success)]",
                      )}
                    >
                      {f.level} Risk
                    </span>
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed text-muted-foreground border-t border-border/40 pt-2">
                  {f.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* 8. Early-Warning Insight ("Your Next Watch-Out") */}
      <div className="rounded-3xl border border-[var(--warn)]/40 bg-gradient-to-r from-[var(--warn)]/15 via-card/90 to-card p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-[var(--warn)]/20 text-[var(--warn)] shrink-0 mt-1">
            <AlertTriangle className="size-6" />
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--warn)]">
                Your Next Watch-Out
              </span>
              <span className="rounded-full border border-[var(--warn)]/30 bg-[var(--warn)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--warn)]">
                {nextWatchOut.window}
              </span>
            </div>

            <h3 className="text-xl font-bold text-foreground">
              {nextWatchOut.title}
            </h3>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {nextWatchOut.observation}
            </p>

            <div className="mt-3 rounded-2xl border border-border bg-surface-2 p-4 text-xs space-y-1.5">
              <p className="font-semibold text-primary uppercase text-[11px] tracking-wide">
                Why this matters:
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {nextWatchOut.whyItMatters}
              </p>
              <p className="text-foreground font-medium pt-1">
                💡 Tactic: {nextWatchOut.actionablePlea}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 9. Adaptive Recommendation & Interconnected Links */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="size-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">How Moneymind Can Help</h3>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {preventiveAdvice}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Link
            to="/app/insights"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground glow-cyan hover:brightness-110 transition"
          >
            View Related Insight <ArrowRight className="size-3.5" />
          </Link>
          <Link
            to="/app/health"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition"
          >
            View Financial Health
          </Link>
          <Link
            to="/app/what-if"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition"
          >
            Explore What If?
          </Link>
        </div>
      </GlassCard>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-2 p-4 text-xs leading-relaxed text-muted-foreground">
        <Info className="size-4 shrink-0 text-primary mt-0.5" />
        <div>
          <strong className="text-foreground">Probabilistic Behavioural Forecast:</strong> The Spending Risk Forecast
          identifies statistical patterns from your historical transactions to highlight periods of higher likelihood for
          spending deviation. It does not represent deterministic guarantees or financial auditing advice.
        </div>
      </div>
    </div>
  );
}
