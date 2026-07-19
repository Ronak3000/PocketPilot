"use client";

import React, { useState } from "react";
import type { FutureReceipt } from "@/features/types";
import { formatCurrency, formatDate, formatPercent } from "@/features/format";
import Badge from "@/components/ui/Badge";
import BalanceSparkline from "@/features/receipt/BalanceSparkline";

interface FutureReceiptCardProps {
  receipt: FutureReceipt;
}

export default function FutureReceiptCard({ receipt }: FutureReceiptCardProps) {
  const [showMath, setShowMath] = useState(false);

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow-lg)]">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
              Future Receipt
            </p>
            <h3 className="text-lg font-semibold">{receipt.productName}</h3>
          </div>
          <Badge status={receipt.status} pulse />
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="px-6 py-5 border-b border-[var(--color-border-subtle)]">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)]">Listed Price</p>
            <p className="text-[15px] font-mono-numbers font-medium">{formatCurrency(receipt.listedPricePaise)}</p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)]">Upfront Payment</p>
            <p className="text-[15px] font-mono-numbers font-medium">{formatCurrency(receipt.upfrontPaymentPaise)}</p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)]">EMI × Tenure</p>
            <p className="text-[15px] font-mono-numbers font-medium">
              {formatCurrency(receipt.emiAmountPaise)} × {receipt.tenureMonths}mo
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)]">Processing Fee</p>
            <p className="text-[15px] font-mono-numbers font-medium">{formatCurrency(receipt.processingFeePaise)}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-[var(--color-text-secondary)]">Total Committed Cost</p>
            <p className="text-xl font-semibold font-mono-numbers">{formatCurrency(receipt.totalCommittedPaise)}</p>
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
            Commitment ends {formatDate(receipt.commitmentEndDate)}
          </p>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="px-6 py-5 border-b border-[var(--color-border-subtle)]">
        <h4 className="text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
          Impact Analysis
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <MetricTile
            label="Lowest Balance"
            value={formatCurrency(receipt.lowestProjectedBalancePaise)}
            subtext={formatDate(receipt.lowestBalanceDate)}
            warn={receipt.lowestProjectedBalancePaise < 1_000_000}
          />
          <MetricTile
            label="Low-Balance Days"
            value={String(receipt.lowBalanceDays)}
            warn={receipt.lowBalanceDays > 0}
          />
          <MetricTile
            label="Negative Days"
            value={String(receipt.negativeBalanceDays)}
            warn={receipt.negativeBalanceDays > 0}
          />
          <MetricTile
            label="Goal Delay"
            value={`${receipt.goalDelayDays} days`}
            warn={receipt.goalDelayDays > 30}
          />
          <MetricTile
            label="EMI Burden"
            value={formatPercent(receipt.emiBurdenPercent)}
            warn={receipt.emiBurdenPercent > 30}
          />
          <MetricTile
            label="Confidence"
            value={`${Math.round(receipt.confidence * 100)}%`}
          />
        </div>
      </div>

      {/* Constitution Conflicts */}
      {receipt.constitutionConflicts.length > 0 && (
        <div className="px-6 py-5 border-b border-[var(--color-border-subtle)]">
          <h4 className="text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
            Constitution Conflicts
          </h4>
          <div className="space-y-2">
            {receipt.constitutionConflicts.map((conflict) => (
              <div
                key={conflict.ruleId}
                className={`
                  px-3 py-2.5 rounded-[var(--radius-md)] text-[13px] leading-relaxed
                  ${
                    conflict.severity === "breach"
                      ? "bg-[var(--color-breach-subtle)] text-[var(--color-breach)]"
                      : conflict.severity === "warning"
                      ? "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]"
                      : "bg-[var(--color-caution-subtle)] text-[var(--color-caution)]"
                  }
                `}
              >
                <span className="font-medium">{conflict.ruleName}:</span> {conflict.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="px-6 py-5 border-b border-[var(--color-border-subtle)]">
        <h4 className="text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Recommendation
        </h4>
        <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          {receipt.recommendation}
        </p>
      </div>

      {/* Assumptions */}
      <div className="px-6 py-4 border-b border-[var(--color-border-subtle)]">
        <details className="group">
          <summary className="text-[12px] font-medium text-[var(--color-text-muted)] cursor-pointer hover:text-[var(--color-text-secondary)] transition-colors list-none flex items-center gap-1">
            <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
            Assumptions ({receipt.assumptions.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {receipt.assumptions.map((a, i) => (
              <li key={i} className="text-[12px] text-[var(--color-text-muted)] flex items-start gap-1.5">
                <span className="text-[var(--color-text-disabled)] mt-0.5">•</span>
                {a}
              </li>
            ))}
          </ul>
        </details>
      </div>

      {/* See the Math */}
      <div className="px-6 py-4">
        <button
          onClick={() => setShowMath(!showMath)}
          className="text-[13px] font-medium text-[var(--color-accent-text)] hover:underline cursor-pointer flex items-center gap-1.5"
        >
          <svg className={`w-3.5 h-3.5 transition-transform ${showMath ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
          {showMath ? "Hide the math" : "See the math"}
        </button>

        {showMath && (
          <div className="mt-4 space-y-6 animate-fade-up">
            {/* Balance Sparkline */}
            <div>
              <h5 className="text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                Projected Balance
              </h5>
              <BalanceSparkline
                balances={receipt.projectedBalances}
                floorPaise={1_000_000}
              />
            </div>

            {/* Daily Ledger Preview */}
            <div>
              <h5 className="text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                Daily Ledger Preview
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)]">
                      <th className="text-left py-2 pr-4 font-medium">Date</th>
                      <th className="text-left py-2 pr-4 font-medium">Description</th>
                      <th className="text-right py-2 pr-4 font-medium">Amount</th>
                      <th className="text-right py-2 font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.dailyLedger.slice(0, 10).map((entry, i) => (
                      <tr
                        key={i}
                        className={`border-b border-[var(--color-border-subtle)] ${
                          entry.breachesFloor ? "text-[var(--color-breach)]" : ""
                        }`}
                      >
                        <td className="py-2 pr-4 font-mono-numbers text-[var(--color-text-muted)]">
                          {formatDate(entry.date)}
                        </td>
                        <td className="py-2 pr-4">{entry.label}</td>
                        <td className={`py-2 pr-4 text-right font-mono-numbers ${entry.isIncome ? "text-[var(--color-safe)]" : ""}`}>
                          {entry.amountPaise > 0 ? "+" : ""}
                          {formatCurrency(Math.abs(entry.amountPaise))}
                        </td>
                        <td className="py-2 text-right font-mono-numbers font-medium">
                          {formatCurrency(entry.balancePaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Metric Tile ──

function MetricTile({
  label,
  value,
  subtext,
  warn = false,
}: {
  label: string;
  value: string;
  subtext?: string;
  warn?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
      <p className={`text-[15px] font-mono-numbers font-semibold ${warn ? "text-[var(--color-warning)]" : ""}`}>
        {value}
      </p>
      {subtext && (
        <p className="text-[10px] text-[var(--color-text-disabled)]">{subtext}</p>
      )}
    </div>
  );
}
