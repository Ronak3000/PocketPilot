"use client";

import React, { useState } from "react";
import type { ActionPlan } from "@/features/types";
import { formatCurrency, formatDate } from "@/features/format";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { pocketPilotClient } from "@/mocks/adapter";
import { useAppDispatch } from "@/features/app-state";

interface SafePurchasePlanProps {
  plan: ActionPlan;
}

export default function SafePurchasePlan({ plan: initialPlan }: SafePurchasePlanProps) {
  const dispatch = useAppDispatch();
  const [plan, setPlan] = useState(initialPlan);
  const [approving, setApproving] = useState(false);

  async function handleApprove() {
    setApproving(true);
    try {
      const approved = await pocketPilotClient.approvePlan(plan.id);
      setPlan(approved);
      dispatch({ type: "SET_PLAN", plan: approved });
    } finally {
      setApproving(false);
    }
  }

  const isApproved = plan.status === "approved";

  return (
    <Card className={isApproved ? "border-[var(--color-safe)]/30" : "border-[var(--color-accent)]/20"}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
              Safe Purchase Plan
            </p>
            <h3 className="text-[16px] font-semibold">
              {isApproved ? "✅ Plan Approved" : "Recommended Safer Path"}
            </h3>
          </div>
          {isApproved && (
            <span className="text-[12px] font-medium text-[var(--color-safe)] bg-[var(--color-safe-subtle)] px-2 py-0.5 rounded-full">
              Approved
            </span>
          )}
        </div>

        {/* Plan details */}
        <div className="grid grid-cols-2 gap-4">
          <PlanDetail label="Purchase Date" value={formatDate(plan.recommendedDate)} />
          <PlanDetail label="Max Price" value={formatCurrency(plan.maxPricePaise)} />
          <PlanDetail label="Down Payment" value={formatCurrency(plan.requiredDownPaymentPaise)} />
          <PlanDetail label="Max EMI" value={formatCurrency(plan.maxEmiPaise)} />
          <PlanDetail label="Max Tenure" value={`${plan.maxTenureMonths} months`} />
          <PlanDetail
            label="Required Balance"
            value={formatCurrency(plan.requiredBalanceBeforePurchasePaise)}
          />
        </div>

        {/* Invalidation conditions */}
        <div>
          <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
            This plan becomes invalid if:
          </p>
          <ul className="space-y-1">
            {plan.invalidationConditions.map((condition, i) => (
              <li key={i} className="text-[12px] text-[var(--color-text-secondary)] flex items-start gap-1.5">
                <span className="text-[var(--color-warning)] mt-0.5">⚠</span>
                {condition}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        {!isApproved && (
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleApprove} loading={approving}>
              Approve This Plan
            </Button>
            <Button variant="ghost">
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function PlanDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
      <p className="text-[14px] font-mono-numbers font-medium">{value}</p>
    </div>
  );
}
