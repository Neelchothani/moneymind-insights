import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  CalendarDays,
  HeartPulse,
  LayoutDashboard,
  Lightbulb,
  Menu,
  ShieldAlert,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/mm/Logo";
import { cn } from "@/lib/utils";
import { useMoneymind } from "@/lib/mm/store";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const NAV = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/app/transactions", label: "Transactions", icon: BarChart3 },
  { to: "/app/insights", label: "Insights", icon: Lightbulb },
  { to: "/app/risk", label: "Spending Risk", icon: ShieldAlert },
  { to: "/app/health", label: "Financial Health", icon: HeartPulse },
  { to: "/app/what-if", label: "What If?", icon: Sparkles },
  { to: "/app/calendar", label: "Bill Calendar", icon: CalendarDays },
  { to: "/app/upload", label: "Upload Statement", icon: Upload },
] as const;

function AppLayout() {
  const [open, setOpen] = useState(false);
  const { hasData, loadDemo, reminders } = useMoneymind();

  // Fire sonner toasts once when critical/warning reminders appear
  useEffect(() => {
    if (!reminders.hasAny) return;
    const fired = new Set<string>();
    for (const r of reminders.reminders) {
      if (fired.has(r.id)) continue;
      fired.add(r.id);
      if (r.severity === "critical") {
        toast.error(r.title, { description: r.message, duration: 8000, id: r.id });
      } else if (r.severity === "warning") {
        toast.warning(r.title, { description: r.message, duration: 6000, id: r.id });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders.hasCritical, reminders.hasWarning, reminders.reminders.length]);

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar/70 p-5 lg:sticky lg:top-0 lg:block lg:h-screen">
        <Link to="/">
          <Logo />
        </Link>
        <nav className="mt-8 space-y-1">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="mt-8 space-y-2">
          {!hasData ? (
            <button
              onClick={loadDemo}
              className="w-full rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground glow-cyan transition hover:brightness-110"
            >
              Load Demo Data
            </button>
          ) : (
            <button
              onClick={loadDemo}
              className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              Reload Demo Data
            </button>
          )}
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
          Informational behavioural insights based on the data you provide. Not professional financial advice.
        </p>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link to="/">
          <Logo />
        </Link>
        <button
          aria-label="Toggle navigation"
          onClick={() => setOpen((o) => !o)}
          className="grid size-10 place-items-center rounded-xl border border-border bg-secondary/60"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {open && (
        <div className="sticky top-[57px] z-30 border-b border-border bg-background/95 p-3 backdrop-blur-xl lg:hidden">
          <nav className="grid gap-1">
            {NAV.map((item) => (
              <NavItem key={item.to} {...item} onClick={() => setOpen(false)} />
            ))}
          </nav>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── Reminder Banner (persistent, app-wide) ── */}
        {hasData && reminders.hasAny && <ReminderBanner reminders={reminders} />}

        <main className="min-w-0 flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  exact,
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      activeOptions={{ exact: Boolean(exact) }}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary/70 hover:text-foreground"
      activeProps={{
        className: cn("bg-primary/12 text-foreground border border-primary/25"),
      }}
    >
      <Icon className="size-[18px] text-primary/80 transition group-hover:text-primary" />
      {label}
    </Link>
  );
}

// ─── Reminder Banner ─────────────────────────────────────────────────────────

function ReminderBanner({ reminders }: { reminders: import("@/lib/mm/reminders").ReminderReport }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = reminders.reminders.filter((r) => !dismissed.has(r.id));
  if (visible.length === 0) return null;

  // Show only top reminder in the persistent bar; user can dismiss to see next
  const top = visible[0];

  const colorMap: Record<string, string> = {
    critical: "border-destructive/40 bg-destructive/8 text-destructive",
    warning: "border-amber-500/40 bg-amber-500/8 text-amber-400",
    info: "border-primary/30 bg-primary/8 text-primary",
  };
  const cls = colorMap[top.severity] ?? colorMap.info;

  return (
    <div className={`flex items-start gap-3 border-b px-4 py-3 sm:px-6 lg:px-10 ${cls}`}>
      {top.severity === "critical" ? (
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      ) : (
        <BellRing className="mt-0.5 size-4 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{top.title}</p>
        <p className="mt-0.5 text-xs opacity-80">{top.message}</p>
        {top.linkTo && (
          <Link to={top.linkTo} className="mt-1 inline-block text-xs font-medium underline underline-offset-2 opacity-90 hover:opacity-100">
            {top.linkLabel ?? "View →"}
          </Link>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {visible.length > 1 && (
          <span className="rounded-full border border-current/30 bg-current/10 px-2 py-0.5 text-[10px] font-semibold">
            +{visible.length - 1} more
          </span>
        )}
        <button
          onClick={() => setDismissed((prev) => new Set([...prev, top.id]))}
          className="grid size-6 place-items-center rounded-lg opacity-70 hover:opacity-100"
          aria-label="Dismiss reminder"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
