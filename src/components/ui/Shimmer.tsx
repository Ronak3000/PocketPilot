"use client";

interface ShimmerProps {
  className?: string;
  lines?: number;
  lineHeight?: string;
}

export default function Shimmer({
  className = "",
  lines = 3,
  lineHeight = "h-4",
}: ShimmerProps) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`
            ${lineHeight} rounded-[var(--radius-sm)]
            bg-[var(--color-bg-elevated)] animate-shimmer
            ${i === lines - 1 ? "w-3/4" : "w-full"}
          `}
        />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
