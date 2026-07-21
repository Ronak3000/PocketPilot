"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export default function ProgressBar({ current, total, className = "" }: ProgressBarProps) {
  const percent = Math.round((current / total) * 100);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-1.5 bg-[var(--color-bg-elevated)] rounded-[var(--radius-full)] overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)] rounded-[var(--radius-full)] transition-all duration-[var(--duration-slow)] ease-[var(--ease-out)]"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
      <span className="text-[12px] text-[var(--color-text-muted)] tabular-nums font-medium min-w-[3ch] text-right">
        {current}/{total}
      </span>
    </div>
  );
}
