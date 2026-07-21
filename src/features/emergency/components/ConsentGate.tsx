"use client";

// ── Screen 3: Consent Gate ──
// Before using saved financial profile data, show exactly which fields
// will be used and ask for explicit permission.
// 5 choices: allow once / decline / manual entry / temporary chat / discard assessment.

import React from "react";
import type { ConsentDecision } from "@/core/finance/emergency";

interface Props {
  /** Which specific fields from the saved profile will be read. */
  fieldsToUse: string[];
  onDecision: (decision: ConsentDecision) => void;
}

export function ConsentGate({ fieldsToUse, onDecision }: Props) {
  return (
    <div className="consent-gate">
      <h2 className="consent-gate__heading">Use your saved financial profile?</h2>

      <p className="consent-gate__body">
        To run the affordability assessment, I need the following details. I can
        read them from your saved profile, or you can enter them manually.
      </p>

      <div className="consent-gate__fields">
        <p className="consent-gate__fields-label">Fields that will be used:</p>
        <ul className="consent-gate__field-list" aria-label="Profile fields to be used">
          {fieldsToUse.map((field) => (
            <li key={field} className="consent-gate__field-item">
              {field}
            </li>
          ))}
        </ul>
      </div>

      <div className="consent-gate__notice">
        Your data is used only to run this calculation. It is not shared with
        any lender or third party. This assessment does not affect your credit score.
      </div>

      <div className="consent-gate__options">
        <button
          id="consent-allow-once"
          className="btn btn--primary consent-gate__btn"
          onClick={() => onDecision("allow_once")}
        >
          Use my saved profile for this assessment
        </button>

        <button
          id="consent-manual-entry"
          className="btn btn--secondary consent-gate__btn"
          onClick={() => onDecision("manual_entry")}
        >
          I will enter my details manually
        </button>

        <button
          id="consent-temporary-chat"
          className="btn btn--secondary consent-gate__btn"
          onClick={() => onDecision("temporary_chat")}
        >
          Continue without saving anything
        </button>

        <button
          id="consent-delete"
          className="btn btn--ghost consent-gate__btn"
          onClick={() => onDecision("delete_assessment")}
        >
          Discard this assessment
        </button>

        <button
          id="consent-decline"
          className="btn btn--ghost consent-gate__btn"
          onClick={() => onDecision("decline")}
        >
          Not now — go back
        </button>
      </div>
    </div>
  );
}
