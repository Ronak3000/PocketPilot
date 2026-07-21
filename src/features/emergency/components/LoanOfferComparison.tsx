"use client";

// ── Screen 6: Mock Loan Offer Comparison ──
// Transparent side-by-side display of simulated offers.
// Sorted by deadline and financial safety, then total repayment.
// NOT called "approval". Clearly labelled as simulation.

import React, { useState } from "react";
import type { OfferAffordabilityResult } from "@/core/finance/emergency";
import type { FundingOffer } from "../providers/types";

interface Props {
  offers: FundingOffer[];
  offerResults: OfferAffordabilityResult[];
  fundingGapPaise: number;
  onSelectOffer: (offerId: string) => void;
  onBack: () => void;
}

function inr(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function bpToPercent(bp: number): string {
  return `${(bp / 100).toFixed(2)}%`;
}

function riskBadge(result: OfferAffordabilityResult): { label: string; cls: string } {
  if (!result.arrivesByRequiredDate || result.negativeBalanceDays > 0 || result.protectedBalanceBreach) {
    return { label: "High Risk", cls: "badge--risk-high" };
  }
  if (!result.constitutionCompliant) {
    return { label: "Caution", cls: "badge--risk-caution" };
  }
  return { label: "Manageable", cls: "badge--risk-ok" };
}

export function LoanOfferComparison({
  offers,
  offerResults,
  fundingGapPaise,
  onSelectOffer,
  onBack,
}: Props) {
  const [expandedKfs, setExpandedKfs] = useState<string | null>(null);

  // Merge offer metadata with affordability results
  const merged = offerResults.map((result) => ({
    result,
    offer: offers.find((o) => o.id === result.offerId)!,
  }));

  return (
    <div className="loan-offer-comparison">
      <h2 className="loan-offer-comparison__heading">
        Regulated Credit — Simulation
      </h2>

      <div className="loan-offer-comparison__disclaimer-banner">
        <strong>Simulation only.</strong> These are not real loan offers.
        PocketPilot is not a lender. Final approval and disbursement belong to
        an RBI-regulated bank or NBFC. Do not treat this as a guarantee.
      </div>

      <p className="loan-offer-comparison__subheading">
        Funding gap: <strong>{inr(fundingGapPaise)}</strong>
        &nbsp;· Safety and deadline first, then total cost.
      </p>

      <div className="loan-offer-comparison__assessment-note">
        <strong>PocketPilot Affordability Assessment</strong> →
        <strong> Provider Pre-qualification</strong> →
        <strong> Final Lender Approval</strong>
        <br />
        <small>You are viewing the assessment stage only.</small>
      </div>

      <div className="offers-grid">
        {merged.map(({ result, offer }, idx) => {
          if (!offer) return null;
          const badge = riskBadge(result);
          return (
            <div
              key={result.offerId}
              className={`offer-card ${idx === 0 ? "offer-card--recommended" : ""}`}
              id={`offer-card-${result.offerId}`}
            >
              {idx === 0 && (
                <div className="offer-card__tag">Safest of shown</div>
              )}

              <div className="offer-card__provider">
                {offer.providerDisplayName}
              </div>

              <div className="offer-card__amount">{inr(offer.principalPaise)}</div>

              <table className="offer-table" aria-label={`Offer from ${offer.providerDisplayName}`}>
                <tbody>
                  <tr>
                    <td>APR</td>
                    <td><strong>{bpToPercent(offer.annualRateBasisPoints)} p.a.</strong></td>
                  </tr>
                  <tr>
                    <td>Monthly EMI</td>
                    <td><strong>{inr(result.monthlyEmiPaise)}</strong></td>
                  </tr>
                  <tr>
                    <td>Tenure</td>
                    <td>{offer.tenureMonths} months</td>
                  </tr>
                  <tr>
                    <td>Processing Fee</td>
                    <td>{inr(offer.processingFeePaise)}</td>
                  </tr>
                  <tr>
                    <td>Total Repayment</td>
                    <td><strong>{inr(result.totalRepaymentPaise)}</strong></td>
                  </tr>
                  <tr>
                    <td>Post-loan EMI ratio</td>
                    <td>{bpToPercent(result.postLoanEmiRatioBasisPoints)}</td>
                  </tr>
                  <tr>
                    <td>Disbursal (estimate)</td>
                    <td>{result.disbursalDate}</td>
                  </tr>
                  <tr>
                    <td>Final repayment</td>
                    <td>{result.finalRepaymentDate}</td>
                  </tr>
                </tbody>
              </table>

              <div className={`offer-card__badge ${badge.cls}`}>{badge.label}</div>

              {result.protectedBalanceBreach && (
                <div className="offer-card__warning">
                  Warning: This loan may cause your balance to fall below your
                  protected floor.
                </div>
              )}
              {!result.arrivesByRequiredDate && (
                <div className="offer-card__warning">
                  Estimated disbursal is after your required date.
                </div>
              )}
              {!result.constitutionCompliant && (
                <div className="offer-card__warning">
                  This offer conflicts with a limit in your Money Constitution.
                </div>
              )}
              {result.goalDelayDays && result.goalDelayDays > 0 && (
                <div className="offer-card__info">
                  Estimated savings goal delay: ~{result.goalDelayDays} days.
                </div>
              )}

              <button
                className="btn btn--text offer-card__kfs-btn"
                id={`kfs-toggle-${result.offerId}`}
                onClick={() =>
                  setExpandedKfs(
                    expandedKfs === result.offerId ? null : result.offerId,
                  )
                }
              >
                {expandedKfs === result.offerId ? "Hide" : "View"} Key Fact Statement
              </button>

              {expandedKfs === result.offerId && (
                <pre className="offer-card__kfs">{offer.keyFactStatement}</pre>
              )}

              <button
                id={`select-offer-${result.offerId}`}
                className="btn btn--primary offer-card__select"
                onClick={() => onSelectOffer(result.offerId)}
              >
                See eligibility details
              </button>
            </div>
          );
        })}
      </div>

      <div className="loan-offer-comparison__actions">
        <button id="offers-back" className="btn btn--ghost" onClick={onBack}>
          Back to alternatives
        </button>
      </div>
    </div>
  );
}
