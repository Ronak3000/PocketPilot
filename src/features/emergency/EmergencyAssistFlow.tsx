"use client";

// ── Emergency Assist Flow Orchestrator ──
// Wires all 8 screens together.
// State machine: each step is explicit.

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { EmergencyCategory } from "@/core/finance/emergency";
import {
  checkInsuranceBoundary,
  compareEmergencyFundingOffers,
} from "@/core/finance/emergency";
import type { ConsentDecision, OfferAffordabilityResult } from "@/core/finance/emergency";
import { mockFundingProviderAdapter } from "./providers/mock-adapter";
import type { FundingOffer } from "./providers/types";
import { EmergencyAcknowledgement } from "./components/EmergencyAcknowledgement";
import { EmergencyAmountForm } from "./components/EmergencyAmountForm";
import { ConsentGate } from "./components/ConsentGate";
import { FundingGapResult } from "./components/FundingGapResult";
import { NonCreditAlternatives } from "./components/NonCreditAlternatives";
import { LoanOfferComparison } from "./components/LoanOfferComparison";
import { EligibilityExplanation } from "./components/EligibilityExplanation";
import { LenderHandoff } from "./components/LenderHandoff";

type Step =
  | "acknowledge"
  | "amount"
  | "consent"
  | "funding_gap"
  | "alternatives"
  | "offers"
  | "eligibility"
  | "handoff"
  | "closed";

interface EmergencyAssistProps {
  /** Emergency category detected from chat or user selection. */
  category: EmergencyCategory;
  /** Saved profile data for pre-filling (requires consent). */
  savedProfile?: {
    currentBalancePaise: number;
    monthlyIncomePaise: number;
    nextIncomeDate: string;
    protectedBalanceFloorPaise: number;
    protectedMonthlyExpensesPaise: number;
    existingMonthlyEmiPaise: number;
    activeGoalMonthlyContributionPaise: number;
    name: string;
  };
  onClose: () => void;
}

const SAVED_PROFILE_FIELD_LABELS = [
  "Current account balance",
  "Monthly income",
  "Next income date",
  "Protected balance floor",
  "Protected monthly expenses",
  "Existing monthly EMIs",
  "Savings goal contribution",
];

