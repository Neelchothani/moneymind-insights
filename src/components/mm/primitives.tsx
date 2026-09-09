import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn("glass rise rounded-3xl p-5 sm:p-6", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rise">
      <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p> : null}
    </div>
  );
}

/** Animated number counter with smooth transitions between value changes. */
export function Counter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 900,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (to - from) * eased;
      setDisplay(v);
      fromRef.current = v;
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const formatted = display.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${pct}%`,
          background: "linear-gradient(90deg, var(--chart-1), var(--chart-2))",
          boxShadow: "0 0 18px -4px var(--chart-1)",
        }}
      />
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  Healthy: "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30",
  "On Track": "bg-primary/15 text-primary border-primary/30",
  Watch: "bg-[var(--warn)]/15 text-[var(--warn)] border-[var(--warn)]/30",
  High: "bg-destructive/15 text-destructive border-destructive/30",
  "High Impact": "bg-destructive/15 text-destructive border-destructive/30",
  "Medium Impact": "bg-[var(--warn)]/15 text-[var(--warn)] border-[var(--warn)]/30",
  Positive: "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        STATUS_STYLES[status] ?? "border-border bg-secondary text-muted-foreground",
        className,
      )}
    >
      {status}
    </span>
  );
}

export function EmptyState({
  title,
  message,
  action,
  icon,
}: {
  title: string;
  message: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <GlassCard className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {action}
    </GlassCard>
  );
}
