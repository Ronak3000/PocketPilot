"use client";

// ── Screen 5: Non-Credit Alternatives ──
// Shown before loan comparisons. Neutral — no ranking by favorability.
// PocketPilot does not sell insurance or financial products.

import React from "react";
import {
  NON_CREDIT_ALTERNATIVE_LABELS,
  type NonCreditAlternative,
} from "@/core/finance/emergency";

interface Props {
  alternatives: NonCreditAlternative[];
  newInsuranceInapplicable: boolean;
  onContinue: () => void;
  onBack: () => void;
}

const ALTERNATIVE_DETAILS: Record<NonCreditAlternative, string> = {
  existing_insurance_claim:
    "Contact your insurer directly. Review your policy document for claim procedures and timelines.",
  hospital_payment_plan:
    "Many hospitals offer installment plans for large bills. Ask the billing department.",
  employer_salary_advance:
    "Check your HR policy or speak to your manager. Many employers offer this for genuine emergencies.",
  family_support:
    "A trusted family member may be able to help. Be clear about repayment expectations to protect the relationship.",
  government_charity_scheme:
    "Government schemes like PM-JAY (health), state welfare funds, or registered charities may apply. Verify eligibility.",
  regulated_credit_simulation:
    "If other options are insufficient, regulated credit is available. See the next screen for a simulation.",
};

export function NonCreditAlternatives({
  alternatives,
  newInsuranceInapplicable,
  onContinue,
  onBack,
}: Props) {
  return (
    <div className="non-credit-alternatives">
      <h2 className="non-credit-alternatives__heading">
        Options Before Borrowing
      </h2>
      <p className="non-credit-alternatives__subheading">
        These options may reduce or eliminate the need for a loan. They are
        listed for your awareness — PocketPilot does not sell or recommend any
        specific product.
      </p>

      {newInsuranceInapplicable && (
        <div className="non-credit-alternatives__insurance-notice">
          A new insurance policy cannot cover an emergency that has already
          happened. Any existing policy claim is listed below where applicable.
        </div>
      )}

      <ul className="alternatives-list" aria-label="Non-credit alternatives">
        {alternatives.map((alt) => (
          <li key={alt} className="alternatives-list__item">
            <div className="alternatives-list__label">
              {NON_CREDIT_ALTERNATIVE_LABELS[alt]}
            </div>
            <div className="alternatives-list__detail">
              {ALTERNATIVE_DETAILS[alt]}
            </div>
          </li>
        ))}
      </ul>

      <div className="non-credit-alternatives__actions">
        <button
          id="alternatives-back"
          className="btn btn--ghost"
          onClick={onBack}
        >
          Back
        </button>
        <button
          id="alternatives-continue"
          className="btn btn--primary"
          onClick={onContinue}
        >
          See regulated credit simulation
        </button>
      </div>
    </div>
  );
}
