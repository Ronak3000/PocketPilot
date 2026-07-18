"use client";

import type { ReceiptStatus } from "@/features/types";

interface BadgeProps {
  status: ReceiptStatus;
  size?: "sm" | "md";
  pulse?: boolean;
}

const statusConfig: Record<ReceiptStatus, { bg: string; text: string; dot: string; label: string }> = {
  SAFE: {
    bg: "bg-[var(--color-safe-subtle)]",
    text: "text-[var(--color-safe)]",
    dot: "bg-[var(--color-safe)]",
    label: "Safe",
  },
  CAUTION: {
    bg: "bg-[var(--color-caution-subtle)]",
    text: "text-[var(--color-caution)]",
    dot: "bg-[var(--color-caution)]",
    label: "Caution",
  },
  WARNING: {
    bg: "bg-[var(--color-warning-subtle)]",
    text: "text-[var(--color-warning)]",
    dot: "bg-[var(--color-warning)]",
    label: "Warning",
  },
  BREACH: {
    bg: "bg-[var(--color-breach-subtle)]",
    text: "text-[var(--color-breach)]",
    dot: "bg-[var(--color-breach)]",
    label: "Breach",
  },
};

export default function Badge({ status, size = "md", pulse = false }: BadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-[12px]";

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide
        rounded-[var(--radius-full)]
        ${config.bg} ${config.text} ${sizeStyles}
      `}
    >
      <span
        className={`
          w-1.5 h-1.5 rounded-full ${config.dot}
          ${pulse ? "animate-pulse-soft" : ""}
        `}
      />
      {config.label}
    </span>
  );
}
