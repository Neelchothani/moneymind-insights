export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative grid size-9 place-items-center rounded-xl bg-primary/15 glow-cyan">
        <svg viewBox="0 0 24 24" className="size-5 text-primary" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M12 3a4 4 0 0 0-4 4 3.2 3.2 0 0 0-1.4 6 3.4 3.4 0 0 0 2.6 5H12z" strokeLinejoin="round" />
          <path d="M12 3a4 4 0 0 1 4 4 3.2 3.2 0 0 1 1.4 6 3.4 3.4 0 0 1-2.6 5H12z" strokeLinejoin="round" />
          <path d="M12 18v3" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-[17px] font-semibold tracking-tight">
          MONEY<span className="text-primary">MIND</span>
        </span>
      )}
    </span>
  );
}
