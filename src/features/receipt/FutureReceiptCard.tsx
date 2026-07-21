"use client";

import React, { useState } from "react";
import type { FutureReceipt } from "@/features/types";
import { formatCurrency, formatDate } from "@/features/format";
import BalanceSparkline from "@/features/receipt/BalanceSparkline";

interface FutureReceiptCardProps {
  receipt: FutureReceipt;
}

export default function FutureReceiptCard({ receipt }: FutureReceiptCardProps) {
  const [showMath, setShowMath] = useState(false);

  // Compute a realistic affordability score based on the receipt's financial health indicators
  let score = 100;
  if (receipt.status === "SAFE") {
    score = 95 - Math.min(15, receipt.lowBalanceDays);
  } else if (receipt.status === "CAUTION") {
    score = 75 - receipt.constitutionConflicts.length * 5;
  } else if (receipt.status === "WARNING") {
    score = 55 - receipt.constitutionConflicts.length * 5;
  } else {
    // BREACH
    score = Math.max(0, 30 - (receipt.negativeBalanceDays || 0) * 2 - receipt.constitutionConflicts.length * 5);
  }
  const scoreColor = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const scoreLabel = score >= 80 ? "Great fit" : score >= 60 ? "Okay fit" : "Risky";

  return (
    <div className="bg-white border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] overflow-hidden shadow-md max-w-[800px] my-4">

      {/* Top Header */}
      <div className="px-6 py-4 border-b border-[var(--color-border-subtle)] bg-slate-50 flex items-center gap-3">
        <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">Your Future Receipt</h2>
        <span className="text-[12px] text-[var(--color-text-muted)] font-medium">Clarity today. Confidence tomorrow.</span>
      </div>

      {/* Main Product Info & Score */}
      <div className="p-6 flex flex-col md:flex-row items-center gap-8 border-b border-[var(--color-border-subtle)]">

        {/* Product Left */}
        <div className="flex flex-1 items-center gap-5">
          <div className="w-20 h-24 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center flex-shrink-0">
            {/* Placeholder for Product Image */}
            <span className="text-3xl">📱</span>
          </div>
          <div>
            <h3 className="text-[22px] font-bold text-[var(--color-text-primary)] leading-tight mb-1">
              {receipt.productName}
            </h3>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[18px] font-bold text-[var(--color-text-secondary)]">
                {formatCurrency(receipt.listedPricePaise)}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                receipt.status === "SAFE" ? "bg-emerald-100 text-emerald-700" :
                receipt.status === "CAUTION" ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              }`}>
                {receipt.status === "SAFE" ? "Safe to buy" : receipt.status === "CAUTION" ? "Caution" : "Not recommended"}
              </span>
            </div>
          </div>
        </div>

        {/* Affordability Score Gauge */}
        <div className="flex items-center gap-5 md:pl-8 md:border-l border-[var(--color-border-subtle)]">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#f1f5f9" strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke={scoreColor} strokeWidth="3"
                strokeDasharray={`${score}, 100`}
                className="animate-fade-in transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-[16px] font-bold leading-none">{score}</span>
              <span className="text-[8px] text-[var(--color-text-muted)] font-medium uppercase">/100</span>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider mb-0.5">Affordability Score</p>
            <p className="text-[15px] font-bold" style={{ color: scoreColor }}>{scoreLabel}</p>
          </div>
        </div>
      </div>

      {/* 4 Stat Boxes */}
      <div className="p-6 border-b border-[var(--color-border-subtle)] bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
            <p className="text-[12px] text-[var(--color-text-muted)] font-medium mb-1">Listed Price</p>
            <p className="text-[16px] font-bold text-[var(--color-text-primary)]">{formatCurrency(receipt.listedPricePaise)}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
            <p className="text-[12px] text-[var(--color-text-muted)] font-medium mb-1">Est. monthly</p>
            <p className="text-[16px] font-bold text-[var(--color-text-primary)]">{formatCurrency(receipt.emiAmountPaise)}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
            <p className="text-[12px] text-[var(--color-text-muted)] font-medium mb-1">Total cost</p>
            <p className="text-[16px] font-bold text-[var(--color-text-primary)]">{formatCurrency(receipt.totalCommittedPaise)}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
            <p className="text-[12px] text-[var(--color-text-muted)] font-medium mb-1">Safe to spend after</p>
            <p className="text-[16px] font-bold text-[var(--color-safe)]">
              {formatCurrency(Math.max(0, receipt.lowestProjectedBalancePaise - 1000000))}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Recommendation Bar */}
      <div className="p-4 bg-white flex items-center justify-between border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <p className="text-[13px] text-[var(--color-text-secondary)] leading-snug max-w-[450px]">
            <span className="font-bold text-[var(--color-text-primary)]">PocketPilot Advice:</span> {receipt.recommendation}
          </p>
        </div>
        <button
          onClick={() => setShowMath(!showMath)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold rounded-lg transition-colors whitespace-nowrap"
        >
          Review plan &rarr;
        </button>
      </div>

      {/* Expanded Math Section */}
      {showMath && (
        <div className="p-6 bg-slate-50 border-t border-[var(--color-border-subtle)] animate-fade-up">
          <h5 className="text-[13px] font-bold text-[var(--color-text-primary)] mb-4">Projected Balance</h5>
          <div className="bg-white border border-[var(--color-border-subtle)] rounded-xl p-4 shadow-sm mb-6">
            <BalanceSparkline
              balances={receipt.projectedBalances}
              floorPaise={1_000_000}
            />
          </div>

          {/* Conflicts */}
          {receipt.constitutionConflicts.length > 0 && (
            <div className="mb-6">
              <h5 className="text-[13px] font-bold text-[var(--color-text-primary)] mb-3">Constitution Conflicts</h5>
              <div className="space-y-2">
                {receipt.constitutionConflicts.map((conflict) => (
                  <div
                    key={conflict.ruleId}
                    className="px-4 py-3 rounded-lg text-[13px] bg-red-50 text-red-800 border border-red-100 flex items-start gap-2"
                  >
                    <span className="text-red-500 mt-0.5">⚠️</span>
                    <div>
                      <span className="font-bold">{conflict.ruleName}:</span> {conflict.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h5 className="text-[13px] font-bold text-[var(--color-text-primary)] mb-3">Daily Ledger Preview</h5>
          <div className="bg-white border border-[var(--color-border-subtle)] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50">
                <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)]">
                  <th className="text-left py-2.5 px-4 font-bold">Date</th>
                  <th className="text-left py-2.5 px-4 font-bold">Description</th>
                  <th className="text-right py-2.5 px-4 font-bold">Amount</th>
                  <th className="text-right py-2.5 px-4 font-bold">Balance</th>
                </tr>
              </thead>
              <tbody>
                {receipt.dailyLedger.slice(0, 5).map((entry, i) => (
                  <tr
                    key={i}
                    className={`border-b border-slate-100 ${entry.breachesFloor ? "bg-red-50" : ""}`}
                  >
                    <td className="py-2.5 px-4 font-mono-numbers text-[var(--color-text-secondary)]">
                      {formatDate(entry.date)}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[var(--color-text-primary)]">{entry.label}</td>
                    <td className={`py-2.5 px-4 text-right font-mono-numbers font-medium ${entry.isIncome ? "text-[var(--color-safe)]" : "text-[var(--color-text-secondary)]"}`}>
                      {entry.amountPaise > 0 ? "+" : ""}
                      {formatCurrency(Math.abs(entry.amountPaise))}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono-numbers font-bold text-[var(--color-text-primary)]">
                      {formatCurrency(entry.balancePaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
