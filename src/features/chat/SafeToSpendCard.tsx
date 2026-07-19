"use client";

import type { SafeToSpend } from "@/features/types";
import { formatCurrency } from "@/features/format";
import Card from "@/components/ui/Card";

interface SafeToSpendCardProps {
  data: SafeToSpend;
}

const qualityColors: Record<string, string> = {
  excellent: "text-[var(--color-safe)]",
  good: "text-[var(--color-accent-text)]",
  tight: "text-[var(--color-caution)]",
  critical: "text-[var(--color-breach)]",
};

export default function SafeToSpendCard({ data }: SafeToSpendCardProps) {
  return (
    <Card className="border-[var(--color-accent)]/20">
      <div className="space-y-4">
        <div>
          <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            Safe to Spend Today
          </p>
          <p className="text-3xl font-semibold font-mono-numbers text-[var(--color-accent-text)]">
            {formatCurrency(data.safeAmountPaise)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)]">Protected</p>
            <p className="text-[14px] font-mono-numbers font-medium">
              {formatCurrency(data.protectedAmountPaise)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)]">Upcoming</p>
            <p className="text-[14px] font-mono-numbers font-medium">
              {formatCurrency(data.upcomingCommitmentPaise)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)]">
          <span className={`text-[13px] font-medium capitalize ${qualityColors[data.bufferQuality]}`}>
            {data.bufferQuality} buffer
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {Math.round(data.confidence * 100)}% confidence
          </span>
        </div>
      </div>
    </Card>
  );
}
