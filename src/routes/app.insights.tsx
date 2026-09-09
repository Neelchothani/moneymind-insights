import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { HelpCircle, Lightbulb } from "lucide-react";
import { EmptyState, GlassCard, SectionTitle, StatusPill } from "@/components/mm/primitives";
import { useMoneymind } from "@/lib/mm/store";
import { inr } from "@/lib/mm/types";
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
  const { insights, hasData, loadDemo } = useMoneymind();

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
