import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { HelpCircle, Lightbulb, TrendingDown, TrendingUp, Users } from "lucide-react";
import { EmptyState, GlassCard, SectionTitle, StatusPill } from "@/components/mm/primitives";
import { useMoneymind } from "@/lib/mm/store";
import { useEffectiveProfile } from "@/lib/mm/store";
import { CATEGORY_COLORS, inr } from "@/lib/mm/types";
import { computeBenchmarks } from "@/lib/mm/benchmarks";
import type { Insight } from "@/lib/mm/insights";

export const Route = createFileRoute("/app/insights")({
  head: () => ({
    meta: [
      { title: "Personalised insights — Moneymind" },
      { name: "description", content: "Plain-language explanations of your spending behaviour with specific, measurable actions." },
      { property: "og:title", content: "Personalised insights — Moneymind" },
      { property: "og:description", content: "What happened, why it happened, what to do and how much it could save." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const { insights, analysis, hasData, loadDemo } = useMoneymind();
  const profile = useEffectiveProfile();

  const benchmark = useMemo(() => {
    if (!hasData) return null;
    const catSpend = analysis.current.byCategory as Partial<Record<import("@/lib/mm/types").Category, number>>;
    return computeBenchmarks(catSpend, profile?.income ?? 50_000);
  }, [analysis, profile, hasData]);

  if (!hasData || insights.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <EmptyState
          icon={<Lightbulb className="size-6" />}
          title="No insights yet"
          message="Moneymind needs transactions before it can spot behaviour patterns. Load the demo dataset to see it work."
          action={
            <button
              onClick={loadDemo}
              className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Load Demo Data
            </button>
          }
        />
      </div>
    );
  }

  const totalPotential = insights.reduce((a, i) => a + i.impact, 0);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Personalised insights"
        subtitle="What your transactions say about your behaviour — and what to do next."
      />

      <GlassCard className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total potential monthly saving</p>
          <p className="mt-1 text-3xl font-semibold text-[var(--success)]">{inr(totalPotential)}</p>
        </div>
        <Link
          to="/app/what-if"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          Simulate these changes
        </Link>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {insights.map((i, idx) => (
          <InsightCard key={i.id} insight={i} delay={idx * 70} />
        ))}
      </div>

      {/* ── Peer Benchmarking ─────────────────────────────────────────── */}
      {benchmark && <PeerBenchmarkSection benchmark={benchmark} />}

      <p className="text-xs text-muted-foreground">
        These are informational observations generated from the transactions you supplied — not professional
        financial advice, and savings are estimates rather than guarantees.
      </p>
    </div>
  );
}

function InsightCard({ insight, delay }: { insight: Insight; delay: number }) {
  const [why, setWhy] = useState(false);
  return (
    <GlassCard delay={delay} className="flex flex-col transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold">{insight.title}</h3>
        <StatusPill status={insight.priority} />
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <Block label="What happened?" text={insight.what} />
        <Block label="Why?" text={insight.why} />
        <Block label="What can you do?" text={insight.action} />
      </div>

      {insight.impact > 0 && (
        <div className="mt-4 rounded-xl border border-[var(--success)]/25 bg-[var(--success)]/10 px-4 py-3">
          <p className="text-xs text-muted-foreground">Potential monthly saving</p>
          <p className="text-xl font-semibold text-[var(--success)]">{inr(insight.impact)}</p>
        </div>
      )}

      <button
        onClick={() => setWhy((w) => !w)}
        className="mt-4 inline-flex w-fit items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        <HelpCircle className="size-3.5" /> Why am I seeing this?
      </button>
      {why && (
        <ul className="mt-3 space-y-1.5 rounded-xl border border-border bg-surface-2 p-4 text-xs text-muted-foreground">
          {insight.evidence.map((e) => (
            <li key={e}>• {e}</li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">{label}</p>
      <p className="mt-1 leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

// ─── Peer Benchmark Section ──────────────────────────────────────────────────

function PeerBenchmarkSection({ benchmark }: { benchmark: import("@/lib/mm/benchmarks").BenchmarkReport }) {
  const verdictColor: Record<string, string> = {
    much_higher: "text-destructive",
    higher:      "text-amber-400",
    on_par:      "text-[var(--success)]",
    lower:       "text-primary",
    much_lower:  "text-primary",
  };

  const barColor: Record<string, string> = {
    much_higher: "bg-destructive",
    higher:      "bg-amber-400",
    on_par:      "bg-[var(--success)]",
    lower:       "bg-primary",
    much_lower:  "bg-primary",
  };

  return (
    <GlassCard>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <div>
            <h3 className="text-base font-semibold">Peer Benchmarking</h3>
            <p className="text-xs text-muted-foreground">
              Compared to {benchmark.bracketLabel} · {benchmark.incomeRange}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {benchmark.overspendingAreas.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold text-destructive">
              <TrendingUp className="size-3" />
              {benchmark.overspendingAreas.length} areas above peers
            </span>
          )}
          {benchmark.savingAreas.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <TrendingDown className="size-3" />
              {benchmark.savingAreas.length} areas below peers
            </span>
          )}
        </div>
      </div>

      {/* Category rows */}
      <div className="mt-5 space-y-3">
        {benchmark.categories.map((c) => {
          const maxPct = Math.max(c.userPct, c.peerPct, 5);
          return (
            <div key={c.category}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: CATEGORY_COLORS[c.category] }}
                  />
                  <span className="font-medium">{c.category}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">Peers: {c.peerPct}%</span>
                  <span className={`font-semibold ${verdictColor[c.verdict]}`}>
                    You: {c.userPct}%
                  </span>
                  {c.delta !== 0 && (
                    <span className={`font-bold ${verdictColor[c.verdict]}`}>
                      {c.delta > 0 ? `+${c.delta}%` : `${c.delta}%`}
                    </span>
                  )}
                </div>
              </div>

              {/* Dual bar — peer vs user */}
              <div className="mt-1.5 space-y-0.5">
                {/* Peer bar */}
                <div className="flex items-center gap-2">
                  <span className="w-10 text-right text-[10px] text-muted-foreground">Peers</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-secondary/60" style={{ height: 5 }}>
                    <div
                      className="h-full rounded-full bg-secondary-foreground/30 transition-all duration-500"
                      style={{ width: `${(c.peerPct / maxPct) * 100}%` }}
                    />
                  </div>
                </div>
                {/* User bar */}
                <div className="flex items-center gap-2">
                  <span className="w-10 text-right text-[10px] text-muted-foreground">You</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-secondary/60" style={{ height: 5 }}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor[c.verdict]}`}
                      style={{ width: `${(c.userPct / maxPct) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Verdict label for notable deltas */}
              {Math.abs(c.delta) >= 5 && (
                <p className={`mt-1 text-[11px] font-medium ${verdictColor[c.verdict]}`}>
                  {c.label}
                  {c.userAmount > 0 && ` · You spend ${inr(c.userAmount)} on ${c.category}`}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        Benchmarks are derived from anonymised national spending patterns for your income bracket. Computed locally — no data is shared.
      </p>
    </GlassCard>
  );
}
