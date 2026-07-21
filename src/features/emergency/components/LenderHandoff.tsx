"use client";

// ── Screen 8: Simulated Lender Handoff ──
// Clearly marked as simulation throughout.
// PocketPilot does not initiate any real loan application.
// No KYC, Aadhaar, PAN or bank data is collected here.

import React from "react";
import type { OfferAffordabilityResult } from "@/core/finance/emergency";
import type { FundingOffer } from "../providers/types";

interface Props {
  offer: FundingOffer;
  result: OfferAffordabilityResult;
  userName: string;
  onStartOver: () => void;
  onClose: () => void;
}

function inr(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function bpToPercent(bp: number): string {
  return `${(bp / 100).toFixed(2)}%`;
}

export function LenderHandoff({ offer, result, userName, onStartOver, onClose }: Props) {
  return (
    <div className="lender-handoff">
      <div className="lender-handoff__simulation-banner">
        SIMULATION — NOT A REAL LOAN APPLICATION
      </div>

      <h2 className="lender-handoff__heading">
        Next Step: Apply with a Regulated Lender
      </h2>

      <div className="lender-handoff__summary">
        <p>
          Hi <strong>{userName}</strong>, here is a summary of what you would
          share with <strong>{offer.providerDisplayName}</strong> if you
          proceeded.
        </p>

        <table className="handoff-table" aria-label="Loan summary for handoff">
          <tbody>
            <tr><td>Loan Amount</td><td>{inr(offer.principalPaise)}</td></tr>
            <tr><td>APR</td><td>{bpToPercent(offer.annualRateBasisPoints)} p.a.</td></tr>
            <tr><td>Monthly EMI</td><td>{inr(result.monthlyEmiPaise)}</td></tr>
            <tr><td>Tenure</td><td>{offer.tenureMonths} months</td></tr>
            <tr><td>Processing Fee</td><td>{inr(offer.processingFeePaise)}</td></tr>
            <tr><td>Total Repayment</td><td>{inr(result.totalRepaymentPaise)}</td></tr>
            <tr><td>Final Repayment Date</td><td>{result.finalRepaymentDate}</td></tr>
            <tr><td>Disbursal (estimate)</td><td>{result.disbursalDate}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="lender-handoff__eligibility">
        <strong>Eligibility criteria (as stated by simulated provider):</strong>
        <ul>
          {offer.eligibilityCriteria.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>

      <div className="lender-handoff__what-happens-next">
        <h3>What would happen next (in a real application)</h3>
        <ol>
          <li>You visit the lender&apos;s verified platform directly.</li>
          <li>The lender performs their own KYC, credit bureau, and income verification.</li>
          <li>The lender makes an independent credit decision — PocketPilot has no role.</li>
          <li>If approved, the lender disburses directly to your account.</li>
        </ol>
      </div>

      <div className="lender-handoff__disclaimer-box">
        <strong>Important Disclaimer</strong>
        <p>{offer.disclaimer}</p>
        <p>
          PocketPilot does not collect your PAN, Aadhaar, bank details or any
          document for this simulation. No real application has been submitted.
          This screen is for educational and planning purposes only.
        </p>
      </div>

      <div className="lender-handoff__not-collected">
        <strong>What PocketPilot does NOT collect or store:</strong>
        <ul>
          <li>PAN or Aadhaar number</li>
          <li>Bank account details</li>
          <li>Credit bureau data</li>
          <li>Medical documents</li>
          <li>Contact list or location</li>
        </ul>
      </div>

      <div className="lender-handoff__actions">
        <button
          id="handoff-start-over"
          className="btn btn--ghost"
          onClick={onStartOver}
        >
          Start a new assessment
        </button>
        <button
          id="handoff-close"
          className="btn btn--primary"
          onClick={onClose}
        >
          Close Emergency Assist
        </button>
      </div>
    </div>
  );
}
