"use client";

// ── Screen 4: Funding Gap Result ──
// Shows the calculated gap. Does not call it "approval" or "eligibility".
// Calulation is done by the engine — this is display only.

import React from "react";

interface Props {
  totalNeededPaise: number;
  alreadyAvailablePaise: number;
  fundingGapPaise: number;
  requiredByDate: string;
  onContinue: () => void;
  onBack: () => void;
}

function inr(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function FundingGapResult({
  totalNeededPaise,
  alreadyAvailablePaise,
  fundingGapPaise,
  requiredByDate,
  onContinue,
  onBack,
}: Props) {
  const hasGap = fundingGapPaise > 0;

  return (
    <div className="funding-gap-result">
      <h2 className="funding-gap-result__heading">Your Funding Summary</h2>

      <div className="funding-gap-result__breakdown">
        <div className="gap-row">
          <span className="gap-row__label">Amount needed</span>
          <span className="gap-row__value">{inr(totalNeededPaise)}</span>
        </div>
        <div className="gap-row">
          <span className="gap-row__label">Already available</span>
          <span className="gap-row__value gap-row__value--positive">
            – {inr(alreadyAvailablePaise)}
          </span>
        </div>
        <div className="gap-row gap-row--total">
          <span className="gap-row__label">Funding gap</span>
          <span
            className={`gap-row__value ${hasGap ? "gap-row__value--gap" : "gap-row__value--covered"}`}
          >
            {hasGap ? inr(fundingGapPaise) : "Fully covered"}
          </span>
        </div>
        <div className="gap-row">
          <span className="gap-row__label">Required by</span>
          <span className="gap-row__value">{requiredByDate}</span>
        </div>
      </div>

      {!hasGap && (
        <div className="funding-gap-result__notice funding-gap-result__notice--ok">
          You appear to have enough available. Consider whether you need a loan
          at all — borrowing has costs. The options below are shown for
          completeness.
        </div>
      )}

      {hasGap && (
        <div className="funding-gap-result__notice">
          This is a calculated shortfall, not a credit decision. The next
          screen shows non-credit alternatives before any loan comparison.
        </div>
      )}

      <div className="funding-gap-result__actions">
        <button
          id="funding-gap-back"
          className="btn btn--ghost"
          onClick={onBack}
        >
          Back
        </button>
        <button
          id="funding-gap-continue"
          className="btn btn--primary"
          onClick={onContinue}
        >
          See options
        </button>
      </div>
    </div>
  );
}
