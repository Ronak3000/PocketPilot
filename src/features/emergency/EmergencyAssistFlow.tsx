"use client";

import { useCallback, useState } from "react";
import {
  checkInsuranceBoundary,
  validateEmergencyContext,
  type ConsentDecision,
  type EmergencyCategory,
  type EmergencyContext,
  type OfferAffordabilityResult,
} from "@/core/finance/emergency";
import { requestEmergencyAssessment } from "./api";
import { ConsentGate } from "./components/ConsentGate";
import { EligibilityExplanation } from "./components/EligibilityExplanation";
import { EmergencyAcknowledgement } from "./components/EmergencyAcknowledgement";
import { EmergencyAmountForm } from "./components/EmergencyAmountForm";
import { FundingGapResult } from "./components/FundingGapResult";
import { LenderHandoff } from "./components/LenderHandoff";
import { LoanOfferComparison } from "./components/LoanOfferComparison";
import {
  ManualFinancialContextForm,
  type ManualFinancialContext,
} from "./components/ManualFinancialContextForm";
import { NonCreditAlternatives } from "./components/NonCreditAlternatives";
import type { FundingOffer } from "./providers/types";

type Step =
  | "acknowledge"
  | "amount"
  | "consent"
  | "manual"
  | "funding_gap"
  | "alternatives"
  | "offers"
  | "eligibility"
  | "handoff";

interface SavedProfile extends ManualFinancialContext {
  name: string;
  activeGoal?: {
    id: string;
    targetAmountPaise: number;
    currentAmountPaise: number;
    contributionDayOfMonth: number;
  };
  maximumEmiRatioBasisPoints?: number;
  maximumTenureMonths?: number;
}

interface Props {
  category: EmergencyCategory;
  asOfDate: string;
  savedProfile?: SavedProfile;
  onClose: () => void;
}

interface AmountData {
  totalNeededPaise: number;
  alreadyAvailablePaise: number;
  requiredByDate: string;
  hasExistingInsurance: boolean;
}

const SAVED_PROFILE_FIELD_LABELS = [
  "Current account balance",
  "Monthly income and next income date",
  "Protected balance and essential expenses",
  "Existing EMIs and savings-goal contribution",
  "Money Constitution limits",
];

export function EmergencyAssistFlow({ category, asOfDate, savedProfile, onClose }: Props) {
  const [step, setStep] = useState<Step>("acknowledge");
  const [amountData, setAmountData] = useState<AmountData | null>(null);
  const [fundingGapPaise, setFundingGapPaise] = useState(0);
  const [offerResults, setOfferResults] = useState<OfferAffordabilityResult[]>([]);
  const [offers, setOffers] = useState<FundingOffer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const runAssessment = useCallback(
    async (financial: ManualFinancialContext, profile?: SavedProfile) => {
      if (!amountData) return;
      const context: EmergencyContext = {
        category,
        ...amountData,
        ...financial,
        asOfDate,
        activeGoal: profile?.activeGoal,
        maximumEmiRatioBasisPoints: profile?.maximumEmiRatioBasisPoints,
        maximumTenureMonths: profile?.maximumTenureMonths,
      };
      const validation = validateEmergencyContext(context);
      if (validation.status !== "COMPLETE") {
        setError(validation.missingFieldQuestion ?? "More financial context is required.");
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const { offers: rawOffers, comparison } = await requestEmergencyAssessment(
          validation.context!,
        );
        setFundingGapPaise(comparison.fundingGapPaise);
        setOffers(rawOffers);
        setOfferResults(comparison.offers);
        setStep("funding_gap");
      } catch (assessmentError) {
        setError(
          assessmentError instanceof Error
            ? assessmentError.message
            : "The assessment could not be completed.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [amountData, asOfDate, category],
  );

  function handleAmountSubmit(data: AmountData) {
    setAmountData(data);
    setStep(savedProfile ? "consent" : "manual");
  }

  function handleConsentDecision(decision: ConsentDecision) {
    if (decision === "decline" || decision === "delete_assessment") {
      onClose();
      return;
    }
    if (decision === "manual_entry" || !savedProfile) {
      setStep("manual");
      return;
    }
    void runAssessment(savedProfile, savedProfile);
  }

  const insuranceBoundary = checkInsuranceBoundary({
    emergencyAlreadyOccurred: true,
    hasExistingInsurance: amountData?.hasExistingInsurance ?? false,
  });
  const selectedOffer = offers.find((offer) => offer.id === selectedOfferId) ?? null;
  const selectedResult =
    offerResults.find((result) => result.offerId === selectedOfferId) ?? null;

  return (
    <div className="emergency-assist" role="dialog" aria-modal="true" aria-label="Emergency Assist">
      <div className="emergency-assist__inner">
        {error && <p className="emergency-assist__error" role="alert">{error}</p>}
        {isLoading && <div className="emergency-assist__loading" aria-live="polite">Running assessment…</div>}

        {!isLoading && step === "acknowledge" && (
          <EmergencyAcknowledgement
            category={category}
            onContinue={() => setStep("amount")}
            onDismiss={onClose}
          />
        )}
        {!isLoading && step === "amount" && (
          <EmergencyAmountForm
            asOfDate={asOfDate}
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
        {!isLoading && step === "manual" && (
          <ManualFinancialContextForm
            asOfDate={asOfDate}
            onSubmit={(financial) => void runAssessment(financial)}
            onBack={() => setStep(savedProfile ? "consent" : "amount")}
          />
        )}
        {!isLoading && step === "funding_gap" && amountData && (
          <FundingGapResult
            totalNeededPaise={amountData.totalNeededPaise}
            alreadyAvailablePaise={amountData.alreadyAvailablePaise}
            fundingGapPaise={fundingGapPaise}
            requiredByDate={amountData.requiredByDate}
            onContinue={() => fundingGapPaise > 0 ? setStep("alternatives") : onClose()}
            onBack={() => setStep(savedProfile ? "consent" : "manual")}
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
            onSelectOffer={(offerId) => { setSelectedOfferId(offerId); setStep("eligibility"); }}
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
            userName={savedProfile?.name ?? "there"}
            onStartOver={() => setStep("acknowledge")}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