export function EmergencyAssistFlow({ category, savedProfile, onClose }: EmergencyAssistProps) {
  const [step, setStep] = useState<Step>("acknowledge");
  const [amountData, setAmountData] = useState<{
    totalNeededPaise: number;
    alreadyAvailablePaise: number;
    requiredByDate: string;
  } | null>(null);
  const [fundingGapPaise, setFundingGapPaise] = useState(0);
  const [offerResults, setOfferResults] = useState<OfferAffordabilityResult[]>([]);
  const [offers, setOffers] = useState<FundingOffer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const userName = savedProfile?.name ?? "there";

  // Use a ref so handleAmountSubmit can reference handleConsentDecision before it is declared.
  const handleConsentDecisionRef = useRef<((decision: ConsentDecision, data?: { totalNeededPaise: number; alreadyAvailablePaise: number; requiredByDate: string }) => Promise<void>) | undefined>(undefined);


  const handleConsentDecision = useCallback(
    async (
      decision: ConsentDecision,
      data?: { totalNeededPaise: number; alreadyAvailablePaise: number; requiredByDate: string },
    ) => {
      const resolved = data ?? amountData;
      if (!resolved) return;

      if (decision === "decline" || decision === "delete_assessment") {
        onClose();
        return;
      }

      const useProfile =
        (decision === "allow_once" || decision === "temporary_chat") && savedProfile;

      const ctx = useProfile
        ? {
            category,
            totalNeededPaise: resolved.totalNeededPaise,
            alreadyAvailablePaise: resolved.alreadyAvailablePaise,
            requiredByDate: resolved.requiredByDate,
            currentBalancePaise: savedProfile.currentBalancePaise,
            monthlyIncomePaise: savedProfile.monthlyIncomePaise,
            nextIncomeDate: savedProfile.nextIncomeDate,
            protectedBalanceFloorPaise: savedProfile.protectedBalanceFloorPaise,
            protectedMonthlyExpensesPaise: savedProfile.protectedMonthlyExpensesPaise,
            existingMonthlyEmiPaise: savedProfile.existingMonthlyEmiPaise,
            activeGoalMonthlyContributionPaise: savedProfile.activeGoalMonthlyContributionPaise,
            asOfDate: today,
          }
        : {
            // Manual entry — all zero until user provides values
            category,
            totalNeededPaise: resolved.totalNeededPaise,
            alreadyAvailablePaise: resolved.alreadyAvailablePaise,
            requiredByDate: resolved.requiredByDate,
            currentBalancePaise: 0,
            monthlyIncomePaise: 0,
            nextIncomeDate: today,
            protectedBalanceFloorPaise: 0,
            protectedMonthlyExpensesPaise: 0,
            existingMonthlyEmiPaise: 0,
            activeGoalMonthlyContributionPaise: 0,
            asOfDate: today,
          };

      setIsLoading(true);
      try {
        const gap = Math.max(0, ctx.totalNeededPaise - ctx.alreadyAvailablePaise);
        setFundingGapPaise(gap);

        const rawOffers = await mockFundingProviderAdapter.listOffers({
          principalPaise: gap,
          asOfDate: today,
        });
        setOffers(rawOffers);

        const comparison = compareEmergencyFundingOffers({ context: ctx, offers: rawOffers });
        setOfferResults(comparison.offers);
        setStep("funding_gap");
      } finally {
        setIsLoading(false);
      }
    },
    [amountData, category, onClose, savedProfile, today],
  );

  // Keep the ref in sync so handleAmountSubmit can call it without forward-ref issues
  useEffect(() => {
    handleConsentDecisionRef.current = handleConsentDecision;
  }, [handleConsentDecision]);

  const handleAmountSubmit = useCallback(
    (data: { totalNeededPaise: number; alreadyAvailablePaise: number; requiredByDate: string }) => {
      setAmountData(data);
      if (savedProfile) {
        setStep("consent");
      } else {
        void handleConsentDecisionRef.current?.("manual_entry", data);
      }
    },
    [savedProfile],
  );

  const insuranceBoundary = checkInsuranceBoundary({
    emergencyAlreadyOccurred: true,
    hasExistingInsurance: false,
  });

  const selectedOffer = offers.find((o) => o.id === selectedOfferId) ?? null;
  const selectedResult = offerResults.find((r) => r.offerId === selectedOfferId) ?? null;

  if (step === "closed") {
    return null;
  }

  return (
    <div className="emergency-assist" role="dialog" aria-modal="true" aria-label="Emergency Assist">
      <div className="emergency-assist__inner">
        {isLoading && (
          <div className="emergency-assist__loading" aria-live="polite">
            Running assessment...
          </div>
        )}

        {!isLoading && step === "acknowledge" && (
          <EmergencyAcknowledgement
            category={category}
            onContinue={() => setStep("amount")}
            onDismiss={onClose}
          />
        )}

        {!isLoading && step === "amount" && (
          <EmergencyAmountForm
            onSubmit={handleAmountSubmit}
            onBack={() => setStep("acknowledge")}
          />
        )}

        {!isLoading && step === "consent" && (
          <ConsentGate
            fieldsToUse={SAVED_PROFILE_FIELD_LABELS}
            onDecision={handleConsentDecision}
          />
        )}

        {!isLoading && step === "funding_gap" && amountData && (
          <FundingGapResult
            totalNeededPaise={amountData.totalNeededPaise}
            alreadyAvailablePaise={amountData.alreadyAvailablePaise}
            fundingGapPaise={fundingGapPaise}
            requiredByDate={amountData.requiredByDate}
            onContinue={() => setStep("alternatives")}
            onBack={() => setStep("consent")}
          />
        )}

        {!isLoading && step === "alternatives" && (
          <NonCreditAlternatives
            alternatives={insuranceBoundary.applicableAlternatives}
            newInsuranceInapplicable={insuranceBoundary.newInsuranceInapplicable}
            onContinue={() => setStep("offers")}
            onBack={() => setStep("funding_gap")}
          />
        )}

        {!isLoading && step === "offers" && (
          <LoanOfferComparison
            offers={offers}
            offerResults={offerResults}
            fundingGapPaise={fundingGapPaise}
            onSelectOffer={(id) => {
              setSelectedOfferId(id);
              setStep("eligibility");
            }}
            onBack={() => setStep("alternatives")}
          />
        )}

        {!isLoading && step === "eligibility" && selectedResult && selectedOffer && (
          <EligibilityExplanation
            result={selectedResult}
            providerName={selectedOffer.providerDisplayName}
            onProceedToHandoff={() => setStep("handoff")}
            onBack={() => setStep("offers")}
          />
        )}

        {!isLoading && step === "handoff" && selectedOffer && selectedResult && (
          <LenderHandoff
            offer={selectedOffer}
            result={selectedResult}
            userName={userName}
            onStartOver={() => setStep("acknowledge")}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
