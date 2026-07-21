"use client";

// ── Screen 7: Eligibility Explanation ──
// Translates reason codes into plain language.
// Clearly separates: PocketPilot assessment / Provider prequalification / Lender approval.
// Never calls affordability "approval".

import React from "react";
import type { EmergencyReasonCode, OfferAffordabilityResult } from "@/core/finance/emergency";

interface Props {
  result: OfferAffordabilityResult;
  providerName: string;
  onProceedToHandoff: () => void;
  onBack: () => void;
}

const REASON_EXPLANATIONS: Record<EmergencyReasonCode, { label: string; detail: string; severity: "info" | "caution" | "risk" }> = {
  AFFORDABILITY_FIT: {
    label: "Repayments appear manageable",
    detail: "Based on your income and expenses, the projected repayments fall within an acceptable range.",
    severity: "info",
  },
  MISSING_INCOME: {
    label: "Income data missing",
    detail: "Your income was not provided or is zero. The calculation cannot confirm affordability without this.",
    severity: "risk",
  },
  INCOME_UNVERIFIED: {
    label: "Income is not verified",
    detail: "Income confidence is low. The lender will need to verify this independently.",
    severity: "caution",
  },
  HIGH_EXISTING_EMI_RATIO: {
    label: "Existing EMIs are high",
    detail: "Your current EMI obligations already consume a large share of your income before this loan.",
    severity: "risk",
  },
  POST_LOAN_EMI_RATIO_EXCEEDED: {
    label: "Total EMI ratio would exceed 40%",
    detail: "Adding this EMI would take your total monthly loan repayments above 40% of income, which many lenders consider risky.",
    severity: "risk",
  },
  NEGATIVE_BALANCE_PROJECTED: {
    label: "Negative balance projected",
    detail: "The cash-flow model shows your balance may go negative on some days during the loan period.",
    severity: "risk",
  },
  PROTECTED_BALANCE_BREACH: {
    label: "Protected balance floor at risk",
    detail: "Your projected balance may fall below the minimum you said you want to keep.",
    severity: "risk",
  },
  PROTECTED_EXPENSE_AT_RISK: {
    label: "Essential expenses at risk",
    detail: "There may not be enough to cover rent, family transfers, or other protected expenses in some months.",
    severity: "risk",
  },
  INSUFFICIENT_REPAYMENT_BUFFER: {
    label: "Low repayment buffer",
    detail: "There is little financial cushion left after EMI payments each month.",
    severity: "caution",
  },
  GOAL_DELAYED: {
    label: "Savings goal may be delayed",
    detail: "The EMI payments may reduce contributions to your savings goal, delaying when you reach it.",
    severity: "caution",
  },
  OFFER_TERMS_INCOMPLETE: {
    label: "Offer terms incomplete",
    detail: "Some required loan terms were not provided. The calculation may be incomplete.",
    severity: "caution",
  },
  PROVIDER_REVIEW_REQUIRED: {
    label: "Lender review required",
    detail: "The provider requires additional verification before a credit decision.",
    severity: "info",
  },
};

const SEVERITY_CLASS: Record<"info" | "caution" | "risk", string> = {
  info: "reason-item--info",
  caution: "reason-item--caution",
  risk: "reason-item--risk",
};

export function EligibilityExplanation({ result, providerName, onProceedToHandoff, onBack }: Props) {
  return (
    <div className="eligibility-explanation">
      <h2 className="eligibility-explanation__heading">
        Why this offer looks this way
      </h2>

      <div className="eligibility-explanation__stages">
        <div className="stage stage--active">
          <div className="stage__step">1</div>
          <div className="stage__label">PocketPilot Assessment</div>
          <div className="stage__desc">Affordability check — done</div>
        </div>
        <div className="stage stage--next">
          <div className="stage__step">2</div>
          <div className="stage__label">Provider Pre-qualification</div>
          <div className="stage__desc">Simulated — not a real check</div>
        </div>
        <div className="stage stage--future">
          <div className="stage__step">3</div>
          <div className="stage__label">Final Lender Approval</div>
          <div className="stage__desc">Only the regulated lender decides</div>
        </div>
      </div>

      <div className="eligibility-explanation__provider">
        Showing: <strong>{providerName}</strong>
      </div>

      <ul className="reason-list" aria-label="Affordability reason codes">
        {result.reasonCodes.map((code) => {
          const { label, detail, severity } = REASON_EXPLANATIONS[code];
          return (
            <li
              key={code}
              className={`reason-item ${SEVERITY_CLASS[severity]}`}
              id={`reason-${code}`}
            >
              <div className="reason-item__label">{label}</div>
              <div className="reason-item__detail">{detail}</div>
            </li>
          );
        })}
      </ul>

      <div className="eligibility-explanation__disclaimer">
        This is a PocketPilot affordability assessment, not a credit score or
        lender decision. Your medical condition, situation, or emotional state
        has no bearing on these results. Only your financial figures matter.
      </div>

      <div className="eligibility-explanation__actions">
        <button id="explanation-back" className="btn btn--ghost" onClick={onBack}>
          Back to offers
        </button>
        <button
          id="explanation-handoff"
          className="btn btn--primary"
          onClick={onProceedToHandoff}
        >
          Proceed to simulated handoff
        </button>
      </div>
    </div>
  );
}
