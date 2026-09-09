import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart3,
  HeartPulse,
  LayoutDashboard,
  Lightbulb,
  Menu,
  ShieldAlert,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
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
  { to: "/app/upload", label: "Upload Statement", icon: Upload },
] as const;

function AppLayout() {
  const [open, setOpen] = useState(false);
  const { hasData, loadDemo } = useMoneymind();

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

      <main className="min-w-0 flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-10">
        <Outlet />
      </main>
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
