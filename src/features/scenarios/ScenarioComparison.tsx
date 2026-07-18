"use client";

import React, { useState } from "react";
import type { ScenarioComparison, ScenarioResult } from "@/features/types";
import { formatCurrency, formatPercent } from "@/features/format";
import Badge from "@/components/ui/Badge";

interface ScenarioComparisonViewProps {
  comparison: ScenarioComparison;
}

export default function ScenarioComparisonView({ comparison }: ScenarioComparisonViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(comparison.recommendedScenarioId);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {comparison.scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            isRecommended={scenario.id === comparison.recommendedScenarioId}
            isSelected={scenario.id === selectedId}
            onSelect={() => setSelectedId(scenario.id)}
          />
        ))}
      </div>

      {comparison.comparisonSummary && (
        <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed px-1">
          💡 {comparison.comparisonSummary}
        </p>
      )}
    </div>
  );
}

function ScenarioCard({
  scenario,
  isRecommended,
  isSelected,
  onSelect,
}: {
  scenario: ScenarioResult;
  isRecommended: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full text-left p-4 rounded-[var(--radius-lg)]
        border transition-all duration-[var(--duration-normal)]
        cursor-pointer
        ${
          isSelected
            ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)] shadow-[var(--shadow-glow-teal)]"
            : "border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-default)]"
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-[14px] font-semibold">{scenario.label}</h4>
          {isRecommended && (
            <span className="text-[10px] text-[var(--color-accent-text)] font-medium uppercase tracking-wider">
              Recommended
            </span>
          )}
        </div>
        <Badge status={scenario.status} size="sm" />
      </div>

      {/* Metrics */}
      <div className="space-y-2">
        <MetricRow label="Lowest Balance" value={formatCurrency(scenario.lowestBalancePaise)} warn={scenario.lowestBalancePaise < 1_000_000} />
        <MetricRow label="Risk Days" value={String(scenario.lowBalanceDays)} warn={scenario.lowBalanceDays > 0} />
        <MetricRow label="Goal Delay" value={`${scenario.goalDelayDays}d`} warn={scenario.goalDelayDays > 30} />
        <MetricRow label="Total Commitment" value={formatCurrency(scenario.totalCommittedPaise)} />
        <MetricRow label="EMI Ratio" value={formatPercent(scenario.emiToIncomeRatio)} warn={scenario.emiToIncomeRatio > 30} />
        {scenario.constitutionConflicts.length > 0 && (
          <MetricRow
            label="Conflicts"
            value={`${scenario.constitutionConflicts.length} rule${scenario.constitutionConflicts.length > 1 ? "s" : ""}`}
            warn
          />
        )}
      </div>

      {/* Select indicator */}
      <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
        <p className="text-[12px] text-[var(--color-text-muted)] truncate">
          {scenario.recommendation.slice(0, 60)}…
        </p>
      </div>
    </button>
  );
}

function MetricRow({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[var(--color-text-muted)]">{label}</span>
      <span className={`text-[12px] font-mono-numbers font-medium ${warn ? "text-[var(--color-warning)]" : ""}`}>
        {value}
      </span>
    </div>
  );
}
