import { cn } from '@/lib/cn';

interface BrandLogoProps {
  collapsed?: boolean;
  className?: string;
}

export function BrandLogo({ collapsed = false, className }: BrandLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 text-white shadow-sm ring-1 ring-white/15">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4.5 w-4.5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
          <circle cx="12" cy="12" r="2.8" fill="currentColor" />
          <path d="M12 3v2M12 19v2" strokeOpacity="0.65" />
        </svg>
        <span
          className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-bg-surface"
          title="Telemetry cluster healthy"
        />
      </div>

      {!collapsed && (
        <div className="flex flex-col leading-none overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-text-primary">
              ModelSight
            </span>
            <span className="rounded bg-accent-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent-primary">
              AI
            </span>
          </div>
          <span className="mt-0.5 truncate text-[11px] font-medium text-text-muted">
            Production Observability
          </span>
        </div>
      )}
    </div>
  );
}

