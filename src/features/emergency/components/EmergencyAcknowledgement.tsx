"use client";

// ── Screen 1: Serious Acknowledgement ──
// No humor. No emojis in tone. Calm and supportive.
// This is a pure UI component — it does not affect financial eligibility.

import React from "react";
import type { EmergencyCategory } from "@/core/finance/emergency";

interface Props {
  category: EmergencyCategory;
  onContinue: () => void;
  onDismiss: () => void;
}

const CATEGORY_TEXT: Record<EmergencyCategory, { heading: string; body: string }> = {
  medical:
    { heading: "Medical Emergency Support", body: "I can help you understand your options. If someone needs immediate medical attention, please contact emergency services (112) first." },
  family:
    { heading: "Family Emergency Support", body: "I understand this is a difficult moment. Let me help you look at your financial options clearly and calmly." },
  housing:
    { heading: "Housing Emergency Support", body: "Finding yourself in a housing crisis is stressful. Let me walk you through what options may be available." },
  education:
    { heading: "Education Fee Support", body: "Missing a fee deadline can feel urgent. Let me help you assess your options step by step." },
  income_disruption:
    { heading: "Income Disruption Support", body: "Losing income unexpectedly is difficult. Let me help you understand what financial options may be available." },
  other:
    { heading: "Financial Emergency Support", body: "Let me help you think through your options clearly and without judgment." },
};

export function EmergencyAcknowledgement({ category, onContinue, onDismiss }: Props) {
  const { heading, body } = CATEGORY_TEXT[category];

  return (
    <div className="emergency-acknowledgement">
      <h1 className="emergency-acknowledgement__heading">{heading}</h1>

      <p className="emergency-acknowledgement__body">{body}</p>

      <div className="emergency-acknowledgement__notice">
        <strong>Important:</strong> PocketPilot is not a lender. This is an
        affordability assessment and simulation, not a loan approval. Any
        final credit decision belongs to an RBI-regulated bank or NBFC.
      </div>

      <div className="emergency-acknowledgement__safe-mode">
        <span className="emergency-acknowledgement__badge">Serious Mode Active</span>
        <span>No humor. No judgment. Calm and accurate information only.</span>
      </div>

      <div className="emergency-acknowledgement__actions">
        <button
          id="emergency-continue-btn"
          className="btn btn--primary"
          onClick={onContinue}
        >
          Continue to assessment
        </button>
        <button
          id="emergency-dismiss-btn"
          className="btn btn--ghost"
          onClick={onDismiss}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
