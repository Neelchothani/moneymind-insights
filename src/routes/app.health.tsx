import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  Info,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Counter, EmptyState, GlassCard, Progress, SectionTitle, StatusPill } from "@/components/mm/primitives";
import { useEffectiveProfile, useMoneymind } from "@/lib/mm/store";
import { inr } from "@/lib/mm/types";

export const Route = createFileRoute("/app/health")({
  head: () => ({
    meta: [
      { title: "Financial Health — Moneymind" },
      {
        name: "description",
        content: "Evaluate your overall financial health score, behavioural breakdown, and biggest savings opportunities.",
      },
    ],
  }),
  component: FinancialHealthPage,
});

export function FinancialHealthPage() {
  const { health, analysis, hasData, loadDemo } = useMoneymind();
  const profile = useEffectiveProfile();

  if (!hasData) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <EmptyState
          icon={<HeartPulse className="size-6" />}
          title="No health data yet"
          message="Financial health is computed from your spending patterns, savings rate, and goal progress. Load demo data or upload a statement to generate your score."
          action={
            <button
              onClick={loadDemo}
              className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-cyan transition hover:brightness-110"
            >
              Load Demo Data
            </button>
          }
        />
      </div>
    );
  }

  const { score, breakdown, weakest } = health;

  // Grade label
  const grade =
    score >= 80 ? { label: "Excellent", color: "text-[var(--success)]", bg: "bg-[var(--success)]/10" }
    : score >= 65 ? { label: "Good / Resilient", color: "text-primary", bg: "bg-primary/10" }
    : score >= 50 ? { label: "Fair / Watch Closely", color: "text-[var(--warn)]", bg: "bg-[var(--warn)]/10" }
    : { label: "At Risk", color: "text-destructive", bg: "bg-destructive/10" };

  // Opportunity narrative
  const opportunityMap: Record<string, { title: string; action: string; impactEst: string }> = {
    "Spending discipline": {
      title: "Pacing your monthly outflows",
      action: `Your total spending consumed ${Math.round((analysis.current.spending / analysis.income) * 100)}% of income this month. Targeting a 70% spending cap creates immediate breathing room.`,
      impactEst: inr(Math.max(1000, analysis.current.spending * 0.1)),
    },
    "Savings behaviour": {
      title: "Closing the gap on your monthly savings target",
      action: `You saved ${inr(analysis.savings)} against your goal of ${inr(profile.savingsTarget)}. Rebalancing small weekend purchases can close this difference.`,
      impactEst: inr(Math.max(800, profile.savingsTarget - analysis.savings)),
    },
    "Recurring expenses": {
      title: "Pruning passive subscriptions & fixed commitments",
      action: `You have ${analysis.recurring.length} recurring charges totalling ${inr(analysis.recurringTotal)}/month. Auditing unused services could free immediate monthly cash.`,
      impactEst: inr(Math.round(analysis.recurringTotal * 0.3)),
    },
    "Discretionary spending": {
      title: "Optimizing flexible dining & shopping splurges",
      action: `Discretionary expenses account for ${Math.round(analysis.discretionaryShare)}% of spending (${inr(analysis.discretionary)}). A 15% reduction protects your emergency fund.`,
      impactEst: inr(Math.round(analysis.discretionary * 0.15)),
    },
    "Goal progress": {
      title: "Accelerating your primary financial goal",
      action: `You are currently saving ${inr(analysis.savings)} towards your ${profile.goal.toLowerCase()} objective. Small habits compounded can shave months off your timeline.`,
      impactEst: inr(Math.max(1200, profile.savingsTarget * 0.2)),
    },
  };

  const currentOpportunity = opportunityMap[weakest.label] || {
    title: "Refining discretionary expenses",
    action: "Focusing on trimming top recurring orders yields the fastest improvement to your overall score.",
    impactEst: inr(1200),
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Personal Financial Health"
        subtitle="Holistic assessment of your financial habits, stability indicators, and behavioural balance."
      />

      {/* Main Score Hero Card */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1.7fr]">
        <GlassCard className="flex flex-col items-center justify-center p-8 text-center sm:p-10">
          <div className="relative flex items-center justify-center">
            {/* Glowing ring */}
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
            <div className="relative flex size-44 items-center justify-center rounded-full border-4 border-primary/30 bg-surface-2 shadow-2xl">
              <div className="text-center">
                <span className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
                  <Counter value={score} duration={1200} />
                </span>
                <span className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Score / 100
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold ${grade.bg} ${grade.color}`}
            >
              <Activity className="size-3.5" />
              {grade.label}
            </span>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Calculated dynamically from your actual cash flows, debt-to-income balance, and savings discipline.
            </p>
          </div>
        </GlassCard>

        {/* Your Biggest Opportunity Callout */}
        <div className="flex flex-col justify-between rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card/80 to-card p-6 sm:p-8 backdrop-blur-xl glow-cyan">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Zap className="size-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Your Biggest Opportunity
              </span>
            </div>

            <h3 className="mt-4 text-xl font-bold text-foreground sm:text-2xl">
              {currentOpportunity.title}
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {currentOpportunity.action}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-5">
            <div>
              <p className="text-xs text-muted-foreground">Estimated Monthly Potential</p>
              <p className="text-2xl font-bold text-[var(--success)]">+{currentOpportunity.impactEst}/mo</p>
            </div>
            <Link
              to="/app/what-if"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Test in What-If Simulator <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Breakdown Dimensions */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" /> Health Score Breakdown
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {breakdown.map((item) => {
            const isWeakest = item.label === weakest.label;
            const status =
              item.value >= 75 ? "Healthy" : item.value >= 50 ? "On Track" : item.value >= 35 ? "Watch" : "High";

            return (
              <GlassCard key={item.label} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold">{item.label}</h4>
                    <StatusPill status={status} />
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-3xl font-bold tabular-nums">
                      <Counter value={item.value} />
                    </span>
                    <span className="text-xs text-muted-foreground">Weight: {Math.round(item.weight * 100)}%</span>
                  </div>
                  <Progress value={item.value} className="mt-3" />
                </div>

                <div className="mt-4 border-t border-border/50 pt-3">
                  {isWeakest ? (
                    <p className="flex items-center gap-1.5 text-xs text-[var(--warn)] font-medium">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      Primary area with room to optimize
                    </p>
                  ) : item.value >= 75 ? (
                    <p className="flex items-center gap-1.5 text-xs text-[var(--success)] font-medium">
                      <CheckCircle2 className="size-3.5 shrink-0" />
                      Strong positive performance
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <TrendingUp className="size-3.5 shrink-0 text-primary" />
                      Steady with potential upside
                    </p>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Informational Disclaimer Note */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-2 p-4 text-xs leading-relaxed text-muted-foreground">
        <Info className="size-4 shrink-0 text-primary mt-0.5" />
        <div>
          <strong className="text-foreground">Informational Behavioural Indicator:</strong> This health score is an
          algorithmic assessment generated entirely from the transaction records and target parameters you have supplied.
          It does not represent formal credit scoring, clinical financial audit, or fiduciary advice.
        </div>
      </div>
    </div>
  );
}
