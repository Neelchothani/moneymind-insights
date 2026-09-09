import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Logo } from "@/components/mm/Logo";
import { GlassCard, Progress } from "@/components/mm/primitives";
import { useMoneymind } from "@/lib/mm/store";
import type { Profile } from "@/lib/mm/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your profile — Moneymind" },
      {
        name: "description",
        content: "Tell Moneymind about your income, situation and savings goal to generate your personalised dashboard.",
      },
      { property: "og:title", content: "Set up your profile — Moneymind" },
      { property: "og:description", content: "A three-step setup that personalises your financial behaviour dashboard." },
    ],
  }),
  component: Onboarding,
});

const SITUATIONS: Profile["situation"][] = ["Student", "Young Professional", "Family", "Other"];
const GOALS: Profile["goal"][] = ["Save more", "Control spending", "Build emergency fund", "Reach a specific target"];

function Onboarding() {
  const { setProfile, loadDemo, hasData } = useMoneymind();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Profile>({
    name: "",
    income: 20000,
    situation: "Young Professional",
    goal: "Save more",
    savingsTarget: 5000,
    targetAmount: undefined,
  });

  const steps = ["About you", "Your money", "Your goal"];
  const canNext = step === 0 ? form.name.trim().length > 1 : step === 1 ? form.income > 0 : form.savingsTarget > 0;

  const finish = (withDemo: boolean) => {
    setProfile({ ...form, name: form.name.trim() });
    if (withDemo && !hasData) loadDemo();
    navigate({ to: "/app" });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-6 sm:px-8">
      <Link to="/" className="w-fit">
        <Logo />
      </Link>

      <div className="mt-10 flex-1">
        <div className="mb-6 flex items-center justify-between text-sm">
          <span className="font-medium text-primary">
            Step {step + 1} of 3 · {steps[step]}
          </span>
          <span className="text-muted-foreground">{Math.round(((step + 1) / 3) * 100)}%</span>
        </div>
        <Progress value={((step + 1) / 3) * 100} />

        <GlassCard className="mt-8" delay={40}>
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold">Let's start with your name</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Moneymind personalises every insight around you.
                </p>
              </div>
              <Field label="Your name">
                <input
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Arjun"
                  className="w-full rounded-xl border border-input bg-secondary/50 px-4 py-3 text-base outline-none focus:border-primary/60"
                />
              </Field>
              <Field label="Current financial situation">
                <div className="grid gap-2 sm:grid-cols-2">
                  {SITUATIONS.map((s) => (
                    <Choice key={s} selected={form.situation === s} onClick={() => setForm({ ...form, situation: s })}>
                      {s}
                    </Choice>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold">What comes in each month?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We use this to measure spending as a share of income.
                </p>
              </div>
              <Field label="Monthly income (₹)">
                <input
                  type="number"
                  min={0}
                  value={form.income}
                  onChange={(e) => setForm({ ...form, income: Number(e.target.value) })}
                  className="w-full rounded-xl border border-input bg-secondary/50 px-4 py-3 text-base outline-none focus:border-primary/60"
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                {[15000, 20000, 35000, 60000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setForm({ ...form, income: v })}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                  >
                    ₹{v.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold">What are you working towards?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Every insight is scored against this goal.</p>
              </div>
              <Field label="Primary financial goal">
                <div className="grid gap-2 sm:grid-cols-2">
                  {GOALS.map((g) => (
                    <Choice key={g} selected={form.goal === g} onClick={() => setForm({ ...form, goal: g })}>
                      {g}
                    </Choice>
                  ))}
                </div>
              </Field>
              <Field label="Monthly savings target (₹)">
                <input
                  type="number"
                  min={0}
                  value={form.savingsTarget}
                  onChange={(e) => setForm({ ...form, savingsTarget: Number(e.target.value) })}
                  className="w-full rounded-xl border border-input bg-secondary/50 px-4 py-3 text-base outline-none focus:border-primary/60"
                />
              </Field>
              <Field label="Target amount (optional)">
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 60000 for an emergency fund"
                  value={form.targetAmount ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, targetAmount: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="w-full rounded-xl border border-input bg-secondary/50 px-4 py-3 text-base outline-none focus:border-primary/60"
                />
              </Field>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm transition disabled:opacity-40"
            >
              <ArrowLeft className="size-4" /> Back
            </button>

            {step < 2 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
              >
                Continue <ArrowRight className="size-4" />
              </button>
            ) : (
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  onClick={() => finish(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm transition hover:bg-secondary"
                >
                  Start empty
                </button>
                <button
                  onClick={() => finish(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-cyan transition hover:brightness-110"
                >
                  <Check className="size-4" /> Build my dashboard
                </button>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-3 text-left text-sm transition",
        selected
          ? "border-primary/60 bg-primary/12 text-foreground glow-cyan"
          : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
